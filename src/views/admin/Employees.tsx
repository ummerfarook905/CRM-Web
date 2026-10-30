import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  BriefcaseBusiness,
  ChevronDown,
} from "lucide-react";

import React from "react";
import type { EmployeeStatus } from "../../models/admin/Employee";
import { useEmployeesViewModel } from "../../viewmodels/admin/UseEmployeesViewModel";

function formatDate(date: string): string {
  if (!date) return "—";

  const parsedDate = new Date(`${date.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) return "—";

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toUpperCase();
}

export default function Employees() {
  const vm = useEmployeesViewModel();

  const {
    employees,
    loading,
    error,
    deleteMessage,
    activeCount,
    inactiveCount,
    departments,
    designations,
    filteredEmployees,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    modalMode,
    selectedEmployee,
    form,
    formError,
    updateForm,
    openAddModal,
    openViewModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    clearFilters,
  } = vm;

  React.useEffect(() => {
    if (!modalMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [modalMode]);

  return (
    <div className="min-w-0 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Workforce Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Employees
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage employee profiles, departments and employment status.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {/* LOADING AND API ERROR */}
      {loading && (
        <p className="text-sm text-slate-500" role="status">
          Loading employees...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}

      {deleteMessage && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          {deleteMessage}
        </div>
      )}

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          title="Total Employees"
          value={employees.length}
          description="All registered employees"
          icon={Users}
          iconColor="text-blue-700"
          iconBg="bg-blue-50"
          accent="border-t-blue-500"
        />

        <SummaryCard
          title="Active Employees"
          value={activeCount}
          description="Currently active employees"
          icon={UserCheck}
          iconColor="text-emerald-700"
          iconBg="bg-emerald-50"
          accent="border-t-emerald-500"
        />

        <SummaryCard
          title="Inactive Employees"
          value={inactiveCount}
          description="Currently inactive employees"
          icon={UserX}
          iconColor="text-rose-700"
          iconBg="bg-rose-50"
          accent="border-t-rose-500"
        />
      </div>

      {/* EMPLOYEE DIRECTORY */}
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* SEARCH AND FILTERS */}
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200 p-3 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Employee Directory
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {filteredEmployees.length} employee
              {filteredEmployees.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-2xl lg:grid-cols-3">
            <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                aria-label="Search employees"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="relative min-w-0">
              <select
                value={departmentFilter}
                onChange={(event) =>
                  setDepartmentFilter(event.target.value)
                }
                aria-label="Filter by department"
                className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="All">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative min-w-0">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by employee status"
                className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* MOBILE AND TABLET EMPLOYEE CARDS */}
        <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
          {filteredEmployees.map((employee) => (
            <div
              key={employee.id}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-emerald-200 hover:bg-slate-50/50 sm:p-4"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                  {getInitials(employee.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {employee.name}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {employee.id}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {employee.email}
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={employee.status} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-3 min-[360px]:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Department
                  </p>

                  <span className="mt-1 inline-flex max-w-full rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    <span className="break-words">
                      {employee.department}
                    </span>
                  </span>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Designation
                  </p>

                  <p className="mt-1 break-words text-sm text-slate-600">
                    {employee.designation || "—"}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Joining Date
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(employee.joiningDate)}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </p>

                  <div className="mt-1">
                    <StatusBadge status={employee.status} />
                  </div>
                </div>
              </div>

              {/* CARD ACTIONS */}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                <ActionButton
                  label="View employee"
                  onClick={() => openViewModal(employee)}
                  icon={Eye}
                />

                <ActionButton
                  label="Edit employee"
                  onClick={() => openEditModal(employee)}
                  icon={Pencil}
                />

                <ActionButton
                  label="Delete employee"
                  onClick={() => void handleDelete(employee)}
                  icon={Trash2}
                  danger
                />
              </div>
            </div>
          ))}

          {filteredEmployees.length === 0 && (
            <EmptyState
              onClear={clearFilters}
              className="col-span-full px-3 py-12 text-center"
            />
          )}
        </div>

        {/* DESKTOP EMPLOYEE TABLE */}
        <div className="hidden min-w-0 w-full lg:block">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 xl:px-5">
                    Employee
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 xl:px-5">
                    Designation
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 xl:px-5">
                    Joining Date
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 xl:px-5">
                    Status
                  </th>

                  <th className="whitespace-nowrap px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500 xl:px-5">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4 xl:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                          {getInitials(employee.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-800">
                            {employee.name}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {employee.id}
                          </p>

                          <p className="mt-1 break-all text-xs text-slate-500">
                            {employee.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-600">
                      {employee.designation || "—"}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 xl:px-5">
                      {formatDate(employee.joiningDate)}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={employee.status} />
                    </td>

                    <td className="px-4 py-4 xl:px-5">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton
                          label="View employee"
                          onClick={() => openViewModal(employee)}
                          icon={Eye}
                        />

                        <ActionButton
                          label="Edit employee"
                          onClick={() => openEditModal(employee)}
                          icon={Pencil}
                        />

                        <ActionButton
                          label="Delete employee"
                          onClick={() => void handleDelete(employee)}
                          icon={Trash2}
                          danger
                        />
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-16 text-center">
                      <EmptyState onClear={clearFilters} />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex min-w-0 flex-col gap-1 border-t border-slate-200 bg-slate-50/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-5">
          <p className="break-words text-xs text-slate-500">
            Showing {filteredEmployees.length} of {employees.length} employees
          </p>

          <p className="text-xs text-slate-400">
            Employee records management
          </p>
        </div>
      </div>

      {/* ADD / EDIT / VIEW MODAL */}
      {modalMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/10 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="employee-modal-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h2
                  id="employee-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  {modalMode === "add"
                    ? "Add New Employee"
                    : modalMode === "edit"
                      ? "Edit Employee"
                      : "Employee Details"}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {modalMode === "view"
                    ? "Review employee information."
                    : "Enter the employee information below."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* VIEW MODE */}
            {modalMode === "view" && selectedEmployee && (
              <div className="p-5 sm:p-6">
                <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-xl font-bold text-emerald-800">
                    {getInitials(selectedEmployee.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedEmployee.name}
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      {selectedEmployee.designation || "—"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Employee ID: {selectedEmployee.id}
                    </p>
                  </div>

                  <StatusBadge status={selectedEmployee.status} />
                </div>

                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <DetailItem
                    icon={Mail}
                    label="Email Address"
                    value={selectedEmployee.email}
                  />

                  <DetailItem
                    icon={Phone}
                    label="Phone Number"
                    value={selectedEmployee.phone}
                  />

                  <DetailItem
                    icon={Building2}
                    label="Department"
                    value={selectedEmployee.department}
                  />

                  <DetailItem
                    icon={BriefcaseBusiness}
                    label="Designation"
                    value={selectedEmployee.designation}
                  />

                  <DetailItem
                    icon={CalendarDays}
                    label="Joining Date"
                    value={formatDate(selectedEmployee.joiningDate)}
                  />
                </div>

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditModal(selectedEmployee)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                  >
                    <Pencil size={16} />
                    Edit Employee
                  </button>
                </div>
              </div>
            )}

            {/* ADD / EDIT FORM */}
            {(modalMode === "add" || modalMode === "edit") && (
              <form onSubmit={handleSubmit} className="p-5 sm:p-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="First Name" required>
                    <input
                      type="text"
                      required
                      value={form.firstName}
                      onChange={(event) =>
                        updateForm("firstName", event.target.value)
                      }
                      placeholder="Enter first name"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Last Name" required>
                    <input
                      type="text"
                      required
                      value={form.lastName}
                      onChange={(event) =>
                        updateForm("lastName", event.target.value)
                      }
                      placeholder="Enter last name"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Email Address" required>
                    <input
                      required
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        updateForm("email", event.target.value)
                      }
                      placeholder="employee@example.com"
                      className={inputClass}
                    />
                  </FormField>

                  {modalMode === "add" && (
                    <FormField label="Password" required>
                      <input
                        type="password"
                        required
                        minLength={8}
                        autoComplete="new-password"
                        value={form.password}
                        onChange={(event) =>
                          updateForm("password", event.target.value)
                        }
                        placeholder="Create employee password"
                        className={inputClass}
                      />
                    </FormField>
                  )}

                  <FormField label="Phone Number" required>
                    <input
                      required
                      type="tel"
                      pattern="[0-9+\-\s()]{7,20}"
                      value={form.phone}
                      onChange={(event) =>
                        updateForm("phone", event.target.value)
                      }
                      placeholder="Enter phone number"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Designation" required>
                    <select
                      required
                      disabled={loading || (designations.length === 0 && !form.designation)}
                      value={form.designation}
                      onChange={(event) =>
                        updateForm("designation", event.target.value)
                      }
                      className={inputClass}
                    >
                      <option value="">
                        {loading ? "Loading designations…" : "Select a designation"}
                      </option>
                      {form.designation && !designations.includes(form.designation) && (
                        <option value={form.designation}>{form.designation}</option>
                      )}
                      {designations.map((designation) => (
                        <option key={designation} value={designation}>
                          {designation}
                        </option>
                      ))}
                    </select>
                    {!loading && designations.length === 0 && !error && (
                      <p className="mt-1 text-xs text-amber-700">
                        No designations are available in the employee database yet.
                      </p>
                    )}
                  </FormField>

                  <FormField label="Joining Date" required>
                    <input
                      required
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      value={form.joiningDate}
                      onChange={(event) =>
                        updateForm("joiningDate", event.target.value)
                      }
                      className={inputClass}
                    />
                  </FormField>

                  {/* STATUS: EDIT ONLY */}
                  {modalMode === "edit" && (
                    <FormField label="Employee Status" required>
                      <select
                        value={form.isActive ? "true" : "false"}
                        onChange={(event) =>
                          updateForm(
                            "isActive",
                            event.target.value === "true",
                          )
                        }
                        className={inputClass}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    </FormField>
                  )}
                </div>

                {formError && (
                  <p
                    role="alert"
                    className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700"
                  >
                    {formError}
                  </p>
                )}

                <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {modalMode === "add" ? (
                      <UserPlus size={17} />
                    ) : (
                      <Pencil size={16} />
                    )}

                    {loading
                      ? "Saving..."
                      : modalMode === "add"
                        ? "Add Employee"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: typeof Users;
  iconColor: string;
  iconBg: string;
  accent: string;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconColor,
  iconBg,
  accent,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 border-t-4 ${accent} bg-white p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: EmployeeStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const active = status === "Active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-slate-400"
        }`}
      />
      {status}
    </span>
  );
}

interface ActionButtonProps {
  label: string;
  onClick: () => void;
  icon: typeof Eye;
  danger?: boolean;
}

function ActionButton({
  label,
  onClick,
  icon: Icon,
  danger = false,
}: ActionButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`rounded-lg p-2 transition ${
        danger
          ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"
          : "text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
      }`}
    >
      <Icon size={16} />
    </button>
  );
}

interface FormFieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ label, required, children }: FormFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </span>

      {children}
    </label>
  );
}

interface DetailItemProps {
  icon: typeof Mail;
  label: string;
  value: string;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  onClear: () => void;
  className?: string;
}

function EmptyState({ onClear, className = "" }: EmptyStateProps) {
  return (
    <div className={className}>
      <Users size={32} className="mx-auto text-slate-300" />

      <p className="mt-3 text-sm font-semibold text-slate-700">
        No employees found
      </p>

      <p className="mt-1 text-xs text-slate-500">
        Try another search or change your filters.
      </p>

      <button
        type="button"
        onClick={onClear}
        className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
      >
        Clear filters
      </button>
    </div>
  );
}
