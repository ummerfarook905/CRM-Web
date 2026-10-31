
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  Plus,
  Search,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAssignableEmployees } from "../../viewmodels/shared/UseAssignableEmployees";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchWorkOrders, type MonitoredWorkOrder } from "../../services/WorkMonitoringSlice";
import { api } from "../../api/axios";

type Priority = "Low" | "Medium" | "High" | "Urgent";

type WorkStatus =
  | "Incoming"
  | "Assigned"
  | "Scheduled"
  | "In Progress"
  | "Completed";

interface WorkOrder {
  id: string;
  reference: string;
  customer: string;
  company: string;
  service: string;
  category: string;
  location: string;
  requestedDate: string;
  workDate: string;
  workTime: string;
  priority: Priority;
  status: WorkStatus;
  employees: string[];
  employeeIds: string[];
  instructions: string;
  duration: string;
}

const mapWorkOrder = (item: MonitoredWorkOrder): WorkOrder => {
  const status = item.status.toUpperCase().replaceAll("_", " ");
  const workStatus: WorkStatus = status === "COMPLETED" ? "Completed" : status === "IN PROGRESS" ? "In Progress" : item.scheduledDate ? "Scheduled" : item.assignments.length ? "Assigned" : "Incoming";
  const priority = item.priority.toUpperCase();
  return {
    id: item.id, reference: item.reference, customer: item.customer, company: item.company,
    service: item.service, category: "", location: item.location,
    requestedDate: item.createdAt.slice(0, 10), workDate: item.scheduledDate.slice(0, 10),
    workTime: item.scheduledStartTime || "09:00",
    priority: priority === "URGENT" ? "Urgent" : priority === "HIGH" ? "High" : priority === "LOW" ? "Low" : "Medium",
    status: workStatus,
    employees: item.assignments.map((assignment) => assignment.employeeName),
    employeeIds: item.assignments.map((assignment) => assignment.employeeId),
    instructions: item.instructions, duration: "—",
  };
};

const priorityStyles: Record<Priority, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-amber-50 text-amber-700",
  Urgent: "bg-red-50 text-red-700",
};

