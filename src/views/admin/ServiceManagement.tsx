
import {
  CalendarDays,
  Check,
  Clock,
  ClipboardList,
  Edit,
  Eye,
  Filter,
  MapPin,
  Plus,
  Search,
  Settings2,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type ServiceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Scheduled"
  | "In Progress"
  | "Completed";

type Priority = "Low" | "Medium" | "High";

interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  status: "Active" | "Inactive";
}

interface Booking {
  id: number;
  reference: string;
  customer: string;
  company: string;
  serviceId: number;
  location: string;
  requestedDate: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: Priority;
  status: ServiceStatus;
  assignedTo: string;
  notes: string;
}

const initialCategories = [
  "Maintenance",
  "Installation",
  "Repair",
  "Inspection",
  "Annual Maintenance Contract",
];

const initialServices: Service[] = [
  {
    id: 1,
    name: "RO System Maintenance",
    category: "Maintenance",
    description:
      "Routine inspection and maintenance of industrial RO systems.",
    duration: "2 hours",
    price: 2500,
    status: "Active",
  },
  {
    id: 2,
    name: "Water Treatment Plant Installation",
    category: "Installation",
    description:
      "Installation, testing and commissioning of water treatment plants.",
    duration: "1 day",
    price: 15000,
    status: "Active",
  },
  {
    id: 3,
    name: "Filter Replacement",
    category: "Repair",
    description:
      "Replacement and testing of water filtration components.",
    duration: "1 hour",
    price: 1200,
    status: "Active",
  },
  {
    id: 4,
    name: "System Inspection",
    category: "Inspection",
    description:
      "Equipment inspection and water system performance verification.",
    duration: "90 minutes",
    price: 1800,
    status: "Active",
  },
  {
    id: 5,
    name: "Annual Maintenance Contract",
    category: "Annual Maintenance Contract",
    description:
      "Scheduled preventive maintenance under an annual contract.",
    duration: "As scheduled",
    price: 25000,
    status: "Active",
  },
];

const initialBookings: Booking[] = [
  {
    id: 1,
    reference: "SR-1001",
    customer: "Rajesh Kumar",
    company: "ABC Industries",
    serviceId: 1,
    location: "Chennai",
    requestedDate: "2026-10-10",
    scheduledDate: "",
    scheduledTime: "",
    priority: "High",
    status: "Pending",
    assignedTo: "",
    notes: "RO system pressure is low. Inspection required.",
  },
  {
    id: 2,
    reference: "SR-1002",
    customer: "Anil Thomas",
    company: "GreenTech Pvt Ltd",
    serviceId: 2,
    location: "Coimbatore",
    requestedDate: "2026-10-09",
    scheduledDate: "2026-10-12",
    scheduledTime: "10:00",
    priority: "High",
    status: "Scheduled",
    assignedTo: "John Mathew",
    notes: "Coordinate site access with the facility manager.",
  },
  {
    id: 3,
    reference: "SR-1003",
    customer: "Priya Menon",
    company: "Sunrise Apartments",
    serviceId: 3,
    location: "Madurai",
    requestedDate: "2026-10-08",
    scheduledDate: "",
    scheduledTime: "",
    priority: "Medium",
    status: "Approved",
    assignedTo: "",
    notes: "Replace filters and verify output quality.",
  },
  {
    id: 4,
    reference: "SR-1004",
    customer: "Arun Joseph",
    company: "Global Foods",
    serviceId: 4,
    location: "Thrissur",
    requestedDate: "2026-10-07",
    scheduledDate: "",
    scheduledTime: "",
    priority: "Low",
    status: "Rejected",
    assignedTo: "",
    notes: "Customer requested a date outside the available service window.",
  },
  {
    id: 5,
    reference: "SR-1005",
    customer: "Suresh Nair",
    company: "Sri Hospitals",
    serviceId: 5,
    location: "Kochi",
    requestedDate: "2026-10-06",
    scheduledDate: "2026-10-15",
    scheduledTime: "14:00",
    priority: "Medium",
    status: "In Progress",
    assignedTo: "Meera Joseph",
    notes: "Perform the scheduled AMC inspection.",
  },
];

