import {
  ArrowRight,
  AlertCircle,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  FilePlus2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserRoundCheck,
  Users,
  Wrench,
  X,
} from "lucide-react";

import {
  useEffect,
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { api } from "../../api/axios";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchServices } from "../../services/ServicesSlice";
import { createCustomerAddress, fetchCustomers } from "../../services/CustomerSlice";

import { useEnquiryManagementViewModel } from "../../viewmodels/admin/UseEnquiryManagementModel";
import { useAssignableEmployees } from "../../viewmodels/shared/UseAssignableEmployees";

import {
  addEnquiry as addEnquiryApi,
  updateEnquiryApi,
  clearEnquiryError,
  fetchEnquiries,
  type Enquiry,
  type Priority,
  type EnquiryStatus,
} from "../../services/EnquiriesSlice";

import {
  convertEnquiryToBookingApi,
} from "../../services/ServiceRequestsSlice";


/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

/* -------------------------------------------------------------------------- */
/* Demo data                                                                   */
/* -------------------------------------------------------------------------- */

const statusStyles: Record<EnquiryStatus, string> = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-amber-50 text-amber-700",
  Assigned: "bg-violet-50 text-violet-700",
  Converted: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-amber-50 text-amber-700",
  High: "bg-red-50 text-red-700",
};

const today = () => new Date().toISOString().slice(0, 10);

interface ManagerOption {
  id: string;
  name: string;
}

const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;

const extractManagerPage = (response: unknown) => {
  const root = asRecord(response) ?? {};
  const body = asRecord(root.data) ?? root;
  const nested = asRecord(body.data);
  const rows = Array.isArray(root.data)
    ? root.data
    : Array.isArray(body.items)
      ? body.items
      : Array.isArray(body.managers)
        ? body.managers
        : Array.isArray(body.data)
          ? body.data
          : Array.isArray(root.items)
            ? root.items
            : Array.isArray(root.managers)
              ? root.managers
              : [];
  const pagination = asRecord(root.pagination)
    ?? asRecord(root.meta)
    ?? asRecord(body.pagination)
    ?? asRecord(body.meta)
    ?? asRecord(nested?.pagination)
    ?? asRecord(nested?.meta);
  return { rows, totalPages: Number(pagination?.totalPages ?? pagination?.pages ?? 1) || 1 };
};

