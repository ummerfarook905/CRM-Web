
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
  Wrench,
  X,
} from "lucide-react";
import { useEffect,useMemo, useState } from "react";

import {
  useAppDispatch,
  useAppSelector,
} from "../../app/Hooks";

import {
  fetchServices,
  createService,
  updateService as updateServiceApi,
} from "../../services/ServicesSlice";

import {
  fetchBookings,
  updateBooking as updateBookingApi,
} from "../../services/BookingsSlice";

import type { Booking } from "../../services/BookingsSlice";

import {
  fetchCategories,
  createCategory,
} from "../../services/CategoriesSlice";


type ServiceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Scheduled"
  | "In Progress"
  | "Completed";


interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  image?: string;
  requiresMaintenance?: boolean;
  defaultMaintenanceFrequency?: string;
  status: "Active" | "Inactive";
}

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

  const dispatch = useAppDispatch();

  useEffect(() => {
  dispatch(fetchServices());
  dispatch(fetchBookings());
  dispatch(fetchCategories());
  }, [dispatch]);

  const services = useAppSelector(
    (state) => state.services.items
  );

  const bookings = useAppSelector(
    (state) => state.bookings.items
  );

  const categories = useAppSelector(
    (state) => state.categories.items
  );

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
    category: "",
    description: "",
    duration: "2 hours",
    price: "0",
    status: "Active" as Service["status"],
    image: "",
    requiresMaintenance: false,
    defaultMaintenanceFrequency: "",
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

  const handleBookingUpdate = async (
      id: number,
      updates: Partial<Booking>
    ) => {
      try {
        await dispatch(
          updateBookingApi({ id, updates })
        ).unwrap();

        setNotice("Booking updated successfully.");
      } catch (error) {
        setNotice(
          typeof error === "string"
            ? error
            : "Failed to update booking."
        );
      }
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
      image: "",
      requiresMaintenance: false,
      defaultMaintenanceFrequency: "",
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
      image: service.image ?? "",
      requiresMaintenance: service.requiresMaintenance ?? false,
      defaultMaintenanceFrequency: service.defaultMaintenanceFrequency ?? "",
    });
    setServiceModal(true);
  };

  