const statusStyles: Record<WorkStatus, string> = {
  Incoming: "bg-orange-50 text-orange-700",
  Assigned: "bg-blue-50 text-blue-700",
  Scheduled: "bg-violet-50 text-violet-700",
  "In Progress": "bg-cyan-50 text-cyan-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

export default function WorkAssignment() {
  const dispatch = useAppDispatch();
  const { items: apiWorkOrders, loading: workLoading, error: workError } = useAppSelector((state) => state.workMonitoring);
  const { employees: assignableEmployees, loading: employeeLoading, error: employeeError } = useAssignableEmployees();
  const workOrders = useMemo(() => apiWorkOrders.map(mapWorkOrder), [apiWorkOrders]);
  useEffect(() => { void dispatch(fetchWorkOrders({ page: 1, limit: 100 })); }, [dispatch]);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");

  const [selectedWork, setSelectedWork] =
    useState<WorkOrder | null>(null);

  const [detailsWork, setDetailsWork] =
    useState<WorkOrder | null>(null);

  const [notice, setNotice] = useState("");

  const [form, setForm] = useState({
    employees: [] as string[],
    workDate: "",
    workTime: "09:00",
    priority: "Medium" as Priority,
    instructions: "",
  });

  const filteredWork = useMemo(() => {
    const query = search.toLowerCase().trim();

    return workOrders.filter((work) => {
      const matchesSearch =
        !query ||
        [
          work.reference,
          work.customer,
          work.company,
          work.service,
          work.location,
          ...work.employees,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" || work.status === statusFilter;

      const matchesPriority =
        priorityFilter === "All" ||
        work.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [workOrders, search, statusFilter, priorityFilter]);

  const openAssignment = (work: WorkOrder) => {
    setSelectedWork(work);

    setForm({
      employees: [...work.employeeIds],
      workDate: work.workDate,
      workTime: work.workTime || "09:00",
      priority: work.priority,
      instructions: work.instructions,
    });
  };

  const saveAssignment = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!selectedWork) return;

    if (form.employees.length === 0) {
      setNotice("Please assign at least one employee.");
      return;
    }

    if (!form.workDate) {
      setNotice("Please select a work date.");
      return;
    }

    try {
      const order = apiWorkOrders.find((item) => item.id === selectedWork.id);
      if (!order) throw new Error("Work order is no longer available. Refresh and try again.");
      const [hours, minutes] = form.workTime.split(":").map(Number);
      const end = new Date(2000, 0, 1, hours, minutes + 60);
      await api.patch(`/work-orders/${encodeURIComponent(selectedWork.id)}/schedule`, {
        scheduledDate: form.workDate,
        scheduledStartTime: form.workTime,
        scheduledEndTime: `${String(end.getHours()).padStart(2, "0")}:${String(end.getMinutes()).padStart(2, "0")}`,
      });
      const newEmployeeIds = form.employees.filter((id) => !order.assignments.some((assignment) => assignment.employeeId === id));
      if (newEmployeeIds.length) await api.post("/work-assignments", { workOrderId: selectedWork.id, employeeIds: newEmployeeIds });
      await dispatch(fetchWorkOrders({ page: 1, limit: 100 })).unwrap();
      setSelectedWork(null);
      setNotice(`${selectedWork.reference} schedule and technician assignments saved.`);
    } catch (error) {
      void dispatch(fetchWorkOrders({ page: 1, limit: 100 }));
      const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
      setNotice(typeof error === "string" ? error : Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : error instanceof Error ? error.message : "Failed to save work assignment.");
    }
  };

  const toggleEmployee = (employee: string) => {
    setForm((current) => ({
      ...current,
      employees: current.employees.includes(employee)
        ? current.employees.filter(
            (name) => name !== employee
          )
        : [...current.employees, employee],
    }));
  };


  const summary = [
    {
      title: "Incoming Work",
      value: workOrders.filter(
        (work) => work.status === "Incoming"
      ).length,
      icon: ClipboardList,
      color: "border-t-amber-500",
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      title: "Assigned",
      value: workOrders.filter(
        (work) => work.status === "Assigned"
      ).length,
      icon: Users,
      color: "border-t-blue-500",
      iconStyle: "bg-blue-50 text-blue-700",
    },
    {
      title: "Scheduled",
      value: workOrders.filter(
        (work) => work.status === "Scheduled"
      ).length,
      icon: CalendarDays,
      color: "border-t-violet-500",
      iconStyle: "bg-violet-50 text-violet-700",
    },
    {
      title: "Urgent Priority",
      value: workOrders.filter(
        (work) =>
          work.priority === "Urgent" &&
          work.status !== "Completed"
      ).length,
      icon: AlertCircle,
      color: "border-t-red-500",
      iconStyle: "bg-red-50 text-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Operations / Workforce
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Work Assignment
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Review incoming jobs, assign employees and schedule field work.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600">
          <Users size={16} className="text-emerald-700" />
          {assignableEmployees.length} Available Team Members
        </div>
      </div>

      {/* Feedback */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}
      {workError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{workError}</p>}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`rounded-xl border border-slate-100 ${item.color} border-t-4 bg-white p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconStyle}`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-500">
                Current work orders
              </p>
            </div>
          );
        })}
      </div>

      {/* Work orders */}
<section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
  {/* HEADER AND FILTERS */}
  <div className="flex min-w-0 flex-col gap-4 border-b border-slate-100 p-4 sm:p-5">
    <div>
      <h2 className="text-base font-bold text-slate-900">
        Incoming Work & Assignments
      </h2>
      <p className="mt-1 text-xs leading-5 text-slate-500">
        View service details, set priorities and assign one or more employees.
      </p>
    </div>

    {/* RESPONSIVE FILTERS */}
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <div className="relative min-w-0">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search work orders..."
          aria-label="Search work orders"
          className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600"
        />
      </div>

      <select
        value={statusFilter}
        onChange={(event) => setStatusFilter(event.target.value)}
        aria-label="Filter by status"
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
      >
        <option value="All">All statuses</option>
        <option value="Incoming">Incoming</option>
        <option value="Assigned">Assigned</option>
        <option value="Scheduled">Scheduled</option>
        <option value="In Progress">In Progress</option>
        <option value="Completed">Completed</option>
      </select>

      <select
        value={priorityFilter}
        onChange={(event) => setPriorityFilter(event.target.value)}
        aria-label="Filter by priority"
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
      >
        <option value="All">All priorities</option>
        <option value="Urgent">Urgent</option>
        <option value="High">High</option>
        <option value="Medium">Medium</option>
        <option value="Low">Low</option>
      </select>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setStatusFilter("All");
          setPriorityFilter("All");
        }}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
      >
        Clear Filters
      </button>
    </div>
  </div>

  {/* MOBILE AND TABLET CARDS */}
  <div className="divide-y divide-slate-100 lg:hidden">
    {workLoading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Loading work orders…</p> : filteredWork.map((work) => (
      <article
        key={work.id}
        className="min-w-0 space-y-4 p-4 transition hover:bg-slate-50/70 sm:p-5"
      >
        {/* WORK ORDER HEADER */}
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-sm font-bold text-slate-900">
              {work.reference}
            </p>
            <p className="mt-1 break-words text-[10px] text-slate-500">
              Requested {work.requestedDate}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[work.priority]}`}
          >
            {work.priority}
          </span>
        </div>

        {/* CUSTOMER DETAILS */}
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-800">
            {work.customer}
          </p>
          <p className="mt-1 break-words text-xs text-slate-600">
            {work.service}
          </p>
          <p className="mt-1 break-words text-[11px] text-slate-400">
            {work.company}
          </p>
        </div>

        {/* WORK DETAILS */}
        <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-4 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Location
            </p>
            <p className="mt-1 flex min-w-0 items-start gap-1.5 break-words text-xs leading-5 text-slate-600">
              <MapPin size={13} className="mt-0.5 shrink-0" />
              {work.location}
            </p>
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Work Date
            </p>
            <p className="mt-1 break-words text-xs leading-5 text-slate-700">
              {work.workDate || "Not scheduled"}
            </p>
            {work.workDate && (
              <p className="mt-1 break-words text-[10px] text-slate-500">
                {work.workTime}
              </p>
            )}
          </div>

          <div className="col-span-2 min-w-0 sm:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Status
            </p>
            <div className="mt-1">
              <span
                className={`inline-flex max-w-full whitespace-normal break-words rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[work.status]}`}
              >
                {work.status}
              </span>
            </div>
          </div>
        </div>

        {/* ASSIGNED EMPLOYEES */}
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Assigned Employees
          </p>

          {work.employees.length ? (
            <div className="flex min-w-0 flex-wrap gap-2">
              {work.employees.map((employee) => (
                <span
                  key={employee}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600"
                >
                  <UserRound
                    size={12}
                    className="shrink-0 text-emerald-700"
                  />
                  <span className="break-words">{employee}</span>
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-400">
              Unassigned
            </span>
          )}
        </div>

        {/* ACTIONS */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            title="View service details"
            aria-label={`View details for ${work.reference}`}
            onClick={() => setDetailsWork(work)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
          >
            <ClipboardList size={15} />
            View Details
          </button>

          {work.status !== "Completed" && (
            <button
              type="button"
              title={work.employeeIds.length ? "Edit technician assignment" : "Assign and schedule work"}
              onClick={() => openAssignment(work)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-900"
            >
              <Plus size={14} />
              {work.employeeIds.length ? "Edit" : "Assign"}
            </button>
          )}
        </div>
      </article>
    ))}

    {/* MOBILE EMPTY STATE */}
    {filteredWork.length === 0 && (
      <div className="px-4 py-12 text-center">
        <ClipboardList
          size={30}
          className="mx-auto text-slate-300"
        />
        <p className="mt-3 text-sm font-semibold text-slate-700">
          No work orders found
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Try another search or filter.
        </p>
      </div>
    )}
  </div>

  {/* DESKTOP TABLE */}
  <div className="hidden w-full overflow-x-auto lg:block">
    <table className="w-full border-collapse text-left">
      <thead className="bg-slate-50">
        <tr>
          {[
            "Work Order",
            "Customer / Service",
            "Location",
            "Work Date",
            "Priority",
            "Status",
            "Assigned Employees",
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
              {workLoading ? <tr><td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">Loading work orders…</td></tr> : filteredWork.map((work) => (
          <tr
            key={work.id}
            className="border-t border-slate-100 hover:bg-slate-50"
          >
            <td className="whitespace-nowrap px-3 py-4 xl:px-4">
              <p className="text-xs font-bold text-slate-900">
                {work.reference}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                Requested {work.requestedDate}
              </p>
            </td>

            <td className="max-w-56 px-3 py-4 xl:px-4">
              <p className="break-words text-xs font-semibold text-slate-800">
                {work.customer}
              </p>
              <p className="mt-1 break-words text-[11px] text-slate-500">
                {work.service}
              </p>
              <p className="mt-1 break-words text-[10px] text-slate-400">
                {work.company}
              </p>
            </td>

            <td className="max-w-40 px-3 py-4 xl:px-4">
              <span className="flex items-start gap-1 break-words text-xs text-slate-600">
                <MapPin size={13} className="mt-0.5 shrink-0" />
                {work.location}
              </span>
            </td>

            <td className="whitespace-nowrap px-3 py-4 xl:px-4">
              <p className="text-xs font-medium text-slate-700">
                {work.workDate || "Not scheduled"}
              </p>
              {work.workDate && (
                <p className="mt-1 text-[10px] text-slate-500">
                  {work.workTime}
                </p>
              )}
            </td>

            <td className="whitespace-nowrap px-3 py-4 xl:px-4">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[work.priority]}`}
              >
                {work.priority}
              </span>
            </td>

            <td className="whitespace-nowrap px-3 py-4 xl:px-4">
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[work.status]}`}
              >
                {work.status}
              </span>
            </td>

            <td className="max-w-40 px-3 py-4 xl:px-4">
              {work.employees.length ? (
                <div className="space-y-1">
                  {work.employees.map((employee) => (
                    <p
                      key={employee}
                      className="flex items-start gap-1 break-words text-[11px] text-slate-600"
                    >
                      <UserRound
                        size={12}
                        className="mt-0.5 shrink-0 text-emerald-700"
                      />
                      {employee}
                    </p>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400">
                  Unassigned
                </span>
              )}
            </td>

            <td className="whitespace-nowrap px-3 py-4 xl:px-4">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="View service details"
                  aria-label={`View details for ${work.reference}`}
                  onClick={() => setDetailsWork(work)}
                  className="rounded-md p-2 text-slate-500 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ClipboardList size={15} />
                </button>

                {work.status !== "Completed" && (
                  <button
                    type="button"
                    title={work.employeeIds.length ? "Edit technician assignment" : "Assign and schedule work"}
                    onClick={() => openAssignment(work)}
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-800 px-2.5 py-2 text-[10px] font-semibold text-white hover:bg-emerald-900"
                  >
                    <Plus size={13} />
                    {work.employeeIds.length ? "Edit" : "Assign"}
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}

        {filteredWork.length === 0 && (
          <tr>
            <td colSpan={8} className="px-4 py-14 text-center">
              <ClipboardList
                size={30}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No work orders found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Try another search or filter.
              </p>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

  {/* FOOTER */}
  <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 sm:px-5">
    Showing {filteredWork.length} of {workOrders.length} work orders
  </div>
</section>


      {/* Assignment modal */}
      {selectedWork && (
        <Modal
          title="Assign & Schedule Work"
          onClose={() => setSelectedWork(null)}
        >
          <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  {selectedWork.reference}
                </p>
                <h3 className="mt-1 font-bold text-slate-900">
                  {selectedWork.service}
                </h3>
                <p className="mt-1 text-xs text-slate-600">
                  {selectedWork.customer} · {selectedWork.company}
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${priorityStyles[form.priority]}`}
              >
                {form.priority} Priority
              </span>
            </div>

            <p className="mt-3 flex items-center gap-1 text-xs text-slate-600">
              <MapPin size={13} />
              {selectedWork.location}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
              <Clock size={13} />
              Estimated duration: {selectedWork.duration}
            </p>
          </div>

          <form onSubmit={saveAssignment} className="space-y-5">
            {/* Multiple employees */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <label className="text-xs font-bold text-slate-800">
                  Assign Employees
                </label>
                <span className="text-[10px] text-slate-500">
                  Select one or more
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {assignableEmployees.map((employee) => {
                  const checked = form.employees.includes(employee.id);

                  return (
                    <label
                      key={employee.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                        checked
                          ? "border-emerald-700 bg-emerald-50"
                          : "border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={Boolean(selectedWork.employeeIds.includes(employee.id))}
                        onChange={() => toggleEmployee(employee.id)}
                        className="h-4 w-4 accent-emerald-800 disabled:opacity-60"
                      />
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {employee.name
                          .split(" ")
                          .map((part) => part[0])
                          .join("")}
                      </span>
                      <span className="text-xs font-medium text-slate-700">
                        {employee.name} · {employee.designation || employee.role}
                      </span>
                    </label>
                  );
                })}
                {employeeLoading && <p className="text-xs text-slate-500">Loading staff…</p>}
                {!employeeLoading && assignableEmployees.length === 0 && (
                  <p className="text-xs text-amber-700">
                    {employeeError || "No active staff found in the employee database."}
                  </p>
                )}
              </div>

              <p className="mt-2 text-[11px] text-slate-500">
                {form.employees.length} employee(s) selected
              </p>
            </div>

            {/* Date and time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Work Date
                </label>
                <input
                  type="date"
                  required
                  value={form.workDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      workDate: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={form.workTime}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      workTime: event.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedWork(null)}
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
              >
                <CheckCircle2 size={16} />
                Save Assignment
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Service details modal */}
      {detailsWork && (
        <Modal
          title={`Work Order — ${detailsWork.reference}`}
          onClose={() => setDetailsWork(null)}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {detailsWork.service}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {detailsWork.customer} · {detailsWork.company}
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[detailsWork.status]}`}
              >
                {detailsWork.status}
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Detail
                label="Category"
                value={detailsWork.category}
              />
              <Detail
                label="Location"
                value={detailsWork.location}
              />
              <Detail
                label="Requested Date"
                value={detailsWork.requestedDate}
              />
              <Detail
                label="Work Date"
                value={detailsWork.workDate || "Not scheduled"}
              />
              <Detail
                label="Start Time"
                value={detailsWork.workTime}
              />
              <Detail
                label="Duration"
                value={detailsWork.duration}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Priority
              </p>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${priorityStyles[detailsWork.priority]}`}
              >
                {detailsWork.priority}
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                Assigned Employees
              </p>
              {detailsWork.employees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {detailsWork.employees.map((employee) => (
                    <span
                      key={employee}
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700"
                    >
                      <UserRound size={14} />
                      {employee}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">
                  No employees assigned yet.
                </p>
              )}
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Work Instructions
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {detailsWork.instructions || "No instructions added."}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
              {detailsWork.status !== "Completed" && (
                <button
                  onClick={() => {
                    const work = detailsWork;
                    setDetailsWork(null);
                    openAssignment(work);
                  }}
                  className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                >
                  {detailsWork.employeeIds.length > 0 ? "Edit Assignment" : "Assign Work"}
                </button>
              )}

            </div>
          </div>
        </Modal>
      )}
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
            aria-label="Close modal"
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