const teamMembers = [
  "John Mathew",
  "Meera Joseph",
  "Arun Mathew",
  "Rahul Nair",
  "Fathima Ali",
];

const statusStyles: Record<ServiceStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700",
  Scheduled: "bg-violet-50 text-violet-700",
  "In Progress": "bg-cyan-50 text-cyan-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

export default function ServiceManagement() {
  const [services, setServices] =
    useState<Service[]>(initialServices);

  const [bookings, setBookings] =
    useState<Booking[]>(initialBookings);

  const [categories, setCategories] =
    useState<string[]>(initialCategories);

  const [activeTab, setActiveTab] =
    useState<"bookings" | "services" | "categories">(
      "bookings"
    );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("All");

  const [serviceModal, setServiceModal] =
    useState(false);

  const [categoryModal, setCategoryModal] =
    useState(false);

  const [scheduleBooking, setScheduleBooking] =
    useState<Booking | null>(null);

  const [selectedBooking, setSelectedBooking] =
    useState<Booking | null>(null);

  const [editingService, setEditingService] =
    useState<Service | null>(null);

  const [categoryName, setCategoryName] = useState("");

  const [serviceForm, setServiceForm] = useState({
    name: "",
    category: initialCategories[0],
    description: "",
    duration: "2 hours",
    price: "0",
    status: "Active" as Service["status"],
  });

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "09:00",
    assignedTo: "",
    notes: "",
  });

  const [notice, setNotice] = useState("");

  const getService = (id: number) =>
    services.find((service) => service.id === id);

  const filteredBookings = useMemo(() => {
    const query = search.toLowerCase().trim();

    return bookings.filter((booking) => {
      const service = getService(booking.serviceId);

      const matchesSearch =
        !query ||
        [
          booking.reference,
          booking.customer,
          booking.company,
          booking.location,
          service?.name ?? "",
          booking.assignedTo,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" ||
        booking.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [bookings, services, search, statusFilter]);

  const updateBooking = (
    id: number,
    updates: Partial<Booking>
  ) => {
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? { ...booking, ...updates }
          : booking
      )
    );
  };

  const openAddService = () => {
    setEditingService(null);
    setServiceForm({
      name: "",
      category: categories[0] ?? "",
      description: "",
      duration: "2 hours",
      price: "0",
      status: "Active",
    });
    setServiceModal(true);
  };

  const openEditService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      category: service.category,
      description: service.description,
      duration: service.duration,
      price: String(service.price),
      status: service.status,
    });
    setServiceModal(true);
  };

  const saveService = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const price = Number(serviceForm.price);

    if (
      !serviceForm.name.trim() ||
      !serviceForm.category ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return;
    }

    if (editingService) {
      setServices((current) =>
        current.map((service) =>
          service.id === editingService.id
            ? {
                ...service,
                ...serviceForm,
                name: serviceForm.name.trim(),
                description: serviceForm.description.trim(),
                price,
              }
            : service
        )
      );
      setNotice("Service updated successfully.");
    } else {
      setServices((current) => [
        ...current,
        {
          id: Date.now(),
          ...serviceForm,
          name: serviceForm.name.trim(),
          description: serviceForm.description.trim(),
          price,
        },
      ]);
      setNotice("Service added successfully.");
    }

    setServiceModal(false);
  };

  const addCategory = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const value = categoryName.trim();

    if (!value) return;

    if (
      categories.some(
        (category) =>
          category.toLowerCase() === value.toLowerCase()
      )
    ) {
      setNotice("That category already exists.");
      return;
    }

    setCategories((current) => [...current, value]);
    setCategoryName("");
    setNotice("Category added successfully.");
  };

  const openSchedule = (booking: Booking) => {
    setScheduleBooking(booking);

    setScheduleForm({
      date: booking.scheduledDate,
      time: booking.scheduledTime || "09:00",
      assignedTo: booking.assignedTo,
      notes: booking.notes,
    });
  };

  const saveSchedule = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !scheduleBooking ||
      !scheduleForm.date ||
      !scheduleForm.time ||
      !scheduleForm.assignedTo
    ) {
      return;
    }

    updateBooking(scheduleBooking.id, {
      scheduledDate: scheduleForm.date,
      scheduledTime: scheduleForm.time,
      assignedTo: scheduleForm.assignedTo,
      notes: scheduleForm.notes,
      status: "Scheduled",
    });

    setScheduleBooking(null);
    setNotice("Service scheduled and assigned successfully.");
  };

  const approveBooking = (booking: Booking) => {
    updateBooking(booking.id, { status: "Approved" });
    setNotice(`${booking.reference} approved.`);
  };

  const rejectBooking = (booking: Booking) => {
    updateBooking(booking.id, { status: "Rejected" });
    setNotice(`${booking.reference} rejected.`);
  };

  const tabClass = (tab: typeof activeTab) =>
    `border-b-2 px-4 py-3 text-sm font-semibold transition ${
      activeTab === tab
        ? "border-emerald-800 text-emerald-800"
        : "border-transparent text-slate-500 hover:text-slate-800"
    }`;

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Operations / Services
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Service Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage service catalogues, customer bookings and field assignments.
          </p>
        </div>

        <button
          onClick={openAddService}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          <Plus size={17} />
          Add Service
        </button>
      </div>

      {/* Feedback */}
      {notice && (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss message"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Services"
          value={services.length}
          icon={Wrench}
          accent="border-slate-900"
          iconStyle="bg-indigo-50 text-indigo-700"
        />

        <SummaryCard
          title="Pending Requests"
          value={bookings.filter((b) => b.status === "Pending").length}
          icon={Clock}
          accent="border-amber-500"
          iconStyle="bg-amber-50 text-amber-700"
        />

        <SummaryCard
          title="Scheduled Services"
          value={bookings.filter((b) => b.status === "Scheduled").length}
          icon={CalendarDays}
          accent="border-lime-500"
          iconStyle="bg-lime-50 text-lime-700"
        />

        <SummaryCard
          title="Active Work"
          value={bookings.filter((b) => b.status === "In Progress").length}
          icon={ClipboardList}
          accent="border-cyan-500"
          iconStyle="bg-cyan-50 text-cyan-700"
        />
      </div>

      {/* Main panel */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap gap-1 border-b border-slate-200 px-4">
          <button
            className={tabClass("bookings")}
            onClick={() => setActiveTab("bookings")}
          >
            Service Bookings
          </button>
          <button
            className={tabClass("services")}
            onClick={() => setActiveTab("services")}
          >
            Service Catalogue
          </button>
          <button
            className={tabClass("categories")}
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
        </div>

        {/* Bookings */}
        {activeTab === "bookings" && (
          <>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Service Requests & Bookings
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Approve requests, reject requests, schedule work and assign staff.
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
                    placeholder="Search bookings..."
                    className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 sm:w-64"
                  />
                </div>

                <div className="relative">
                  <Filter
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <select
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value)
                    }
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-7 text-sm outline-none focus:border-emerald-600 sm:w-44"
                  >
                    <option value="All">All statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-slate-50">
                  <tr>
                    {[
                      "Booking / Customer",
                      "Service",
                      "Location",
                      "Requested",
                      "Status",
                      "Assigned To",
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
                  {filteredBookings.map((booking) => {
                    const service = getService(booking.serviceId);

                    return (
                      <tr
                        key={booking.id}
                        className="border-t border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold text-slate-900">
                            {booking.customer}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {booking.reference} · {booking.company}
                          </p>
                        </td>

                        <td className="max-w-52 px-4 py-4">
                          <p className="text-xs font-medium text-slate-700">
                            {service?.name ?? "Service unavailable"}
                          </p>
                          <p className="mt-1 text-[10px] text-slate-400">
                            {service?.category}
                          </p>
                        </td>

                        <td className="px-4 py-4">
                          <span className="flex items-center gap-1 text-xs text-slate-600">
                            <MapPin size={13} />
                            {booking.location}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          {booking.requestedDate}
                        </td>

                        <td className="px-4 py-4">
                          <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[booking.status]}`}>
                            {booking.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-slate-600">
                          {booking.assignedTo || (
                            <span className="text-slate-400">
                              Unassigned
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button
                              title="View booking"
                              onClick={() => setSelectedBooking(booking)}
                              className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye size={15} />
                            </button>

                            {booking.status === "Pending" && (
                              <>
                                <button
                                  title="Approve request"
                                  onClick={() => approveBooking(booking)}
                                  className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Check size={15} />
                                </button>
                                <button
                                  title="Reject request"
                                  onClick={() => rejectBooking(booking)}
                                  className="rounded-md p-2 text-red-600 hover:bg-red-50"
                                >
                                  <X size={15} />
                                </button>
                              </>
                            )}

                            {booking.status !== "Rejected" &&
                              booking.status !== "Completed" &&
                              booking.status !== "In Progress" && (
                                <button
                                  title="Schedule and assign service"
                                  onClick={() => openSchedule(booking)}
                                  className="rounded-md p-2 text-violet-700 hover:bg-violet-50"
                                >
                                  <CalendarDays size={15} />
                                </button>
                              )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <ClipboardList
                          size={28}
                          className="mx-auto text-slate-300"
                        />
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          No bookings found
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Try changing your search or status filter.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </>
        )}

        {/* Service catalogue */}
        {activeTab === "services" && (
          <div>
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Service Catalogue
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create and maintain your service offerings.
                </p>
              </div>
              <button
                onClick={openAddService}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <Plus size={16} /> Add Service
              </button>
            </div>

            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="overflow-hidden rounded-xl border border-slate-200"
                >
                  <div className="h-1 bg-gradient-to-r from-emerald-900 to-lime-400" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800">
                        <Wrench size={19} />
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold ${
                          service.status === "Active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {service.status}
                      </span>
                    </div>

                    <h3 className="mt-4 font-bold text-slate-900">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {service.category}
                    </p>
                    <p className="mt-3 min-h-10 text-xs leading-5 text-slate-600">
                      {service.description}
                    </p>

                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[10px] text-slate-400">
                          Starting price
                        </p>
                        <p className="font-bold text-slate-900">
                          ₹{service.price.toLocaleString("en-IN")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400">
                          Duration
                        </p>
                        <p className="text-xs font-medium text-slate-700">
                          {service.duration}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => openEditService(service)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Edit size={14} /> Edit Service
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        {activeTab === "categories" && (
          <div className="p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900">
                  Service Categories
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Organize services by category.
                </p>
              </div>
              <button
                onClick={() => setCategoryModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <Plus size={16} /> Add Category
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {categories.map((category) => {
                const count = services.filter(
                  (service) => service.category === category
                ).length;

                return (
                  <div
                    key={category}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                        <Settings2 size={17} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {category}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {count} {count === 1 ? "service" : "services"}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* Add/Edit service modal */}
      {serviceModal && (
        <Modal
          title={editingService ? "Edit Service" : "Add New Service"}
          onClose={() => setServiceModal(false)}
        >
          <form onSubmit={saveService} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Service Name"
                required
                value={serviceForm.name}
                onChange={(value) =>
                  setServiceForm({ ...serviceForm, name: value })
                }
                placeholder="Enter service name"
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Category
                </label>
                <select
                  required
                  value={serviceForm.category}
                  onChange={(event) =>
                    setServiceForm({
                      ...serviceForm,
                      category: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  {categories.length === 0 && (
                    <option value="">Add a category first</option>
                  )}
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <Field
                label="Duration"
                required
                value={serviceForm.duration}
                onChange={(value) =>
                  setServiceForm({ ...serviceForm, duration: value })
                }
                placeholder="e.g. 2 hours"
              />

              <Field
                label="Price (₹)"
                type="number"
                required
                value={serviceForm.price}
                onChange={(value) =>
                  setServiceForm({ ...serviceForm, price: value })
                }
                placeholder="Enter price"
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={serviceForm.status}
                  onChange={(event) =>
                    setServiceForm({
                      ...serviceForm,
                      status: event.target.value as Service["status"],
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                Description
              </label>
              <textarea
                rows={3}
                value={serviceForm.description}
                onChange={(event) =>
                  setServiceForm({
                    ...serviceForm,
                    description: event.target.value,
                  })
                }
                placeholder="Describe the service..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setServiceModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={categories.length === 0}
                className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                {editingService ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add category modal */}
      {categoryModal && (
        <Modal
          title="Add Service Category"
          onClose={() => setCategoryModal(false)}
        >
          <form
            onSubmit={(event) => {
              addCategory(event);
              setCategoryModal(false);
            }}
            className="space-y-4"
          >
            <Field
              label="Category Name"
              required
              value={categoryName}
              onChange={setCategoryName}
              placeholder="e.g. Emergency Repair"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCategoryModal(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Add Category
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Schedule and assign */}
      {scheduleBooking && (
        <Modal
          title="Schedule & Assign Service"
          onClose={() => setScheduleBooking(null)}
        >
          <div className="mb-4 rounded-lg bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-800">
              {scheduleBooking.reference}
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {scheduleBooking.customer} · {scheduleBooking.company}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              {getService(scheduleBooking.serviceId)?.name}
            </p>
          </div>

          <form onSubmit={saveSchedule} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Service Date"
                type="date"
                required
                value={scheduleForm.date}
                onChange={(value) =>
                  setScheduleForm({ ...scheduleForm, date: value })
                }
                placeholder=""
              />
              <Field
                label="Service Time"
                type="time"
                required
                value={scheduleForm.time}
                onChange={(value) =>
                  setScheduleForm({ ...scheduleForm, time: value })
                }
                placeholder=""
              />

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Assign Technician / Manager
                </label>
                <select
                  required
                  value={scheduleForm.assignedTo}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      assignedTo: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="">Select team member</option>
                  {teamMembers.map((member) => (
                    <option key={member} value={member}>
                      {member}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Work Instructions
                </label>
                <textarea
                  rows={3}
                  value={scheduleForm.notes}
                  onChange={(event) =>
                    setScheduleForm({
                      ...scheduleForm,
                      notes: event.target.value,
                    })
                  }
                  placeholder="Add work instructions..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setScheduleBooking(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Booking details */}
      {selectedBooking && (
        <Modal
          title={`Booking Details — ${selectedBooking.reference}`}
          onClose={() => setSelectedBooking(null)}
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedBooking.customer}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedBooking.company}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[selectedBooking.status]}`}
              >
                {selectedBooking.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail
                label="Service"
                value={getService(selectedBooking.serviceId)?.name ?? "Unknown"}
              />
              <Detail label="Location" value={selectedBooking.location} />
              <Detail label="Requested Date" value={selectedBooking.requestedDate} />
              <Detail label="Priority" value={selectedBooking.priority} />
              <Detail
                label="Scheduled Date"
                value={selectedBooking.scheduledDate || "Not scheduled"}
              />
              <Detail
                label="Scheduled Time"
                value={selectedBooking.scheduledTime || "Not scheduled"}
              />
              <Detail
                label="Assigned To"
                value={selectedBooking.assignedTo || "Unassigned"}
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-500">
                Work Instructions / Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {selectedBooking.notes || "No instructions provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedBooking.status === "Pending" && (
                <>
                  <button
                    onClick={() => {
                      approveBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                    className="rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      rejectBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                    className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600"
                  >
                    Reject
                  </button>
                </>
              )}

              {selectedBooking.status !== "Rejected" &&
                selectedBooking.status !== "Completed" &&
                selectedBooking.status !== "In Progress" && (
                  <button
                    onClick={() => {
                      setSelectedBooking(null);
                      openSchedule(selectedBooking);
                    }}
                    className="rounded-lg bg-violet-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    Schedule & Assign
                  </button>
                )}
            </div>
          </div>
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
    <div className={`overflow-hidden rounded-xl border border-slate-100 border-t-4 ${accent} bg-white p-4 shadow-sm`}>
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
        Current service records
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
        type="button"
        aria-label="Close modal backdrop"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900">
            {title}
          </h2>
          <button
            type="button"
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
        min={type === "number" ? 0 : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}