const managerLoadError = (error: unknown): string => {
  const response = asRecord(asRecord(error)?.response);
  const data = asRecord(response?.data);
  const message = data?.message;
  if (Array.isArray(message)) return message.join(", ");
  if (typeof message === "string") return message;
  if (response?.status === 403) return "Your account is not authorized to view managers.";
  if (response?.status === 401) return "Your session has expired. Sign in again to load managers.";
  return error instanceof Error ? error.message : "Could not load managers from the server.";
};

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function EnquiryManagement() {

  const {
  enquiries,
  filteredEnquiries,
  loading: enquiriesLoading,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  totalEnquiries,
  newEnquiries,
  assignedEnquiries,
  convertedEnquiries,
} = useEnquiryManagementViewModel();

  const dispatch = useAppDispatch();
  const { employees: staff } = useAssignableEmployees();
  const [managers, setManagers] = useState<ManagerOption[]>([]);
  const [managerRecordsCount, setManagerRecordsCount] = useState<number | null>(null);
  const [managersLoading, setManagersLoading] = useState(false);
  const [managersError, setManagersError] = useState("");
  const technicians = staff.filter((person) => {
    const role = `${person.role ?? ""} ${person.designation}`.toLowerCase();
    return role.includes("technician") || role.includes("engineer");
  });
  const services = useAppSelector((state) => state.services.items);
  const customers = useAppSelector((state) => state.customers.customers);
  const customersLoading = useAppSelector((state) => state.customers.loading);
  const customersError = useAppSelector((state) => state.customers.error);

  useEffect(() => {
    void dispatch(fetchServices());
    void dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    let active = true;
    const loadManagers = async () => {
      setManagersLoading(true);
      setManagersError("");
      try {
        const first = await api.get("/managers", { params: { page: 1, limit: 100 } });
        const firstPage = extractManagerPage(first.data);
        const rows = [...firstPage.rows];
        const totalPages = Math.min(firstPage.totalPages, 100);
        for (let page = 2; page <= totalPages; page += 1) {
          const response = await api.get("/managers", { params: { page, limit: 100 } });
          rows.push(...extractManagerPage(response.data).rows);
        }
        const options = rows.flatMap((value): ManagerOption[] => {
          const manager = asRecord(value);
          const user = asRecord(manager?.user);
          if (typeof manager?.id !== "string" || user?.isActive !== true) return [];
          const name = [user.firstName, user.lastName]
            .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
            .join(" ");
          return [{ id: manager.id, name: name || String(manager.title || "Manager") }];
        });
        if (active) {
          setManagerRecordsCount(rows.length);
          setManagers(options);
        }
      } catch (error) {
        if (active) {
          setManagersError(managerLoadError(error));
        }
      } finally {
        if (active) setManagersLoading(false);
      }
    };
    void loadManagers();
    return () => { active = false; };
  }, []);

  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const selectedCustomer = customers.find((customer) => customer.id === selectedCustomerId);
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [newLocationAddress, setNewLocationAddress] = useState("");
  const [newLocationCity, setNewLocationCity] = useState("");
  const [newLocationState, setNewLocationState] = useState("");
  const [newLocationPincode, setNewLocationPincode] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [enquiryFormError, setEnquiryFormError] = useState("");
  const [isSavingEnquiry, setIsSavingEnquiry] = useState(false);
  const [enquirySaveNotice, setEnquirySaveNotice] = useState("");
  const [showService, setShowService] = useState(false);

  const [serviceDate, setServiceDate] = useState(today());
  const [preferredTime, setPreferredTime] = useState("10:30");
  const [serviceNotes, setServiceNotes] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [servicePriority, setServicePriority] = useState<Priority>("Medium");
  const [assignedManagerId, setAssignedManagerId] = useState("");
  const selectedManager = managers.find((manager) => manager.id === assignedManagerId);
  const employeeDesignatedManagers = staff.filter((employee) =>
    `${employee.role ?? ""} ${employee.designation}`.toLowerCase().includes("manager"),
  );
  const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
  const [assignmentError, setAssignmentError] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    customerName: "",
    company: "",
    phone: "",
    email: "",
    service: "",
    serviceId: "",
    message: "",
    priority: "Medium" as Priority,
  });

    const updateEnquiry = async (
      id: string,
      updates: Partial<Enquiry>
    ) => {
      try {
        const updated = await dispatch(
          updateEnquiryApi({ id, updates })
        ).unwrap();

        setSelected((current) =>
          current?.id === id ? updated : current
        );

        return true;
      } catch {
        return false;
      }
    };


  /* Receive a new enquiry */

  
    
