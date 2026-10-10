
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Eye,
  FilePlus2,
  Mail,
  MessageCircle,
  Phone,
  Plus,
  Search,
  UserRoundCheck,
  X,
} from "lucide-react";

import { useMemo, useState } from "react";

type EnquiryStatus =
  | "New"
  | "Contacted"
  | "Assigned"
  | "Converted";

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
  priority: "Low" | "Medium" | "High";
  status: EnquiryStatus;
  assignedManager: string;
}

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
    assignedManager: "",
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
    assignedManager: "Arun Mathew",
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
    assignedManager: "Arun Mathew",
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
    assignedManager: "Meera Joseph",
  },
];

const managers = [
  "Arun Mathew",
  "Meera Joseph",
  "Rahul Nair",
  "Fathima Ali",
];

const statusStyles: Record<EnquiryStatus, string> = {
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-amber-50 text-amber-700",
  Assigned: "bg-violet-50 text-violet-700",
  Converted: "bg-emerald-50 text-emerald-700",
};

export default function EnquiryManagement() {
  const [enquiries, setEnquiries] =
    useState<Enquiry[]>(initialEnquiries);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selected, setSelected] =
    useState<Enquiry | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const [manager, setManager] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [form, setForm] = useState({
    customerName: "",
    company: "",
    phone: "",
    email: "",
    service: "",
    location: "",
    message: "",
    priority: "Medium" as Enquiry["priority"],
  });

  const filteredEnquiries = useMemo(() => {
    const query = search.toLowerCase().trim();

    return enquiries.filter((enquiry) => {
      const matchesSearch =
        !query ||
        [
          enquiry.reference,
          enquiry.customerName,
          enquiry.company,
          enquiry.phone,
          enquiry.email,
          enquiry.service,
          enquiry.location,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" ||
        enquiry.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enquiries, search, statusFilter]);

  const updateEnquiry = (
    id: number,
    updates: Partial<Enquiry>
  ) => {
    setEnquiries((current) =>
      current.map((enquiry) =>
        enquiry.id === id
          ? { ...enquiry, ...updates }
          : enquiry
      )
    );
  };

  const addEnquiry = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const newEnquiry: Enquiry = {
      ...form,
      id: Date.now(),
      reference: `ENQ-${1000 + enquiries.length + 1}`,
      receivedDate: new Date().toISOString().slice(0, 10),
      status: "New",
      assignedManager: "",
    };

    setEnquiries((current) => [
      newEnquiry,
      ...current,
    ]);

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

  const openAssign = (enquiry: Enquiry) => {
    setSelected(enquiry);
    setManager(enquiry.assignedManager);
    setShowAssign(true);
  };

  const saveAssignment = () => {
    if (!selected || !manager) return;

    updateEnquiry(selected.id, {
      assignedManager: manager,
      status:
        selected.status === "New"
          ? "Assigned"
          : selected.status,
    });

    setShowAssign(false);
    setSelected(null);
  };

  const openConvert = (enquiry: Enquiry) => {
    setSelected(enquiry);
    setServiceDate("");
    setServiceNotes("");
    setShowConvert(true);
  };

  const convertEnquiry = () => {
    if (!selected || !serviceDate) return;

    // Demo action: mark the enquiry as converted.
    // Connect this to your service-request ViewModel/API
    // when the backend is ready.
    updateEnquiry(selected.id, {
      status: "Converted",
    });

    setShowConvert(false);
    setSelected(null);
  };

  const callCustomer = (enquiry: Enquiry) => {
    window.location.href = `tel:${enquiry.phone}`;
  };

  const emailCustomer = (enquiry: Enquiry) => {
    window.location.href =
      `mailto:${enquiry.email}?subject=${encodeURIComponent(
        `Regarding enquiry ${enquiry.reference}`
      )}`;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Operations / Enquiries
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Enquiry Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Receive, track, assign and convert customer enquiries.
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
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
          title="Converted"
          value={enquiries.filter((e) => e.status === "Converted").length}
          icon={CheckCircle}
          accent="border-lime-500"
          iconStyle="bg-lime-50 text-lime-700"
        />
      </div>

      {/* Enquiry table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">
              Customer Enquiries
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Search enquiries and manage the next action.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search enquiries..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 sm:w-64"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            >
              <option value="All">All statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Assigned">Assigned</option>
              <option value="Converted">Converted</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Enquiry / Customer",
                  "Service",
                  "Location",
                  "Received",
                  "Priority",
                  "Status",
                  "Assigned Manager",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredEnquiries.map((enquiry) => (
                <tr
                  key={enquiry.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <p className="text-xs font-bold text-slate-900">
                      {enquiry.customerName}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {enquiry.reference} · {enquiry.company}
                    </p>
                  </td>

                  <td className="max-w-48 px-4 py-4 text-xs text-slate-700">
                    {enquiry.service}
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    {enquiry.location}
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    {enquiry.receivedDate}
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        enquiry.priority === "High"
                          ? "bg-red-50 text-red-700"
                          : enquiry.priority === "Medium"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {enquiry.priority}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[enquiry.status]}`}>
                      {enquiry.status}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">
                    {enquiry.assignedManager || (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        title="View details"
                        onClick={() => setSelected(enquiry)}
                        className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        title="Contact customer"
                        onClick={() => callCustomer(enquiry)}
                        className="rounded-md p-2 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <Phone size={15} />
                      </button>

                      <button
                        title="Assign manager"
                        onClick={() => openAssign(enquiry)}
                        className="rounded-md p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"
                      >
                        <UserRoundCheck size={15} />
                      </button>

                      {enquiry.status !== "Converted" && (
                        <button
                          title="Convert to service request"
                          onClick={() => openConvert(enquiry)}
                          className="rounded-md p-2 text-slate-500 hover:bg-amber-50 hover:text-amber-700"
                        >
                          <FilePlus2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredEnquiries.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Search className="mx-auto text-slate-300" size={28} />
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

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {filteredEnquiries.length} of {enquiries.length} enquiries
        </div>
      </section>

      {/* View enquiry details */}
      {selected && !showAssign && !showConvert && (
        <Modal title="Enquiry Details" onClose={() => setSelected(null)}>
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

              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="Phone" value={selected.phone} />
              <Detail label="Email" value={selected.email} />
              <Detail label="Requested Service" value={selected.service} />
              <Detail label="Location" value={selected.location} />
              <Detail label="Received Date" value={selected.receivedDate} />
              <Detail label="Assigned Manager" value={selected.assignedManager || "Not assigned"} />
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold text-slate-500">
                CUSTOMER MESSAGE
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {selected.message}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => callCustomer(selected)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Phone size={15} /> Call
              </button>

              <button
                onClick={() => emailCustomer(selected)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Mail size={15} /> Email
              </button>

              <button
                onClick={() => {
                  updateEnquiry(selected.id, { status: "Contacted" });
                  setSelected(null);
                }}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <CheckCircle size={15} /> Mark Contacted
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Assign manager */}
      {showAssign && selected && (
        <Modal title="Assign Enquiry" onClose={() => setShowAssign(false)}>
          <p className="mb-4 text-sm text-slate-500">
            Assign {selected.reference} to a manager.
          </p>

          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Select Manager
          </label>

          <select
            value={manager}
            onChange={(event) => setManager(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600"
          >
            <option value="">Choose a manager</option>
            {managers.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowAssign(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={saveAssignment}
              disabled={!manager}
              className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Assign Manager
            </button>
          </div>
        </Modal>
      )}

      {/* Convert to service request */}
      {showConvert && selected && (
        <Modal title="Convert to Service Request" onClose={() => setShowConvert(false)}>
          <div className="rounded-lg bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-800">
              {selected.reference} · {selected.customerName}
            </p>
            <p className="mt-1 text-sm text-emerald-900">
              {selected.service}
            </p>
          </div>

          <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">
            Proposed Service Date
          </label>

          <input
            type="date"
            value={serviceDate}
            onChange={(event) => setServiceDate(event.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600"
          />

          <label className="mb-2 mt-4 block text-sm font-semibold text-slate-700">
            Work Instructions
          </label>

          <textarea
            value={serviceNotes}
            onChange={(event) => setServiceNotes(event.target.value)}
            placeholder="Add instructions for the service team..."
            rows={3}
            className="w-full resize-y rounded-lg border border-slate-200 px-3 py-3 text-sm outline-none focus:border-emerald-600"
          />

          <p className="mt-2 text-xs text-slate-500">
            Demo mode: this marks the enquiry as converted. A real service request needs to be created through your service-request ViewModel or backend API.
          </p>

          <div className="mt-5 flex justify-end gap-2">
            <button
              onClick={() => setShowConvert(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={convertEnquiry}
              disabled={!serviceDate}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              Convert <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}

      {/* Receive enquiry */}
      {showForm && (
        <Modal title="Receive Customer Enquiry" onClose={() => setShowForm(false)}>
          <form onSubmit={addEnquiry} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Customer Name"
                required
                value={form.customerName}
                onChange={(value) => setForm({ ...form, customerName: value })}
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
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Priority
                </label>
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as Enquiry["priority"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Enquiry Details
              </label>
              <textarea
                required
                rows={3}
                value={form.message}
                onChange={(event) => setForm({ ...form, message: event.target.value })}
                placeholder="Describe the customer's requirements..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Save Enquiry
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  accent,
  iconStyle,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  accent: string;
  iconStyle: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-100 border-t-4 ${accent} bg-white p-4 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
          <Icon size={19} />
        </div>
      </div>
      <p className="mt-4 text-[11px] text-slate-500">
        Updated from current enquiry records
      </p>
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button
        aria-label="Close modal backdrop"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-medium text-slate-800">
        {value}
      </p>
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
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}