const saveService = async (
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
    setNotice("Please enter valid service details.");
    return;
  }

  const payload = {
    name: serviceForm.name.trim(),
    category: serviceForm.category,
    description: serviceForm.description.trim(),
    duration: serviceForm.duration,
    price,
    status: serviceForm.status,
    image: serviceForm.image,
    requiresMaintenance: serviceForm.requiresMaintenance,
    defaultMaintenanceFrequency:
      serviceForm.requiresMaintenance
        ? serviceForm.defaultMaintenanceFrequency
        : "",
  };

  try {
    if (editingService) {
      await dispatch(
        updateServiceApi({
          ...editingService,
          ...payload,
        })
      ).unwrap();

      setNotice("Service updated successfully.");
    } else {
      await dispatch(
        createService(payload)
      ).unwrap();

      setNotice("Service added successfully.");
    }

    setServiceModal(false);
  } catch (error) {
  console.error("Save service error:", error);

  setNotice(
    typeof error === "string"
      ? error
      : "Failed to save service. Check the browser console."
  );
}
};


  
const addCategory = async (
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

  try {
    await dispatch(createCategory(value)).unwrap();

    setCategoryName("");
    setCategoryModal(false);
    setNotice("Category added successfully.");
  } catch (error) {
    setNotice(
      typeof error === "string"
        ? error
        : "Failed to create category."
    );
  }
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

  const saveSchedule = async (
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

    try {
      await dispatch(
        updateBookingApi({
          id: scheduleBooking.id,
          updates: {
            scheduledDate: scheduleForm.date,
            scheduledTime: scheduleForm.time,
            assignedTo: scheduleForm.assignedTo,
            notes: scheduleForm.notes,
            status: "Scheduled",
          },
        })
      ).unwrap();

      setScheduleBooking(null);
      setNotice("Service scheduled and assigned successfully.");
    } catch (error) {
      setNotice(
        typeof error === "string"
          ? error
          : "Failed to schedule service."
      );
    }
  };

  const approveBooking = async (booking: Booking) => {
  await handleBookingUpdate(booking.id, {
    status: "Approved",
  });
};

const rejectBooking = async (booking: Booking) => {
  await handleBookingUpdate(booking.id, {
    status: "Rejected",
  });
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
    {/* Header and Filters */}
    <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-3 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Service Requests & Bookings
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          Approve requests, reject requests, schedule work and assign staff.
        </p>
      </div>

      <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:w-auto lg:flex-1 lg:max-w-xl">
        <div className="relative min-w-0">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search bookings..."
            className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="relative min-w-0">
          <Filter
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
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

    {/* MOBILE AND TABLET: Booking Cards */}
    <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
      {filteredBookings.map((booking) => {
        const service = getService(booking.serviceId);

        return (
          <article
            key={booking.id}
            className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            {/* Customer and Status */}
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="break-words text-sm font-bold text-slate-900">
                  {booking.customer}
                </h3>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {booking.reference}
                </p>
                <p className="mt-1 break-words text-xs text-slate-500">
                  {booking.company}
                </p>
              </div>

              <span
                className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[booking.status]}`}
              >
                {booking.status}
              </span>
            </div>

            <div className="my-4 border-t border-slate-100" />

            {/* Booking Details */}
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Service
                </p>
                <p className="mt-1 break-words text-xs font-medium text-slate-800">
                  {service?.name ?? "Service unavailable"}
                </p>
                <p className="mt-1 break-words text-[11px] text-slate-500">
                  {service?.category}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Location
                </p>
                <p className="mt-1 flex min-w-0 items-start gap-1 break-words text-xs text-slate-700">
                  <MapPin size={13} className="mt-0.5 shrink-0" />
                  <span className="min-w-0 break-words">
                    {booking.location}
                  </span>
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Requested Date
                </p>
                <p className="mt-1 break-words text-xs text-slate-700">
                  {booking.requestedDate}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Assigned To
                </p>
                <p className="mt-1 break-words text-xs text-slate-700">
                  {booking.assignedTo || "Unassigned"}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setSelectedBooking(booking)}
                className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Eye size={14} />
                View
              </button>

              {booking.status === "Pending" && (
                <>
                  <button
                    type="button"
                    onClick={() => approveBooking(booking)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    <Check size={14} />
                    Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectBooking(booking)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </>
              )}

              {booking.status !== "Rejected" &&
                booking.status !== "Completed" &&
                booking.status !== "In Progress" && (
                  <button
                    type="button"
                    onClick={() => openSchedule(booking)}
                    className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                  >
                    <CalendarDays size={14} />
                    Schedule
                  </button>
                )}
            </div>
          </article>
        );
      })}

      {filteredBookings.length === 0 && (
        <div className="col-span-full rounded-xl border border-slate-200 px-4 py-12 text-center">
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
        </div>
      )}
    </div>

    {/* DESKTOP: Full Table */}
    <div className="hidden min-w-0 w-full overflow-x-auto lg:block">
      <table className="w-full table-auto text-left text-xs">
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
                className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:px-4"
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
                <td className="max-w-[190px] break-words px-3 py-4 xl:px-4">
                  <p className="font-bold text-slate-900">
                    {booking.customer}
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {booking.reference} · {booking.company}
                  </p>
                </td>

                <td className="max-w-[180px] break-words px-3 py-4 xl:px-4">
                  <p className="font-medium text-slate-700">
                    {service?.name ?? "Service unavailable"}
                  </p>
                  <p className="mt-1 text-[10px] text-slate-400">
                    {service?.category}
                  </p>
                </td>

                <td className="px-3 py-4 xl:px-4">
                  <span className="flex items-center gap-1 text-slate-600">
                    <MapPin size={13} className="shrink-0" />
                    {booking.location}
                  </span>
                </td>

                <td className="whitespace-nowrap px-3 py-4 text-slate-600 xl:px-4">
                  {booking.requestedDate}
                </td>

                <td className="px-3 py-4 xl:px-4">
                  <span
                    className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[booking.status]}`}
                  >
                    {booking.status}
                  </span>
                </td>

                <td className="max-w-[140px] break-words px-3 py-4 text-slate-600 xl:px-4">
                  {booking.assignedTo || (
                    <span className="text-slate-400">Unassigned</span>
                  )}
                </td>

                <td className="px-3 py-4 xl:px-4">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="View booking"
                      onClick={() => setSelectedBooking(booking)}
                      className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye size={15} />
                    </button>

                    {booking.status === "Pending" && (
                      <>
                        <button
                          type="button"
                          title="Approve request"
                          onClick={() => approveBooking(booking)}
                          className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50"
                        >
                          <Check size={15} />
                        </button>

                        <button
                          type="button"
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
                          type="button"
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

    {/* Booking Count */}
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-3 text-xs text-slate-500 sm:px-5">
      <span>
        Showing {filteredBookings.length} of {bookings.length} bookings
      </span>
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

              
              {/* Service image upload */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Service Image
                </label>

                <label
                  htmlFor="service-image-upload"
                  className="flex min-h-[125px] w-full cursor-pointer flex-col
                    items-center justify-center rounded-xl border-2 border-dashed
                    border-emerald-400 bg-emerald-50/40 px-4 py-5 text-center
                    transition-colors hover:border-emerald-600 hover:bg-emerald-50"
                >
                  {serviceForm.image ? (
                    <div className="flex flex-col items-center gap-2">
                      <img
                        src={serviceForm.image}
                        alt="Service preview"
                        className="h-20 w-28 rounded-lg border border-slate-200 object-cover"
                      />

                      <span className="text-sm font-semibold text-emerald-700">
                        Change service image
                      </span>
                    </div>
                  ) : (
                    <>
                      {/* Upload icon */}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mb-2 text-emerald-600"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <path d="m21 15-5-5L5 21" />
                        <path d="M16 3v6" />
                        <path d="M13 6h6" />
                      </svg>

                      <span className="text-sm font-semibold text-slate-800">
                        Upload service image
                      </span>

                      <span className="mt-1 text-xs text-slate-400">
                        JPG, PNG or WEBP images
                      </span>
                    </>
                  )}

                  <input
                    id="service-image-upload"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;

                      const reader = new FileReader();

                      reader.onload = () => {
                        setServiceForm((current) => ({
                          ...current,
                          image: String(reader.result ?? ""),
                        }));
                      };

                      reader.readAsDataURL(file);
                    }}
                  />
                </label>

                {serviceForm.image && (
                  <button
                    type="button"
                    onClick={() => {
                      setServiceForm((current) => ({
                        ...current,
                        image: "",
                      }));

                      const input = document.getElementById(
                        "service-image-upload"
                      ) as HTMLInputElement | null;

                      if (input) input.value = "";
                    }}
                    className="mt-2 rounded-lg border border-slate-200 px-3 py-2
                      text-xs font-medium text-red-600 transition-colors
                      hover:bg-red-50"
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Maintenance settings */}
              <div className="rounded-xl border border-slate-200 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={serviceForm.requiresMaintenance}
                    onChange={(event) =>
                      setServiceForm((current) => ({
                        ...current,
                        requiresMaintenance: event.target.checked,
                        defaultMaintenanceFrequency: event.target.checked
                          ? current.defaultMaintenanceFrequency
                          : "",
                      }))
                    }
                    className="mt-0.5 h-4 w-4"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800">
                      Requires Maintenance
                    </span>
                    <span className="mt-1 block text-xs text-slate-500">
                      Enable this if the service needs recurring maintenance.
                    </span>
                  </span>
                </label>

                {serviceForm.requiresMaintenance && (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Default Maintenance Frequency
                    </label>

                    <select
                      required
                      value={serviceForm.defaultMaintenanceFrequency}
                      onChange={(event) =>
                        setServiceForm((current) => ({
                          ...current,
                          defaultMaintenanceFrequency: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    >
                      <option value="">Select maintenance frequency</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Every 3 Months">Every 3 Months</option>
                      <option value="Every 6 Months">Every 6 Months</option>
                      <option value="Annually">Annually</option>
                    </select>
                  </div>
                )}
              </div>

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
