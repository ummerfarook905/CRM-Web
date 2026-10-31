
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
import { useEffect, useMemo, useState } from "react";
import { useAssignableEmployees } from "../../viewmodels/shared/UseAssignableEmployees";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchBookings, updateBooking, type Booking } from "../../services/BookingsSlice";
import { fetchServices, createService, updateService } from "../../services/ServicesSlice";
import type { Service as ApiService, CreateServicePayload } from "../../models/admin/Service";
import { fetchCategories, createCategory } from "../../services/CategoriesSlice";
import { fetchWorkOrders } from "../../services/WorkMonitoringSlice";
import { api } from "../../api/axios";

type ServiceStatus = Booking["status"];
type Service = ApiService;

const statusStyles: Record<ServiceStatus, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700",
  Scheduled: "bg-violet-50 text-violet-700",
  Assigned: "bg-violet-50 text-violet-700",
  "In Progress": "bg-cyan-50 text-cyan-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

export default function ServiceManagement() {
  const dispatch = useAppDispatch();
  const serviceState = useAppSelector((state) => state.services);
  const bookingState = useAppSelector((state) => state.bookings);
  const categoryState = useAppSelector((state) => state.categories);
  const services = serviceState.items;
  const bookings = bookingState.items;
  const categories = categoryState.items.map((item) => item.name);
  useEffect(() => {
    void dispatch(fetchServices());
    void dispatch(fetchBookings());
    void dispatch(fetchCategories());
  }, [dispatch]);
  const { employees: teamMembers, loading: teamLoading, error: teamError } = useAssignableEmployees();

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
  });

  const [scheduleForm, setScheduleForm] = useState({
    date: "",
    time: "09:00",
    assignedTo: "",
    notes: "",
  });

  const [notice, setNotice] = useState("");

  const getService = (id: number | string) =>
    services.find((service) => String(service.id) === String(id));

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
      return;
    }

    const categoryId = categoryState.items.find((item) => item.name === serviceForm.category)?.id;
    const durationMatch = serviceForm.duration.trim().match(/^(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?|days?)?$/i);
    if (!categoryId || !durationMatch) {
      setNotice(!categoryId ? "Select a valid service category." : "Enter a duration such as 90 minutes or 2 hours.");
      return;
    }
    const amount = Number(durationMatch[1]);
    const unit = (durationMatch[2] ?? "minutes").toLowerCase();
    const estimatedDuration = Math.round(amount * (unit.startsWith("day") ? 1440 : unit.startsWith("hour") || unit.startsWith("hr") ? 60 : 1));
    const payload: CreateServicePayload = {
      name: serviceForm.name.trim(), categoryId, description: serviceForm.description.trim(),
      estimatedDuration, basePrice: price, requiresMaintenance: editingService?.requiresMaintenance ?? false,
      defaultMaintenanceFrequency: editingService?.defaultMaintenanceFrequency ?? null, isActive: serviceForm.status === "Active",
    };
    try {
      if (editingService) await dispatch(updateService({ id: editingService.id, ...payload })).unwrap();
      else await dispatch(createService(payload)).unwrap();
      await dispatch(fetchServices()).unwrap();
      setServiceModal(false);
      setNotice(editingService ? "Service updated successfully." : "Service added successfully.");
    } catch (error) { setNotice(typeof error === "string" ? error : "Failed to save service."); }
  };

  const addCategory = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<boolean> => {
    event.preventDefault();

    const value = categoryName.trim();

    if (!value) return false;

    if (
      categories.some(
        (category) =>
          category.toLowerCase() === value.toLowerCase()
      )
    ) {
      setNotice("That category already exists.");
      return false;
    }

    try {
      await dispatch(createCategory(value)).unwrap();
      await dispatch(fetchCategories()).unwrap();
      setCategoryName("");
      setNotice("Category added successfully.");
      return true;
    } catch (error) { setNotice(typeof error === "string" ? error : "Failed to create category."); return false; }
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
      const employeeId = teamMembers.find((member) => member.name === scheduleForm.assignedTo)?.id;
      if (!employeeId) throw new Error("Select an active technician from the team list.");
      const [hours, minutes] = scheduleForm.time.split(":").map(Number);
      const end = new Date(2000, 0, 1, hours, minutes + scheduleBooking.serviceDurationMinutes);
      const scheduledEndTime = `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`;
      if (scheduleBooking.workOrderId) {
        await api.patch(`/work-orders/${encodeURIComponent(scheduleBooking.workOrderId)}/schedule`, { scheduledDate: scheduleForm.date, scheduledStartTime: scheduleForm.time, scheduledEndTime });
        const newEmployeeIds = scheduleBooking.employeeIds.includes(employeeId) ? [] : [employeeId];
        if (newEmployeeIds.length) await api.post("/work-assignments", { workOrderId: scheduleBooking.workOrderId, employeeIds: newEmployeeIds });
      } else {
        if (scheduleBooking.status === "Pending") await dispatch(updateBooking({ id: scheduleBooking.id, updates: { status: "Approved" } })).unwrap();
        else if (scheduleBooking.status !== "Approved" && scheduleBooking.status !== "Scheduled") throw new Error(`Cannot schedule a ${scheduleBooking.status} booking.`);
        await api.post("/work-orders", { bookingId: String(scheduleBooking.id), scheduledDate: scheduleForm.date, scheduledStartTime: scheduleForm.time, scheduledEndTime, employeeIds: [employeeId], ...(scheduleForm.notes.trim() ? { instructions: scheduleForm.notes.trim() } : {}) });
      }
      await Promise.all([dispatch(fetchBookings()).unwrap(), dispatch(fetchWorkOrders({ page: 1, limit: 100 })).unwrap()]);
      setScheduleBooking(null);
      setNotice("Service scheduled and assigned successfully.");
    } catch (error) {
      const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setNotice(typeof error === "string" ? error : Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : error instanceof Error ? error.message : "Failed to schedule service.");
    }
  };

  const approveBooking = async (booking: Booking) => {
    try {
      await dispatch(updateBooking({ id: booking.id, updates: { status: "Approved" } })).unwrap();
      await dispatch(fetchBookings()).unwrap();
      setNotice(`${booking.reference} approved.`);
    } catch (error) { setNotice(typeof error === "string" ? error : "Failed to approve booking."); }
  };

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
      {(serviceState.error || bookingState.error || categoryState.error) && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{serviceState.error || bookingState.error || categoryState.error}</p>}
      {(serviceState.loading || bookingState.loading || categoryState.loading) && <p role="status" className="text-sm text-slate-500">Loading service data…</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Services"
          value={services.length}
          icon={Wrench}
          accent="border-blue-600"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Pending Requests"
          value={bookings.filter((b) => b.status === "Pending").length}
          icon={Clock}
          accent="border-blue-500"
          iconStyle="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Scheduled Services"
          value={bookings.filter((b) => b.status === "Scheduled").length}
          icon={CalendarDays}
          accent="border-emerald-500"
          iconStyle="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          title="Active Work"
          value={bookings.filter((b) => b.status === "In Progress").length}
          icon={ClipboardList}
          accent="border-teal-500"
          iconStyle="bg-teal-50 text-teal-700"
        />
      </div>

      {/* Main panel */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="crm-tabs" role="tablist" aria-label="Service management sections">
          <button
            role="tab"
            id="manager-service-tab-btn-bookings"
            aria-controls="manager-service-tab-bookings"
            aria-selected={activeTab === "bookings"}
            className="crm-tab"
            onClick={() => setActiveTab("bookings")}
          >
            Service Bookings
          </button>
          <button
            role="tab"
            id="manager-service-tab-btn-services"
            aria-controls="manager-service-tab-services"
            aria-selected={activeTab === "services"}
            className="crm-tab"
            onClick={() => setActiveTab("services")}
          >
            Service Catalogue
          </button>
          <button
            role="tab"
            id="manager-service-tab-btn-categories"
            aria-controls="manager-service-tab-categories"
            aria-selected={activeTab === "categories"}
            className="crm-tab"
            onClick={() => setActiveTab("categories")}
          >
            Categories
          </button>
        </div>

        {/* Bookings */}

{activeTab === "bookings" && (
  <div id="manager-service-tab-bookings" role="tabpanel" aria-labelledby="manager-service-tab-btn-bookings" key={activeTab} className="book-page-open">
    {/* Header and Filters */}
    <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-3 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-slate-900 sm:text-lg">
          Service Requests & Bookings
        </h2>
        <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
          Approve requests, schedule work and assign staff.
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
            <option value="Scheduled">Scheduled</option>
            <option value="Assigned">Assigned</option>
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
                </>
              )}

              {
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
  </div>
)}



        {/* Service catalogue */}
        {activeTab === "services" && (
          <div id="manager-service-tab-services" role="tabpanel" aria-labelledby="manager-service-tab-btn-services" key={activeTab} className="book-page-open">
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
          <div id="manager-service-tab-categories" role="tabpanel" aria-labelledby="manager-service-tab-btn-categories" key={activeTab} className="book-page-open p-5">
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
              void addCategory(event).then((created) => { if (created) setCategoryModal(false); });
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
                    <option key={member.id} value={member.name}>
                      {member.name} · {member.designation || member.role}
                    </option>
                  ))}
                </select>
                {teamLoading && <p className="mt-1 text-xs text-slate-500">Loading staff…</p>}
                {!teamLoading && teamMembers.length === 0 && (
                  <p className="mt-1 text-xs text-amber-700">
                    {teamError || "No active staff found in the employee database."}
                  </p>
                )}
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
