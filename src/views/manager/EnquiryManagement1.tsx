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
  useMemo,
  useState,
  type ElementType,
  type FormEvent,
  type ReactNode,
} from "react";
import { useAssignableEmployees } from "../../viewmodels/shared/UseAssignableEmployees";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type EnquiryStatus = "New" | "Contacted" | "Assigned" | "Converted";
type Priority = "Low" | "Medium" | "High";

interface Enquiry {
  id: number;
  reference: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  location: string;
  message: string;
  receivedDate: string;
  priority: Priority;
  status: EnquiryStatus;
  assignedEmployees: string[];
}

interface ServiceRequest {
  id: string;
  enquiryReference: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  location: string;
  serviceDate: string;
  notes: string;
  assignedEmployees: string[];
  status: "Scheduled";
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Demo data                                                                   */
/* -------------------------------------------------------------------------- */

const initialEnquiries: Enquiry[] = [
  {
    id: 1,
    reference: "ENQ-1001",
    customerName: "Rajesh Kumar",
    company: "ABC Industries",
    phone: "+919876543210",
    email: "rajesh@example.com",
    service: "RO System Maintenance",
    location: "Chennai",
    message:
      "We need maintenance for our industrial RO water treatment system. Please arrange an inspection.",
    receivedDate: "2026-10-08",
    priority: "High",
    status: "New",
    assignedEmployees: [],
  },
  {
    id: 2,
    reference: "ENQ-1002",
    customerName: "Anil Thomas",
    company: "GreenTech Pvt Ltd",
    phone: "+919847012345",
    email: "anil@example.com",
    service: "Water Treatment Plant Installation",
    location: "Coimbatore",
    message:
      "We are planning a new water treatment plant and would like a site visit and quotation.",
    receivedDate: "2026-10-08",
    priority: "High",
    status: "Assigned",
    assignedEmployees: ["Employee 001 - Nikhil"],
  },
  {
    id: 3,
    reference: "ENQ-1003",
    customerName: "Priya Menon",
    company: "Sunrise Apartments",
    phone: "+919847156789",
    email: "priya@example.com",
    service: "Annual Maintenance Contract",
    location: "Madurai",
    message:
      "Please share AMC plans and the maintenance schedule for our apartment RO plant.",
    receivedDate: "2026-10-07",
    priority: "Medium",
    status: "Contacted",
    assignedEmployees: [],
  },
  {
    id: 4,
    reference: "ENQ-1004",
    customerName: "Suresh Nair",
    company: "Sri Hospitals",
    phone: "+919995077889",
    email: "suresh@example.com",
    service: "Filter Replacement",
    location: "Kochi",
    message:
      "We need replacement filters for our existing water purification system.",
    receivedDate: "2026-10-06",
    priority: "Low",
    status: "Converted",
    assignedEmployees: [
      "Employee 002 - Adil",
      "Employee 003 - Suresh",
    ],
  },
];


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

/* -------------------------------------------------------------------------- */
/* Main page                                                                   */
/* -------------------------------------------------------------------------- */

export default function EnquiryManagement() {
  const { employees, loading: employeeLoading, error: employeeError } = useAssignableEmployees();
  const [enquiries, setEnquiries] = useState<Enquiry[]>(() => {
    try {
      const saved = localStorage.getItem("admin_enquiries");
      return saved ? (JSON.parse(saved) as Enquiry[]) : initialEnquiries;
    } catch {
      return initialEnquiries;
    }
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selected, setSelected] = useState<Enquiry | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showService, setShowService] = useState(false);

  const [serviceDate, setServiceDate] = useState(today());
  const [serviceLocation, setServiceLocation] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  // Temporary UI state only; this value is not saved to localStorage.
  const [servicePriority, setServicePriority] =
    useState<Priority>("Medium");

  const [assignedEmployees, setAssignedEmployees] = useState<string[]>([]);
  const [assignmentError, setAssignmentError] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    company: "",
    phone: "",
    email: "",
    service: "",
    location: "",
    message: "",
    priority: "Medium" as Priority,
  });

  useEffect(() => {
    localStorage.setItem("admin_enquiries", JSON.stringify(enquiries));
  }, [enquiries]);

  const filteredEnquiries = useMemo(() => {
    const query = search.toLowerCase().trim();

    return enquiries.filter((enquiry) => {
      const searchableValues = [
        enquiry.reference,
        enquiry.customerName,
        enquiry.company,
        enquiry.phone,
        enquiry.email,
        enquiry.service,
        enquiry.location,
        ...enquiry.assignedEmployees,
      ];

      const matchesSearch =
        !query ||
        searchableValues.some((value) =>
          value.toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === "All" || enquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, search, statusFilter]);

  const updateEnquiry = (
    id: number,
    updates: Partial<Enquiry>,
  ) => {
    setEnquiries((current) =>
      current.map((enquiry) =>
        enquiry.id === id ? { ...enquiry, ...updates } : enquiry,
      ),
    );

    setSelected((current) =>
      current?.id === id ? { ...current, ...updates } : current,
    );
  };

  /* Receive a new enquiry */

  const addEnquiry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextNumber =
      Math.max(
        1000,
        ...enquiries.map((enquiry) => {
          const number = Number(enquiry.reference.replace("ENQ-", ""));
          return Number.isFinite(number) ? number : 1000;
        }),
      ) + 1;

    const newEnquiry: Enquiry = {
      ...form,
      id: Date.now(),
      reference: `ENQ-${nextNumber}`,
      receivedDate: today(),
      status: "New",
      assignedEmployees: [],
    };

    setEnquiries((current) => [newEnquiry, ...current]);

    setForm({
      customerName: "",
      company: "",
      phone: "",
      email: "",
      service: "",
      location: "",
      message: "",
      priority: "Medium",
    });

    setShowForm(false);
  };

  /* Open the Create Service modal */

  const openCreateService = (enquiry: Enquiry) => {
    if (enquiry.status === "Converted") {
      alert("A service request has already been created for this enquiry.");
      return;
    }

    setSelected(enquiry);
    setServiceDate(today());
    setServiceLocation(enquiry.location || "");
    setServiceNotes("");

    // Default to the enquiry priority, but allow changing it in the modal.
    setServicePriority(enquiry.priority || "Medium");

    setAssignedEmployees(enquiry.assignedEmployees || []);
    setAssignmentError("");
    setShowService(true);
  };

  /* Create one service request */

  const createService = () => {
    if (!selected || !serviceDate) {
      setAssignmentError("Please select a service date.");
      return;
    }

    if (!serviceLocation.trim()) {
      setAssignmentError("Enter a service location before creating the service.");
      return;
    }

    if (assignedEmployees.length === 0) {
    setAssignmentError("Select at least one employee before creating the service.");
    return;
    }

    try {
      const existingServices: ServiceRequest[] = JSON.parse(
        localStorage.getItem("admin_service_requests") || "[]",
      );

      const alreadyCreated = existingServices.some(
        (service) => service.enquiryReference === selected.reference,
      );

      if (alreadyCreated) {
        setAssignmentError(
          "A service request already exists for this enquiry.",
        );
        return;
      }

      const newService: ServiceRequest = {
        id: `SRV-${Date.now()}`,
        enquiryReference: selected.reference,
        customerName: selected.customerName,
        company: selected.company,
        phone: selected.phone,
        email: selected.email,
        service: selected.service,
        location: serviceLocation.trim(),
        serviceDate,
        notes: serviceNotes.trim(),

        // Service priority is intentionally NOT included here.

        assignedEmployees,
        status: "Scheduled",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(
        "admin_service_requests",
        JSON.stringify([newService, ...existingServices]),
      );

      updateEnquiry(selected.id, {
        status: "Converted",
        assignedEmployees,
      });

      setShowService(false);
      setSelected(null);
      setServiceDate(today());
      setServiceNotes("");
      setServicePriority("Medium");
      setAssignedEmployees([]);
      setAssignmentError("");

      alert("Service request created and team assigned successfully.");
    } catch {
      setAssignmentError(
        "Could not save the service request. Please try again.",
      );
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

  const markContacted = (enquiry: Enquiry) => {
    updateEnquiry(enquiry.id, { status: "Contacted" });
    setSelected(null);
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
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          <Plus size={17} />
          Receive Enquiry
        </button>
      </div>

      {/* Summary cards */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Enquiries"
          value={enquiries.length}
          icon={MessageCircle}
          accent="border-emerald-900"
          iconStyle="bg-emerald-50 text-emerald-800"
        />

        <SummaryCard
          title="New Enquiries"
          value={enquiries.filter((e) => e.status === "New").length}
          icon={Clock}
          accent="border-blue-500"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Assigned"
          value={enquiries.filter((e) => e.status === "Assigned").length}
          icon={UserRoundCheck}
          accent="border-violet-500"
          iconStyle="bg-violet-50 text-violet-700"
        />

        <SummaryCard
          title="Converted to Service"
          value={enquiries.filter((e) => e.status === "Converted").length}
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
              onChange={(event) => setStatusFilter(event.target.value)}
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
                    <p className="mt-1 text-xs text-slate-500">
                      {enquiry.assignedEmployees.length} employee(s)
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
                    <p className="mt-1 text-xs text-slate-500">
                      {enquiry.assignedEmployees.length} employee(s)
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
                label="Assigned Employees"
                value={
                  selected.assignedEmployees.length
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
              <label htmlFor="managerServiceLocation" className="mb-1.5 block text-sm font-semibold text-slate-700">
                Service Location <span className="text-red-500">*</span>
              </label>
              <textarea
                id="managerServiceLocation"
                rows={2}
                value={serviceLocation}
                onChange={(event) => setServiceLocation(event.target.value)}
                placeholder="Enter the site address and city"
                required
                className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* Service date */}

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
                {employees.map((employee) => {
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
                        {employee.name} · {employee.designation || employee.role}
                      </span>
                    </label>
                  );
                })}
                {employeeLoading && <p className="text-xs text-slate-500">Loading staff…</p>}
                {!employeeLoading && employees.length === 0 && (
                  <p className="text-xs text-amber-700">
                    {employeeError || "No active staff found in the employee database."}
                  </p>
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
                  <span className="text-slate-500">Priority</span>
                  <span
                    className={`rounded-full px-2 py-1 text-[11px] font-bold ${priorityStyles[servicePriority]}`}
                  >
                    {servicePriority}
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
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Create Service & Assign
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
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={addEnquiry} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Customer Name"
                required
                value={form.customerName}
                onChange={(value) =>
                  setForm({ ...form, customerName: value })
                }
                placeholder="Enter customer name"
              />

              <Field
                label="Company"
                required
                value={form.company}
                onChange={(value) => setForm({ ...form, company: value })}
                placeholder="Company name"
              />

              <Field
                label="Phone"
                required
                value={form.phone}
                onChange={(value) => setForm({ ...form, phone: value })}
                placeholder="+91..."
              />

              <Field
                label="Email"
                required
                type="email"
                value={form.email}
                onChange={(value) => setForm({ ...form, email: value })}
                placeholder="customer@example.com"
              />

              <Field
                label="Requested Service"
                required
                value={form.service}
                onChange={(value) => setForm({ ...form, service: value })}
                placeholder="e.g. RO maintenance"
              />

              <Field
                label="Service Location"
                required
                value={form.location}
                onChange={(value) => setForm({ ...form, location: value })}
                placeholder="City or site"
              />

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
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                <Plus size={16} />
                Save Enquiry
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
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
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

        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
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
