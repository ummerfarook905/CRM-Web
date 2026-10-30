
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
  Trash2,
  X,
} from "lucide-react";

import {useServiceManagementViewModel} from "../../viewmodels/admin/UseServiceManagementViewModel";

import type { Service } from "../../models/admin/Service";

import type { Booking } from "../../services/BookingsSlice";
import { useAssignableEmployees } from "../../viewmodels/shared/UseAssignableEmployees";

const statusStyles: Record<string, string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-blue-50 text-blue-700",
  Rejected: "bg-red-50 text-red-700",
  Scheduled: "bg-violet-50 text-violet-700",
  "In Progress": "bg-cyan-50 text-cyan-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

export default function ServiceManagement() {
  const vm = useServiceManagementViewModel();
  const { employees: teamMembers, loading: teamLoading, error: teamError } = useAssignableEmployees();

  return (
    <div className="min-w-0 space-y-6">
      {/* Page heading */}
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
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
          type="button"
          onClick={vm.openAddService}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          <Plus size={17} />
          Add Service
        </button>
      </header>

      {/* Feedback */}
      {vm.notice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          <span>{vm.notice}</span>
          <button
            type="button"
            onClick={() => vm.setNotice("")}
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
          value={vm.services.length}
          icon={<Wrench size={20} />}
          accent="border-blue-600"
          iconStyle="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          title="Pending Requests"
          value={vm.pendingBookings}
          icon={<Clock size={20} />}
          accent="border-blue-500"
          iconStyle="bg-blue-50 text-blue-700"
        />
        <SummaryCard
          title="Scheduled Services"
          value={vm.scheduledBookings}
          icon={<CalendarDays size={20} />}
          accent="border-emerald-500"
          iconStyle="bg-emerald-50 text-emerald-700"
        />
        <SummaryCard
          title="Active Work"
          value={vm.activeWork}
          icon={<ClipboardList size={20} />}
          accent="border-teal-500"
          iconStyle="bg-teal-50 text-teal-700"
        />
      </div>

      {/* Main panel */}
      <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="crm-tabs" role="tablist" aria-label="Service management sections">
          <button
            type="button"
            role="tab"
            id="service-tab-btn-bookings"
            aria-controls="service-tab-bookings"
            aria-selected={vm.activeTab === "bookings"}
            className="crm-tab"
            onClick={() => vm.setActiveTab("bookings")}
          >
            Service Bookings
          </button>
          <button
            type="button"
            role="tab"
            id="service-tab-btn-services"
            aria-controls="service-tab-services"
            aria-selected={vm.activeTab === "services"}
            className="crm-tab"
            onClick={() => vm.setActiveTab("services")}
          >
            Service Catalogue
          </button>
          <button
            type="button"
            role="tab"
            id="service-tab-btn-categories"
            aria-controls="service-tab-categories"
            aria-selected={vm.activeTab === "categories"}
            className="crm-tab"
            onClick={() => vm.setActiveTab("categories")}
          >
            Categories
          </button>
        </div>

        {/* Bookings */}
        {vm.activeTab === "bookings" && (
          <div id="service-tab-bookings" role="tabpanel" aria-labelledby="service-tab-btn-bookings" key={vm.activeTab} className="book-page-open min-w-0">
            <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-3 sm:p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="font-bold text-slate-900">
                  Service Requests & Bookings
                </h2>
                <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                  Approve requests, reject requests, schedule work and assign staff.
                </p>
              </div>

              <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl">
                <div className="relative min-w-0">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    value={vm.search}
                    onChange={(event) => vm.setSearch(event.target.value)}
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
                    value={vm.statusFilter}
                    onChange={(event) =>
                      vm.setStatusFilter(event.target.value)
                    }
                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-emerald-600"
                  >
                    {[
                      "All",
                      "Pending",
                      "Approved",
                      "Rejected",
                      "Scheduled",
                      "In Progress",
                      "Completed",
                    ].map((status) => (
                      <option key={status} value={status}>
                        {status === "All" ? "All statuses" : status}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Responsive booking cards */}
            <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
              {vm.filteredBookings.map((booking) => (
                <BookingCard
                  key={booking.id}
                  booking={booking}
                  service={vm.getService(booking.serviceId)}
                  onView={() => vm.setSelectedBooking(booking)}
                  onApprove={() => void vm.approveBooking(booking)}
                  onReject={() => void vm.rejectBooking(booking)}
                  onSchedule={() => vm.openSchedule(booking)}
                />
              ))}

              {vm.filteredBookings.length === 0 && (
                <EmptyState message="No bookings found. Try changing your search or status filter." />
              )}
            </div>

            {/* Desktop booking table */}
            <div className="hidden w-full overflow-x-auto lg:block">
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
                        className="whitespace-nowrap px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 xl:px-4"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {vm.filteredBookings.map((booking) => {
                    const service = vm.getService(booking.serviceId);

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
                            {service?.category ?? ""}
                          </p>
                        </td>

                        <td className="max-w-[180px] break-words px-3 py-4 xl:px-4">
                          <span className="flex items-start gap-1 text-slate-600">
                            <MapPin size={13} className="mt-0.5 shrink-0" />
                            {booking.location}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-3 py-4 text-slate-600 xl:px-4">
                          {booking.requestedDate}
                        </td>

                        <td className="px-3 py-4 xl:px-4">
                          <StatusBadge status={booking.status} />
                        </td>

                        <td className="max-w-[140px] break-words px-3 py-4 text-slate-600 xl:px-4">
                          {booking.assignedTo || "Unassigned"}
                        </td>

                        <td className="px-3 py-4 xl:px-4">
                          <BookingActions
                            booking={booking}
                            onView={() => vm.setSelectedBooking(booking)}
                            onApprove={() => void vm.approveBooking(booking)}
                            onReject={() => void vm.rejectBooking(booking)}
                            onSchedule={() => vm.openSchedule(booking)}
                          />
                        </td>
                      </tr>
                    );
                  })}

                  {vm.filteredBookings.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-12">
                        <EmptyState message="No bookings found." />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-3 py-3 text-xs text-slate-500 sm:px-5">
              Showing {vm.filteredBookings.length} of {vm.bookings.length} bookings
            </div>
          </div>
        )}

        {/* Service catalogue */}
        {vm.activeTab === "services" && (
          <div id="service-tab-services" role="tabpanel" aria-labelledby="service-tab-btn-services" key={vm.activeTab} className="book-page-open">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div>
                <h2 className="font-bold text-slate-900">Service Catalogue</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Create and maintain your service offerings.
                </p>
              </div>

              <button
                type="button"
                onClick={vm.openAddService}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <Plus size={16} />
                Add Service
              </button>
            </div>

            <div className="grid min-w-0 gap-4 p-3 sm:grid-cols-2 sm:p-5 xl:grid-cols-3">
              {vm.servicesLoading && (
                <div className="col-span-full py-8 text-center text-sm text-slate-500">
                  Loading services...
                </div>
              )}

              {vm.servicesError && (
                <div className="col-span-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {vm.servicesError}
                </div>
              )}

              {vm.services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onEdit={() => vm.openEditService(service)}
                  onDelete={() => vm.handleDeleteService(service.id)}
                />
              ))}

              {vm.services.length === 0 && (
                <div className="col-span-full py-10 text-center text-sm text-slate-500">
                  No services available.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Categories */}
        {vm.activeTab === "categories" && (
          <div id="service-tab-categories" role="tabpanel" aria-labelledby="service-tab-btn-categories" key={vm.activeTab} className="book-page-open p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-bold text-slate-900">Service Categories</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Organize services by category.
                </p>
              </div>

              <button
                type="button"
                onClick={vm.openAddCategory}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <Plus size={16} />
                Add Category
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {vm.categories.map((category) => {
                const count = vm.services.filter(
                  (service) =>
                    String(service.categoryId) === String(category.id),
                ).length;

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                        <Settings2 size={17} />
                      </div>
                      <div className="min-w-0">
                        <p className="break-words text-sm font-semibold text-slate-800">
                          {category.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {count} {count === 1 ? "service" : "services"}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-bold text-slate-400">
                        {count}
                      </span>

                      <button
                        type="button"
                        onClick={() => vm.openEditCategory(category)}
                        title="Edit category"
                        aria-label={`Edit category ${category.name}`}
                        className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void vm.handleDeleteCategory(category.id)}
                        disabled={count > 0}
                        title={
                          count > 0
                            ? "Cannot delete a category that has services"
                            : "Delete category"
                        }
                        className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                        aria-label={`Delete category ${category.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {vm.categories.length === 0 && (
                <p className="col-span-full py-8 text-center text-sm text-slate-500">
                  No categories available.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Add / Edit Service modal */}
      {vm.serviceModal && (
        <Modal
          title={vm.editingService ? "Edit Service" : "Add New Service"}
          onClose={vm.closeServiceModal}
        >
          <form onSubmit={vm.saveService} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Service Name"
                required
                value={vm.serviceForm.name}
                onChange={(value) =>
                  vm.setServiceForm((current) => ({
                    ...current,
                    name: value,
                  }))
                }
                placeholder="Enter service name"
              />

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Category *
                </label>
                <select
                  required
                  value={vm.serviceForm.category}
                  onChange={(event) =>
                    vm.setServiceForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="">Select category</option>
                  {vm.categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Estimated Duration (minutes) *
                </label>

                <input
                  type="number"
                  min="5"
                  max="1440"
                  step="1"
                  required
                  value={vm.serviceForm.duration}
                  onChange={(event) =>
                    vm.setServiceForm((current) => ({
                      ...current,
                      duration: event.target.value,
                    }))
                  }
                  placeholder="Enter duration in minutes"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div>
                <label
                  htmlFor="basePrice"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Base Price (₹) *
                </label>

                <input
                  id="basePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={vm.serviceForm.price}
                  onChange={(event) =>
                    vm.setServiceForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  placeholder="Enter base price"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={vm.serviceForm.description}
                  onChange={(event) =>
                    vm.setServiceForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  placeholder="Describe this service"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Status
                </label>
                <select
                  value={vm.serviceForm.status}
                  onChange={(event) =>
                    vm.setServiceForm((current) => ({
                      ...current,
                      status: event.target.value as Service["status"],
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-2 rounded-lg border border-slate-200 p-3">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={vm.serviceForm.requiresMaintenance}
                    onChange={(event) =>
                      vm.setServiceForm((current) => ({
                        ...current,
                        requiresMaintenance: event.target.checked,
                        defaultMaintenanceFrequency: event.target.checked
                          ? current.defaultMaintenanceFrequency
                          : "",
                      }))
                    }
                    className="h-4 w-4 accent-emerald-800"
                  />
                  Requires maintenance
                </label>
                <p className="ml-6 mt-1 text-xs text-slate-500">
                  Enable this if the service needs recurring maintenance.
                </p>

                {vm.serviceForm.requiresMaintenance && (
                  <div className="mt-4">
                    <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                      Default Maintenance Frequency *
                    </label>
                    <select
                      required
                      value={vm.serviceForm.defaultMaintenanceFrequency}
                      onChange={(event) =>
                        vm.setServiceForm((current) => ({
                          ...current,
                          defaultMaintenanceFrequency: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                    >
                      <option value="">Select frequency</option>
                      <option value="WEEKLY">Weekly</option>
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="HALF_YEARLY">Half-Yearly</option>
                      <option value="YEARLY">Yearly</option>
                      <option value="CUSTOM">Custom</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={vm.closeServiceModal}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                {vm.editingService ? "Save Changes" : "Create Service"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      
      {/* Add / Edit Category modal */}
      {vm.categoryModal && (
        <Modal
          title={
            vm.editingCategory
              ? "Edit Service Category"
              : "Add Service Category"
          }
          onClose={() => {
            vm.setCategoryModal(false);
            vm.setCategoryName("");
          }}
        >
          <form onSubmit={vm.addCategory} className="space-y-4">
            <Field
              label="Category Name"
              required
              value={vm.categoryName}
              onChange={vm.setCategoryName}
              placeholder="Enter category name"
            />

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  vm.setCategoryModal(false);
                  vm.setCategoryName("");
                }}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                {vm.editingCategory ? "Save Changes" : "Add Category"}
              </button>
            </div>
          </form>
        </Modal>
      )}


      {/* Schedule modal */}
      {vm.scheduleBooking && (
        <Modal
          title="Schedule & Assign Service"
          onClose={() => vm.setScheduleBooking(null)}
        >
          <form onSubmit={vm.saveSchedule} className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Booking reference</p>
              <p className="mt-1 font-semibold text-slate-900">
                {vm.scheduleBooking.reference}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {vm.scheduleBooking.customer}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Scheduled Date"
                type="date"
                required
                value={vm.scheduleForm.date}
                onChange={(value) =>
                  vm.setScheduleForm((current) => ({
                    ...current,
                    date: value,
                  }))
                }
              />

              <Field
                label="Scheduled Time"
                type="time"
                required
                value={vm.scheduleForm.time}
                onChange={(value) =>
                  vm.setScheduleForm((current) => ({
                    ...current,
                    time: value,
                  }))
                }
              />

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Assign To *
                </label>
                <select
                  required
                  value={vm.scheduleForm.assignedTo}
                  onChange={(event) =>
                    vm.setScheduleForm((current) => ({
                      ...current,
                      assignedTo: event.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
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
                  Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={vm.scheduleForm.notes}
                  onChange={(event) =>
                    vm.setScheduleForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Enter instructions for the team"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => vm.setScheduleBooking(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Booking details modal */}
      {vm.selectedBooking && (
        <Modal
          title="Booking Details"
          onClose={() => vm.setSelectedBooking(null)}
        >
          <BookingDetails
            booking={vm.selectedBooking}
            service={vm.getService(vm.selectedBooking.serviceId)}
          />
        </Modal>
      )}
    </div>
  );
}

/* Reusable components */

function SummaryCard({
  title,
  value,
  icon,
  accent,
  iconStyle,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  iconStyle: string;
}) {
  return (
    <article className={`rounded-xl border border-slate-200 border-l-4 ${accent} bg-white p-4 shadow-sm sm:p-5`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconStyle}`}>
          {icon}
        </div>
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">{value}</p>
    </article>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
        statusStyles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function BookingActions({
  booking,
  onView,
  onApprove,
  onReject,
  onSchedule,
}: {
  booking: Booking;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSchedule: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        title="View booking"
        onClick={onView}
        className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
      >
        <Eye size={15} />
      </button>

      {booking.status === "Pending" && (
        <>
          <button
            type="button"
            title="Approve request"
            onClick={onApprove}
            className="rounded-md p-2 text-emerald-700 hover:bg-emerald-50"
          >
            <Check size={15} />
          </button>
          <button
            type="button"
            title="Reject request"
            onClick={onReject}
            className="rounded-md p-2 text-red-600 hover:bg-red-50"
          >
            <X size={15} />
          </button>
        </>
      )}

      {!["Rejected", "Completed", "In Progress"].includes(booking.status) && (
        <button
          type="button"
          title="Schedule and assign service"
          onClick={onSchedule}
          className="rounded-md p-2 text-violet-700 hover:bg-violet-50"
        >
          <CalendarDays size={15} />
        </button>
      )}
    </div>
  );
}

function BookingCard({
  booking,
  service,
  onView,
  onApprove,
  onReject,
  onSchedule,
}: {
  booking: Booking;
  service: Service | undefined;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onSchedule: () => void;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
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
        <StatusBadge status={booking.status} />
      </div>

      <div className="my-4 border-t border-slate-100" />

      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
        <Detail label="Service" value={service?.name ?? "Service unavailable"} />
        <Detail label="Category" value={service?.category ?? "—"} />
        <Detail label="Location" value={booking.location || "—"} />
        <Detail label="Requested Date" value={booking.requestedDate || "—"} />
        <Detail label="Assigned To" value={booking.assignedTo || "Unassigned"} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onView}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Eye size={14} /> View
        </button>

        {booking.status === "Pending" && (
          <>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
            >
              <Check size={14} /> Approve
            </button>
            <button
              type="button"
              onClick={onReject}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
            >
              <X size={14} /> Reject
            </button>
          </>
        )}

        {!["Rejected", "Completed", "In Progress"].includes(booking.status) && (
          <button
            type="button"
            onClick={onSchedule}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100"
          >
            <CalendarDays size={14} /> Schedule
          </button>
        )}
      </div>
    </article>
  );
}

function ServiceCard({
  service,
  onEdit,
  onDelete,
}: {
  service: Service;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200">
      <div className="h-1 bg-gradient-to-r from-emerald-900 to-lime-400" />
      <div className="p-4">
        {service.image && (
          <img
            src={service.image}
            alt={service.name}
            className="mb-4 h-36 w-full rounded-lg object-cover"
          />
        )}

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

        <h3 className="mt-4 break-words font-bold text-slate-900">
          {service.name}
        </h3>
        <p className="mt-1 text-xs text-slate-500">{service.category}</p>
        <p className="mt-3 min-h-10 break-words text-xs leading-5 text-slate-600">
          {service.description || "No description provided."}
        </p>

        {service.requiresMaintenance && (
          <p className="mt-3 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
            Maintenance: {service.defaultMaintenanceFrequency || "Frequency not set"}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <div>
            <p className="text-[10px] text-slate-400">Starting price</p>
            <p className="font-bold text-slate-900">
              ₹{Number(service.price ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400">Duration</p>
            <p className="text-xs font-medium text-slate-700">
              {service.duration ? `${service.duration} min` : "—"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          <Edit size={14} /> Edit Service
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="mt-2 w-full rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          Delete Service
        </button>
      </div>
    </article>
  );
}

function BookingDetails({
  booking,
  service,
}: {
  booking: Booking;
  service: Service | undefined;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-slate-900">{booking.customer}</h3>
          <p className="mt-1 text-xs text-slate-500">{booking.reference}</p>
        </div>
        <StatusBadge status={booking.status} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Detail label="Company" value={booking.company || "—"} />
        <Detail label="Service" value={service?.name ?? "Service unavailable"} />
        <Detail label="Location" value={booking.location || "—"} />
        <Detail label="Requested Date" value={booking.requestedDate || "—"} />
        <Detail label="Scheduled Date" value={booking.scheduledDate || "—"} />
        <Detail label="Scheduled Time" value={booking.scheduledTime || "—"} />
        <Detail label="Assigned To" value={booking.assignedTo || "Unassigned"} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500">Notes</p>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-slate-800">
          {booking.notes || "No notes provided."}
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-words text-xs text-slate-700">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}{required ? " *" : ""}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-8 text-center">
      <ClipboardList size={28} className="mx-auto text-slate-300" />
      <p className="mt-3 text-sm font-semibold text-slate-700">{message}</p>
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X size={18} />
          </button>
        </header>
        <div className="p-4 sm:p-6">{children}</div>
      </section>
    </div>
  );
}