const addEnquiry = async (
  event: FormEvent<HTMLFormElement>
) => {
  event.preventDefault();
  if (isSavingEnquiry) return;
  setIsSavingEnquiry(true);
  setEnquiryFormError("");
  setEnquirySaveNotice("");
  dispatch(clearEnquiryError());

  try {
    await dispatch(
      addEnquiryApi({
        name: form.customerName.trim(),
        phone: form.phone.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.serviceId ? { serviceId: form.serviceId } : {}),
        ...(form.message.trim() ? { message: form.message.trim() } : {}),
      })
    ).unwrap();

    setForm({
      customerId: "",
      customerName: "",
      company: "",
      phone: "",
      email: "",
      service: "",
      serviceId: "",
      message: "",
      priority: "Medium",
    });

    setShowForm(false);
    setEnquirySaveNotice("Enquiry saved successfully.");
    try {
      await dispatch(fetchEnquiries()).unwrap();
    } catch {
      setEnquirySaveNotice("Enquiry saved, but the list could not refresh. Reload the page to see the latest enquiries.");
    }
  } catch (error) {
    setEnquiryFormError(typeof error === "string" ? error : "Could not save the enquiry. Check the required fields and try again.");
  } finally {
    setIsSavingEnquiry(false);
  }
};



  /* Open the Create Service modal */

  const openCreateService = (enquiry: Enquiry) => {
    if (enquiry.status === "Converted") {
      alert("This enquiry has already been converted into a booking.");
      return;
    }

    setSelected(enquiry);
    setSelectedCustomerId(enquiry.customerId ?? "");
    setSelectedLocationId(enquiry.serviceLocationId ?? "");
    setSelectedServiceId(enquiry.serviceId ?? "");
    setNewLocationAddress("");
    setNewLocationCity("");
    setNewLocationState("");
    setNewLocationPincode("");
    setServiceDate(today());
    setPreferredTime("10:30");
    setServiceNotes("");
    setServicePriority(enquiry.priority || "Medium");
    setAssignedManagerId(managers.find((manager) => manager.name === enquiry.assignedManager)?.id ?? "");
    setAssignedEmployees(
      Array.isArray(enquiry.assignedEmployees) ? enquiry.assignedEmployees : [],
    );
    setAssignmentError("");
    setShowService(true);
  };

  /* Convert the selected enquiry into a booking through the API */
  const createService = async () => {
    if (!selected) {
      setAssignmentError("Select an enquiry first.");
      return;
    }

    const customerId = selectedCustomerId.trim();
    if (!selectedCustomerId.trim()) {
      setAssignmentError("Please select an existing customer.");
      return;
    }

    if (!selectedServiceId) {
      setAssignmentError("Select a service before converting this enquiry.");
      return;
    }

    if (!serviceDate) {
      setAssignmentError("Please select a preferred date.");
      return;
    }

    if (!preferredTime) {
      setAssignmentError("Please select a preferred time.");
      return;
    }

    setAssignmentError("");
    setIsConverting(true);

    try {
      let serviceLocationId = selectedLocationId || selected.serviceLocationId || "";
      if (newLocationAddress.trim() || newLocationCity.trim() || newLocationState.trim() || newLocationPincode.trim()) {
        if (!newLocationAddress.trim() || !newLocationCity.trim() || !newLocationState.trim() || !newLocationPincode.trim()) {
          setAssignmentError("Enter the service address, city, state, and pincode.");
          setIsConverting(false);
          return;
        }
        if (!/^\d{6}$/.test(newLocationPincode.trim())) {
          setAssignmentError("Enter a valid 6-digit pincode.");
          setIsConverting(false);
          return;
        }
        const location = await dispatch(createCustomerAddress({
          customerId,
          locationName: "Service Location",
          address: newLocationAddress.trim(),
          city: newLocationCity.trim(),
          state: newLocationState.trim(),
          pincode: newLocationPincode.trim(),
        })).unwrap();
        serviceLocationId = String(location.id);
        void dispatch(fetchCustomers());
      }

      if (!serviceLocationId) {
        setAssignmentError("Select an existing service location or enter a new address, city, state, and pincode.");
        setIsConverting(false);
        return;
      }

      const managerId = assignedManagerId ? selectedManager?.id : undefined;
      if (assignedManagerId && !managerId) {
        setAssignmentError("The selected manager is no longer available. Refresh the manager list and select them again.");
        setIsConverting(false);
        return;
      }
      const employeeIds = assignedEmployees.map((name) =>
        technicians.find((employee) => employee.name === name)?.id,
      );
      if (employeeIds.some((id) => !id)) {
        setAssignmentError("A selected employee is no longer available. Refresh the employee list and select the team again.");
        setIsConverting(false);
        return;
      }

      const payload = {
        id: selected.id,
        customerId,
        serviceId: selectedServiceId,
        serviceLocationId,
        preferredDate: serviceDate,
        preferredTime,
        priority: ({ Low: "LOW", Medium: "NORMAL", High: "HIGH" } as const)[servicePriority],
        ...(managerId ? { managerId } : {}),
        ...(employeeIds.length ? { employeeIds: employeeIds as string[] } : {}),
        ...(serviceNotes.trim() ? { instructions: serviceNotes.trim() } : {}),
      };

      // The manager selector stores the Manager record's top-level profile ID.
      if (selectedManager && payload.managerId !== selectedManager.id) {
        setAssignmentError("The selected manager ID is invalid. Select the manager again before converting.");
        setIsConverting(false);
        return;
      }

      await dispatch(convertEnquiryToBookingApi(payload)).unwrap();
      await dispatch(fetchEnquiries()).unwrap();

      setSelected(null);
      setShowService(false);
      setSelectedCustomerId("");
      setSelectedLocationId("");
      setSelectedServiceId("");
      setNewLocationAddress("");
      setNewLocationCity("");
      setNewLocationState("");
      setNewLocationPincode("");
      setServiceDate(today());
      setPreferredTime("10:30");
      setServiceNotes("");
      setServicePriority("Medium");
      setAssignedManagerId("");
      setAssignedEmployees([]);
      setAssignmentError("");
      alert("Enquiry converted into a booking successfully.");
    } catch (error) {
      setAssignmentError(
        typeof error === "string"
          ? error
          : "Could not convert the enquiry into a booking. Please try again.",
      );
    } finally {
      setIsConverting(false);
    }
  };



  const callCustomer = (enquiry: Enquiry) => {
    window.location.href = `tel:${enquiry.phone}`;
  };

  const emailCustomer = (enquiry: Enquiry) => {
    window.location.href = `mailto:${enquiry.email}?subject=${encodeURIComponent(
      `Regarding enquiry ${enquiry.reference}`,
    )}`;
  };

  const markContacted = async (enquiry: Enquiry) => {
    const saved = await updateEnquiry(enquiry.id, { status: "Contacted" });
    if (saved) setSelected(null);
  };

  const toggleEmployee = (employee: string) => {
    setAssignedEmployees((current) =>
      current.includes(employee)
        ? current.filter((item) => item !== employee)
        : [...current, employee],
    );

    setAssignmentError("");
  };

  /* ------------------------------------------------------------------------ */
  /* Page UI                                                                  */
  /* ------------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Header */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Operations / Enquiries
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Enquiry Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage customer enquiries and create service requests with
            assigned teams.
          </p>
        </div>

        <button
          onClick={() => { setEnquiryFormError(""); setEnquirySaveNotice(""); setShowForm(true); }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          <Plus size={17} />
          Receive Enquiry
        </button>
      </div>

      {enquirySaveNotice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{enquirySaveNotice}</p>}

      {enquiriesLoading && (
        <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading enquiries...
        </div>
      )}
      {/* Summary cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Enquiries"
          value={totalEnquiries}
          icon={MessageCircle}
          accent="border-emerald-900"
          iconStyle="bg-emerald-50 text-emerald-800"
        />

        <SummaryCard
          title="New Enquiries"
          value={newEnquiries}
          icon={Clock}
          accent="border-blue-500"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Assigned"
          value={assignedEnquiries}
          icon={UserRoundCheck}
          accent="border-violet-500"
          iconStyle="bg-violet-50 text-violet-700"
        />

        <SummaryCard
          title="Converted to Service"
          value={convertedEnquiries}
          icon={CheckCircle}
          accent="border-lime-500"
          iconStyle="bg-lime-50 text-lime-700"
        />
      </div>

      {/* Enquiry table */}


      <section className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Header */}
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-bold text-slate-900">
              Customer Enquiries
            </h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              View enquiries, contact customers, and assign service teams.
            </p>
          </div>

          {/* Search and Filter */}
          <div className="grid min-w-0 grid-cols-1 gap-3 min-[480px]:grid-cols-[minmax(0,1fr)_auto] lg:flex lg:shrink-0">
            <div className="relative min-w-0">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search enquiries..."
                className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 lg:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as "All" | EnquiryStatus)}
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 min-[480px]:w-auto"
            >
              <option value="All">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Assigned">Assigned</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="space-y-3 p-3 sm:p-4 md:hidden">
          {filteredEnquiries.length === 0 ? (
            <div className="px-3 py-10 text-center">
              <Search size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No enquiries found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try changing the search or status filter.
              </p>
            </div>
          ) : (
            filteredEnquiries.map((enquiry) => (
              <article
                key={enquiry.id}
                className="min-w-0 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-200 sm:p-4"
              >
                {/* Enquiry and Customer */}
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-bold text-emerald-800">
                      {enquiry.reference}
                    </p>
                    <p className="mt-1 break-words text-sm font-semibold text-slate-900">
                      {enquiry.customerName}
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-500">
                      {enquiry.company}
                    </p>
                    <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                      <MapPin size={13} className="mt-0.5 shrink-0" />
                      <span className="break-words">{enquiry.location}</span>
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[enquiry.status]}`}
                  >
                    {enquiry.status}
                  </span>
                </div>

                {/* Details */}
                <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 border-t border-slate-100 pt-3 min-[380px]:grid-cols-2">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Service
                    </p>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-700">
                      {enquiry.service}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Received
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-700">
                      {enquiry.receivedDate}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Priority
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[enquiry.priority]}`}
                      >
                        {enquiry.priority}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Assigned Team
                    </p>
                    <p className="mt-1 break-words text-xs text-slate-700">
                      {enquiry.assignedManager || "No manager"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(Array.isArray(enquiry.assignedEmployees) ? enquiry.assignedEmployees.length : 0)} employee(s)
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex min-w-0 flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <IconButton
                    title="View enquiry"
                    onClick={() => setSelected(enquiry)}
                  >
                    <Eye size={15} />
                  </IconButton>

                  <IconButton
                    title="Call customer"
                    onClick={() => callCustomer(enquiry)}
                  >
                    <Phone size={15} />
                  </IconButton>

                  <IconButton
                    title="Email customer"
                    onClick={() => emailCustomer(enquiry)}
                  >
                    <Mail size={15} />
                  </IconButton>

                  {enquiry.status !== "Converted" && (
                    <button
                      type="button"
                      title="Create service and assign team"
                      onClick={() => openCreateService(enquiry)}
                      className="ml-auto inline-flex max-w-full items-center justify-center gap-1.5 rounded-md bg-emerald-800 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-900"
                    >
                      <FilePlus2 size={14} className="shrink-0" />
                      <span>Create Service</span>
                    </button>
                  )}
                </div>
              </article>
            ))
          )}
        </div>

        {/* Desktop Table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Enquiry</th>
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Customer</th>
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Service</th>
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Received</th>
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Priority</th>
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Status</th>
                <th className="whitespace-nowrap px-5 py-4 font-semibold">Assigned Team</th>
                <th className="whitespace-nowrap px-5 py-4 text-right font-semibold">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEnquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="transition hover:bg-slate-50/70"
                >
                  <td className="px-5 py-4">
                    <p className="font-semibold text-emerald-800">
                      {enquiry.reference}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {enquiry.location}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">
                      {enquiry.customerName}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {enquiry.company}
                    </p>
                  </td>

                  <td className="max-w-52 px-5 py-4">
                    <p className="truncate text-sm text-slate-700">
                      {enquiry.service}
                    </p>
                  </td>

                  <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                    {enquiry.receivedDate}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${priorityStyles[enquiry.priority]}`}
                    >
                      {enquiry.priority}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[enquiry.status]}`}
                    >
                      {enquiry.status}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    <p className="whitespace-nowrap text-sm text-slate-700">
                      {enquiry.assignedManager || "No manager"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {(Array.isArray(enquiry.assignedEmployees) ? enquiry.assignedEmployees.length : 0)} employee(s)
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <IconButton
                        title="View enquiry"
                        onClick={() => setSelected(enquiry)}
                      >
                        <Eye size={15} />
                      </IconButton>

                      <IconButton
                        title="Call customer"
                        onClick={() => callCustomer(enquiry)}
                      >
                        <Phone size={15} />
                      </IconButton>

                      <IconButton
                        title="Email customer"
                        onClick={() => emailCustomer(enquiry)}
                      >
                        <Mail size={15} />
                      </IconButton>

                      {enquiry.status !== "Converted" && (
                        <button
                          type="button"
                          title="Create service and assign team"
                          onClick={() => openCreateService(enquiry)}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-800 px-2.5 py-2 text-[11px] font-semibold text-white transition hover:bg-emerald-900"
                        >
                          <FilePlus2 size={14} />
                          Create Service
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Search size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No enquiries found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try changing the search or status filter.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
          Showing {filteredEnquiries.length} of {enquiries.length} enquiries
        </div>
      </section>


      {/* Enquiry details modal */}

      {selected && !showService && (
        <Modal
          title="Enquiry Details"
          onClose={() => setSelected(null)}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-emerald-700">
                  {selected.reference}
                </p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selected.customerName}
                </h3>
                <p className="text-sm text-slate-500">
                  {selected.company}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selected.status]}`}
              >
                {selected.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Requested Service" value={selected.service} />
              <Detail label="Location" value={selected.location} />
              <Detail label="Received Date" value={selected.receivedDate} />
              <Detail label="Priority" value={selected.priority} />
              <Detail
                label="Assigned Manager"
                value={selected.assignedManager || "Not assigned"}
              />
              <Detail
                label="Assigned Employees"
                value={
                  Array.isArray(selected.assignedEmployees) && selected.assignedEmployees.length > 0
                    ? selected.assignedEmployees.join(", ")
                    : "Not assigned"
                }
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">
                CUSTOMER MESSAGE
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {selected.message || "No message provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <ActionButton
                onClick={() => callCustomer(selected)}
                variant="secondary"
              >
                <Phone size={15} />
                Call
              </ActionButton>

              <ActionButton
                onClick={() => emailCustomer(selected)}
                variant="secondary"
              >
                <Mail size={15} />
                Email
              </ActionButton>

              {selected.status !== "Converted" && (
                <ActionButton
                  onClick={() => openCreateService(selected)}
                  variant="primary"
                >
                  <Wrench size={15} />
                  Create Service
                </ActionButton>
              )}

              {selected.status === "New" && (
                <ActionButton
                  onClick={() => markContacted(selected)}
                  variant="secondary"
                >
                  <CheckCircle size={15} />
                  Mark Contacted
                </ActionButton>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create service modal */}

      {showService && selected && (
        <Modal
          title="Create Service Request"
          onClose={() => {
            setShowService(false);
            setAssignmentError("");
          }}
        >
          <div className="space-y-5">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-800">
                  <Wrench size={20} />
                </div>

                <div className="min-w-0">
                  <p className="text-xs font-bold text-emerald-800">
                    {selected.reference}
                  </p>
                  <h3 className="mt-1 font-bold text-slate-900">
                    {selected.service}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {selected.customerName} · {selected.company}
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                    <MapPin size={13} />
                    {selected.location}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Select Customer <span className="text-red-500">*</span>
              </label>

              <select
                value={selectedCustomerId}
                onChange={(event) => {
                  setSelectedCustomerId(event.target.value);
                  setSelectedLocationId("");
                  setNewLocationAddress("");
                  setNewLocationCity("");
                  setNewLocationState("");
                  setNewLocationPincode("");
                  setAssignmentError("");
                }}
                required
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
              >
                <option value="">Select an existing customer</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>
            </div>

            {!selectedServiceId && (
              <div>
                <label htmlFor="conversionService" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Select Service <span className="text-red-500">*</span>
                </label>
                <select
                  id="conversionService"
                  required
                  value={selectedServiceId}
                  onChange={(event) => { setSelectedServiceId(event.target.value); setAssignmentError(""); }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Choose a service</option>
                  {services.map((service) => <option key={service.id} value={String(service.id)}>{service.name}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
              <div>
                <label htmlFor="serviceLocation" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Existing Service Location
                </label>
                <select
                  id="serviceLocation"
                  value={selectedLocationId}
                  onChange={(event) => {
                    setSelectedLocationId(event.target.value);
                    setNewLocationAddress("");
                    setNewLocationCity("");
                    setNewLocationState("");
                    setNewLocationPincode("");
                    setAssignmentError("");
                  }}
                  disabled={!selectedCustomer || selectedCustomer.serviceLocations.length === 0}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm"
                >
                  <option value="">Choose a saved location or enter a new one</option>
                  {(selectedCustomer?.serviceLocations ?? []).filter((location) => String(location.id).trim()).map((location) => (
                    <option key={location.id} value={String(location.id)}>
                    {[location.name, location.address, location.city, location.state, location.pincode].filter(Boolean).join(" — ")}
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-center text-xs font-medium uppercase tracking-wide text-slate-400">Or add a service location</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Service Address"
                  required={Boolean(newLocationAddress || newLocationCity || newLocationState || newLocationPincode)}
                  value={newLocationAddress}
                  onChange={(value) => {
                    setNewLocationAddress(value);
                    if (value) setSelectedLocationId("");
                    setAssignmentError("");
                  }}
                  placeholder="Street address or site details"
                />
                <Field
                  label="City"
                  required={Boolean(newLocationAddress || newLocationCity || newLocationState || newLocationPincode)}
                  value={newLocationCity}
                  onChange={(value) => {
                    setNewLocationCity(value);
                    if (value) setSelectedLocationId("");
                    setAssignmentError("");
                  }}
                  placeholder="City"
                />
                <Field
                  label="State"
                  required={Boolean(newLocationAddress || newLocationCity || newLocationState || newLocationPincode)}
                  value={newLocationState}
                  onChange={(value) => {
                    setNewLocationState(value);
                    if (value) setSelectedLocationId("");
                    setAssignmentError("");
                  }}
                  placeholder="State"
                />
                <Field
                  label="Pincode (6 digits)"
                  required={Boolean(newLocationAddress || newLocationCity || newLocationState || newLocationPincode)}
                  value={newLocationPincode}
                  onChange={(value) => {
                    setNewLocationPincode(value.replace(/\D/g, "").slice(0, 6));
                    if (value) setSelectedLocationId("");
                    setAssignmentError("");
                  }}
                  placeholder="123456"
                />
              </div>
            </div>

            {/* Preferred date */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Service Date <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <CalendarDays
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="date"
                  value={serviceDate}
                  min={today()}
                  onChange={(event) => {
                    setServiceDate(event.target.value);
                    setAssignmentError("");
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Preferred time */}
            <div>
              <label
                htmlFor="preferredTime"
                className="mb-1.5 block text-sm font-semibold text-slate-700"
              >
                Preferred Time <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Clock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  id="preferredTime"
                  type="time"
                  value={preferredTime}
                  onChange={(event) => {
                    setPreferredTime(event.target.value);
                    setAssignmentError("");
                  }}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Service priority: temporary UI selection only */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Service Priority
              </label>

              <select
                value={servicePriority}
                onChange={(event) =>
                  setServicePriority(event.target.value as Priority)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>

              <p className="mt-1.5 text-xs text-slate-500">
                This selection is only displayed in this window and is not
                saved with the service request.
              </p>
            </div>

            {/* Assign manager */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Assign Manager
              </label>

              <select
                value={assignedManagerId}
                onChange={(event) => {
                  setAssignedManagerId(event.target.value);
                  setAssignmentError("");
                }}
                disabled={managersLoading}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="">
                  {managersLoading
                    ? "Loading managers…"
                    : managersError
                      ? "Manager list failed to load"
                      : managers.length
                        ? "No manager selected"
                        : "No active managers available"}
                </option>
                {managers.map((manager) => (
                  <option key={manager.id} value={manager.id}>
                    {manager.name}
                  </option>
                ))}
              </select>
              {!managersLoading && !managersError && managers.length === 0 && (
                <p role="status" className="mt-1.5 text-xs text-amber-700">
                  {managerRecordsCount === 0 && employeeDesignatedManagers.length > 0
                    ? "The Managers API returned no Manager records, but employees with a Manager designation exist. They cannot be assigned as managers until backend Manager records are created."
                    : managerRecordsCount !== null && managerRecordsCount > 0
                      ? "Manager records were returned, but none have an active user account."
                      : "No active Manager records are available."}
                </p>
              )}
              {managersError && <p role="alert" className="mt-1.5 text-xs text-red-600">{managersError}</p>}
            </div>

            {/* Assign multiple employees */}

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold text-slate-700">
                  Assign Employees
                </label>

                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                  {assignedEmployees.length} selected
                </span>
              </div>

              <p className="mb-3 text-xs text-slate-500">
                Select one or multiple employees for this service.
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {technicians.map((employee) => {
                  const checked = assignedEmployees.includes(employee.name);

                  return (
                    <label
                      key={employee.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        checked
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleEmployee(employee.name)}
                        className="h-4 w-4 accent-emerald-700"
                      />

                      <span className="text-sm text-slate-700">
                        {employee.name}
                      </span>
                    </label>
                  );
                })}
                {technicians.length === 0 && (
                  <p className="text-xs text-amber-700">No active technicians or service engineers are available.</p>
                )}
              </div>
            </div>

            {/* Service notes */}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Service Notes
              </label>

              <textarea
                rows={3}
                value={serviceNotes}
                onChange={(event) => setServiceNotes(event.target.value)}
                placeholder="Add instructions, work details, or special requirements..."
                className="w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Assignment summary */}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Users size={17} className="text-emerald-800" />
                <h4 className="text-sm font-bold text-slate-900">
                  Assignment Summary
                </h4>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Service Date</span>
                  <span className="font-semibold text-slate-800">
                    {serviceDate || "Not selected"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Preferred Time</span>
                  <span className="font-semibold text-slate-800">
                    {preferredTime || "Not selected"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Priority</span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${priorityStyles[servicePriority]}`}
                  >
                    {servicePriority}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Manager</span>
                  <span className="text-right font-semibold text-slate-800">
                    {selectedManager?.name || "Not assigned"}
                  </span>
                </div>

                <div className="flex justify-between gap-3">
                  <span className="text-slate-500">Employees</span>
                  <span className="font-semibold text-slate-800">
                    {assignedEmployees.length}
                  </span>
                </div>

                {assignedEmployees.length > 0 && (
                  <div className="border-t border-slate-200 pt-2">
                    <p className="mb-2 text-xs font-semibold text-slate-500">
                      SELECTED EMPLOYEES
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {assignedEmployees.map((employee) => (
                        <span
                          key={employee}
                          className="rounded-md bg-white px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200"
                        >
                          {employee}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Validation error */}

            {assignmentError && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle size={17} className="mt-0.5 shrink-0" />
                <p>{assignmentError}</p>
              </div>
            )}

            {/* Actions */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowService(false);
                  setAssignmentError("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={createService}
                disabled={isConverting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isConverting ? "Converting..." : "Convert to Booking"}
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Receive enquiry modal */}

      {showForm && (
        <Modal
          title="Receive Customer Enquiry"
          onClose={() => { if (!isSavingEnquiry) setShowForm(false); }}
        >
          <form onSubmit={addEnquiry} className="space-y-4">
            {enquiryFormError && (
              <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{enquiryFormError}</p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="enquiryCustomer" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Existing Customer <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  id="enquiryCustomer"
                  value={form.customerId}
                  onChange={(event) => {
                    const customer = customers.find((item) => item.id === event.target.value);
                    setForm((current) => ({
                      ...current,
                      customerId: customer?.id ?? "",
                      customerName: customer?.name ?? "",
                      company: customer?.company ?? "",
                      phone: customer?.phone ?? "",
                      email: customer?.email ?? "",
                    }));
                  }}
                  required
                  disabled={customersLoading || customers.length === 0}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">
                    {customersLoading ? "Loading customers…" : "Select a customer"}
                  </option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name} — {customer.phone}{customer.company && customer.company !== "—" ? ` · ${customer.company}` : ""}
                    </option>
                  ))}
                </select>
                {!customersLoading && customers.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    {customersError || "No customers are available. Add a customer before creating an enquiry."}
                  </p>
                )}
                {form.customerId && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    {[form.company, form.phone, form.email].filter(Boolean).join(" · ")}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="requestedService"
                  className="mb-1.5 block text-sm font-semibold text-slate-700"
                >
                  Requested Service <span className="ml-1 text-red-500">*</span>
                </label>
                <select
                  id="requestedService"
                  value={form.serviceId}
                  onChange={(event) => {
                    const serviceId = event.target.value;
                    const selectedService = services.find(
                      (service) => String(service.id) === serviceId
                    );
                    setForm((previous) => ({
                      ...previous,
                      serviceId,
                      service: selectedService?.name ?? "",
                    }));
                  }}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select service</option>
                  {services.map((service) => (
                    <option key={service.id} value={String(service.id)}>
                      {service.name}
                    </option>
                  ))}
                </select>
                {services.length === 0 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    No services are available. Check that the services API has active records.
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Enquiry Priority
                </label>

                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as Priority,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Customer Message
              </label>

              <textarea
                rows={4}
                value={form.message}
                onChange={(event) =>
                  setForm({ ...form, message: event.target.value })
                }
                placeholder="Enter enquiry details..."
                className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => { setEnquiryFormError(""); setShowForm(false); }}
                disabled={isSavingEnquiry}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSavingEnquiry}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                <Plus size={16} />
                {isSavingEnquiry ? "Saving…" : "Save Enquiry"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable components                                                         */
/* -------------------------------------------------------------------------- */

function SummaryCard({
  title,
  value,
  icon: Icon,
  accent,
  iconStyle,
}: {
  title: string;
  value: number;
  icon: ElementType;
  accent: string;
  iconStyle: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 border-l-4 ${accent} bg-white p-5 shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function IconButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {children}
    </button>
  );
}

function ActionButton({
  onClick,
  variant,
  children,
}: {
  onClick: () => void;
  variant: "primary" | "secondary";
  children: ReactNode;
}) {
  const styles =
    variant === "primary"
      ? "bg-emerald-800 text-white hover:bg-emerald-900"
      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-semibold transition ${styles}`}
    >
      {children}
    </button>
  );
}
