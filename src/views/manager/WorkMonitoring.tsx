
import {
  Activity,
  CheckCircle2,
  Clock,
  Eye,
  FileImage,
  ImagePlus,
  MapPin,
  MessageSquare,
  Search,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type WorkStatus =
  | "Assigned"
  | "Pending"
  | "In Progress"
  | "Completed";

type EmployeeStatus =
  | "Working"
  | "Available"
  | "On Break"
  | "Offline";

interface MonitoredWork {
  id: number;
  reference: string;
  customer: string;
  company: string;
  service: string;
  location: string;
  employee: string[];
  employeeStatus: EmployeeStatus;
  status: WorkStatus;
  priority: "Low" | "Medium" | "High" | "Urgent";
  assignedDate: string;
  dueDate: string;
  progress: number;
  completionRemarks: string;
  photos: string[];
}

const initialWorks: MonitoredWork[] = [
  {
    id: 1,
    reference: "WO-2026-101",
    customer: "Rajesh Kumar",
    company: "ABC Industries",
    service: "RO System Maintenance",
    location: "Thrissur, Kerala",
    employee: ["John Mathew", "Meera Joseph"],
    employeeStatus: "Working",
    status: "In Progress",
    priority: "High",
    assignedDate: "2026-10-08",
    dueDate: "2026-10-09",
    progress: 65,
    completionRemarks: "",
    photos: [],
  },
  {
    id: 2,
    reference: "WO-2026-102",
    customer: "Anil Thomas",
    company: "GreenTech Pvt Ltd",
    service: "Water Plant Inspection",
    location: "Kochi, Kerala",
    employee: ["Arun Mathew"],
    employeeStatus: "Available",
    status: "Assigned",
    priority: "Medium",
    assignedDate: "2026-10-09",
    dueDate: "2026-10-12",
    progress: 0,
    completionRemarks: "",
    photos: [],
  },
  {
    id: 3,
    reference: "WO-2026-103",
    customer: "Priya Menon",
    company: "Sunrise Apartments",
    service: "Filter Replacement",
    location: "Kozhikode, Kerala",
    employee: ["Rahul Nair"],
    employeeStatus: "Offline",
    status: "Pending",
    priority: "Urgent",
    assignedDate: "2026-10-08",
    dueDate: "2026-10-09",
    progress: 0,
    completionRemarks: "",
    photos: [],
  },
  {
    id: 4,
    reference: "WO-2026-104",
    customer: "Suresh Nair",
    company: "Sri Hospitals",
    service: "Annual Maintenance",
    location: "Palakkad, Kerala",
    employee: ["Fathima Ali", "Sanjay Kumar"],
    employeeStatus: "Available",
    status: "Completed",
    priority: "High",
    assignedDate: "2026-10-06",
    dueDate: "2026-10-08",
    progress: 100,
    completionRemarks:
      "Preventive maintenance completed. All equipment checked and operating normally.",
    photos: [],
  },
  {
    id: 5,
    reference: "WO-2026-105",
    customer: "Arun Joseph",
    company: "Global Foods",
    service: "Pump Repair",
    location: "Ernakulam, Kerala",
    employee: ["John Mathew"],
    employeeStatus: "Working",
    status: "In Progress",
    priority: "Medium",
    assignedDate: "2026-10-09",
    dueDate: "2026-10-10",
    progress: 40,
    completionRemarks: "",
    photos: [],
  },
  {
    id: 6,
    reference: "WO-2026-106",
    customer: "Thomas George",
    company: "Blue Water Solutions",
    service: "Water Quality Testing",
    location: "Thrissur, Kerala",
    employee: ["Meera Joseph"],
    employeeStatus: "On Break",
    status: "Assigned",
    priority: "Low",
    assignedDate: "2026-10-09",
    dueDate: "2026-10-13",
    progress: 0,
    completionRemarks: "",
    photos: [],
  },
];

const statusStyles: Record<WorkStatus, string> = {
  Assigned: "bg-blue-50 text-blue-700",
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-cyan-50 text-cyan-700",
  Completed: "bg-emerald-50 text-emerald-700",
};

const priorityStyles: Record<string, string> = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-blue-50 text-blue-700",
  High: "bg-orange-50 text-orange-700",
  Urgent: "bg-red-50 text-red-700",
};

const employeeStyles: Record<EmployeeStatus, string> = {
  Working: "bg-emerald-50 text-emerald-700",
  Available: "bg-blue-50 text-blue-700",
  "On Break": "bg-amber-50 text-amber-700",
  Offline: "bg-slate-100 text-slate-500",
};

export default function WorkMonitoring() {
  const [works, setWorks] =
    useState<MonitoredWork[]>(initialWorks);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [employeeFilter, setEmployeeFilter] = useState("All");
  const [selectedWork, setSelectedWork] =
    useState<MonitoredWork | null>(null);

  const [remarks, setRemarks] = useState("");
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState("");

  const summary = [
    {
      title: "Assigned Works",
      value: works.filter((w) => w.status === "Assigned").length,
      icon: Users,
      color: "border-t-blue-500",
      iconBg: "bg-blue-50 text-blue-700",
    },
    {
      title: "Pending Works",
      value: works.filter((w) => w.status === "Pending").length,
      icon: Clock,
      color: "border-t-amber-500",
      iconBg: "bg-amber-50 text-amber-700",
    },
    {
      title: "In Progress",
      value: works.filter((w) => w.status === "In Progress").length,
      icon: Activity,
      color: "border-t-cyan-500",
      iconBg: "bg-cyan-50 text-cyan-700",
    },
    {
      title: "Completed Works",
      value: works.filter((w) => w.status === "Completed").length,
      icon: CheckCircle2,
      color: "border-t-emerald-500",
      iconBg: "bg-emerald-50 text-emerald-700",
    },
  ];

  const filteredWorks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return works.filter((work) => {
      const matchesSearch =
        !query ||
        [
          work.reference,
          work.customer,
          work.company,
          work.service,
          work.location,
          ...work.employee,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" ||
        work.status === statusFilter;

      const matchesEmployee =
        employeeFilter === "All" ||
        work.employeeStatus === employeeFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesEmployee
      );
    });
  }, [works, search, statusFilter, employeeFilter]);

  const openDetails = (work: MonitoredWork) => {
    setSelectedWork(work);
    setRemarks(work.completionRemarks);
    setPhotoFiles([]);
  };

  const updateWork = (
    id: number,
    updates: Partial<MonitoredWork>
  ) => {
    setWorks((current) =>
      current.map((work) =>
        work.id === id ? { ...work, ...updates } : work
      )
    );
  };

  const saveMonitoringDetails = () => {
    if (!selectedWork) return;

    if (
      selectedWork.status === "Completed" &&
      !remarks.trim()
    ) {
      setNotice("Please enter completion remarks.");
      return;
    }

    const photoUrls = photoFiles.map((file) =>
      URL.createObjectURL(file)
    );

    updateWork(selectedWork.id, {
      completionRemarks: remarks.trim(),
      photos: [...selectedWork.photos, ...photoUrls],
    });

    setSelectedWork(null);
    setPhotoFiles([]);
    setNotice(
      `Monitoring details saved for ${selectedWork.reference}.`
    );
  };

  const markCompleted = () => {
    if (!selectedWork) return;

    if (!remarks.trim()) {
      setNotice("Add completion remarks before completing this work.");
      return;
    }

    if (
      selectedWork.photos.length === 0 &&
      photoFiles.length === 0
    ) {
      setNotice("Upload at least one completion photo.");
      return;
    }

    const photoUrls = photoFiles.map((file) =>
      URL.createObjectURL(file)
    );

    updateWork(selectedWork.id, {
      status: "Completed",
      progress: 100,
      completionRemarks: remarks.trim(),
      photos: [...selectedWork.photos, ...photoUrls],
      employeeStatus: "Available",
    });

    setSelectedWork(null);
    setPhotoFiles([]);
    setNotice(
      `${selectedWork.reference} marked as completed.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Operations / Monitoring
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Work Monitoring
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Track field operations, employee availability and job completion evidence.
        </p>
      </div>

      {/* Notification */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`rounded-xl border border-slate-100 ${item.color} border-t-4 bg-white p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}
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

      {/* Employee status overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="font-bold text-slate-900">
            Employee Work Status
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Availability of employees listed against their assigned jobs.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              "Working",
              "Available",
              "On Break",
              "Offline",
            ] as EmployeeStatus[]
          ).map((status) => {
            const uniqueEmployees = new Set(
              works
                .filter((work) => work.employeeStatus === status)
                .flatMap((work) => work.employee)
            );

            return (
              <button
                key={status}
                onClick={() =>
                  setEmployeeFilter((current) =>
                    current === status ? "All" : status
                  )
                }
                className={`rounded-lg border p-3 text-left transition ${
                  employeeFilter === status
                    ? "border-emerald-600 ring-1 ring-emerald-600"
                    : "border-slate-100 hover:border-slate-300"
                }`}
              >
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold ${employeeStyles[status]}`}
                >
                  {status}
                </span>
                <p className="mt-3 text-2xl font-bold text-slate-900">
                  {uniqueEmployees.size}
                </p>
                <p className="mt-1 text-[10px] text-slate-500">
                  Unique employees
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Monitoring table */}
      <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header and Filters */}
        <div className="min-w-0 border-b border-slate-100 p-3 sm:p-5">
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Work Status & Completion Tracking
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm">
            Inspect job progress, employee status, photos and completion remarks.
          </p>

          <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="relative min-w-0">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search work, customer, employee..."
                className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            >
              <option value="All">All work statuses</option>
              <option value="Assigned">Assigned</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                setEmployeeFilter("All");
              }}
              className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 sm:col-span-2 xl:col-span-1"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* MOBILE AND TABLET: Responsive Work Cards */}
        <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
          {filteredWorks.map((work) => (
            <article
              key={work.id}
              className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-4"
            >
              {/* Work Order Header */}
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold text-slate-900">
                    {work.reference}
                  </p>
                  <p className="mt-1 flex items-start gap-1 break-words text-xs text-slate-500">
                    <MapPin size={13} className="mt-0.5 shrink-0" />
                    <span className="min-w-0 break-words">{work.location}</span>
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[work.status]}`}
                >
                  {work.status}
                </span>
              </div>

              <div className="my-4 border-t border-slate-100" />

              {/* Customer and Service */}
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Customer / Service
                </p>
                <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                  {work.customer}
                </p>
                <p className="mt-1 break-words text-xs text-slate-600">
                  {work.service}
                </p>
                <p className="mt-1 break-words text-[11px] text-slate-400">
                  {work.company}
                </p>
              </div>

              {/* Employee Information */}
              <div className="mt-4 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Assigned Employees
                  </p>
                  <div className="mt-2 space-y-2">
                    {work.employee.map((name) => (
                      <p
                        key={name}
                        className="flex min-w-0 items-start gap-1.5 break-words text-xs text-slate-600"
                      >
                        <Users
                          size={13}
                          className="mt-0.5 shrink-0 text-emerald-700"
                        />
                        <span className="min-w-0 break-words">{name}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Employee Status
                  </p>
                  <div className="mt-2">
                    <span
                      className={`inline-block max-w-full break-words rounded-full px-2 py-1 text-[10px] font-semibold ${employeeStyles[work.employeeStatus]}`}
                    >
                      {work.employeeStatus}
                    </span>
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Due Date
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-700">
                    {work.dueDate}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[work.priority]}`}
                  >
                    {work.priority}
                  </span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Progress
                    </p>
                    <span className="text-xs font-bold text-slate-700">
                      {work.progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-600 transition-all"
                      style={{
                        width: `${work.progress}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Evidence */}
              <div className="mt-4 min-w-0 rounded-lg bg-slate-50 p-3">
                <p className="flex items-center gap-2 text-xs font-medium text-slate-700">
                  <FileImage size={15} className="shrink-0 text-emerald-700" />
                  {work.photos.length} photo(s)
                </p>
                <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                  {work.completionRemarks || "No remarks"}
                </p>
              </div>

              {/* Monitor Action */}
              <div className="mt-4 border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => openDetails(work)}
                  className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-600 hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <Eye size={15} />
                  Monitor Work
                </button>
              </div>
            </article>
          ))}

          {filteredWorks.length === 0 && (
            <div className="col-span-full rounded-xl border border-slate-200 px-4 py-12 text-center">
              <Search size={28} className="mx-auto text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No work orders found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Change your search or filters and try again.
              </p>
            </div>
          )}
        </div>

        {/* DESKTOP: Full Work Tracking Table */}
        <div className="hidden w-full min-w-0 overflow-x-auto lg:block">
          <table className="w-full table-auto text-left text-xs">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Work Order",
                  "Customer / Service",
                  "Assigned Employees",
                  "Employee Status",
                  "Due Date",
                  "Progress",
                  "Work Status",
                  "Evidence",
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
              {filteredWorks.map((work) => (
                <tr
                  key={work.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="max-w-[150px] break-words px-3 py-4 xl:px-4">
                    <p className="font-bold text-slate-900">{work.reference}</p>
                    <p className="mt-1 flex items-start gap-1 text-[10px] text-slate-500">
                      <MapPin size={11} className="mt-0.5 shrink-0" />
                      <span className="break-words">{work.location}</span>
                    </p>
                  </td>

                  <td className="max-w-[180px] break-words px-3 py-4 xl:px-4">
                    <p className="font-semibold text-slate-800">{work.customer}</p>
                    <p className="mt-1 break-words text-[11px] text-slate-500">
                      {work.service}
                    </p>
                    <p className="mt-1 break-words text-[10px] text-slate-400">
                      {work.company}
                    </p>
                  </td>

                  <td className="px-3 py-4 xl:px-4">
                    <div className="space-y-1">
                      {work.employee.map((name) => (
                        <p
                          key={name}
                          className="flex items-start gap-1 whitespace-nowrap text-[11px] text-slate-600"
                        >
                          <Users
                            size={12}
                            className="mt-0.5 shrink-0 text-emerald-700"
                          />
                          {name}
                        </p>
                      ))}
                    </div>
                  </td>

                  <td className="px-3 py-4 xl:px-4">
                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-semibold ${employeeStyles[work.employeeStatus]}`}
                    >
                      {work.employeeStatus}
                    </span>
                  </td>

                  <td className="px-3 py-4 xl:px-4">
                    <p className="whitespace-nowrap text-xs text-slate-700">
                      {work.dueDate}
                    </p>
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-1 text-[10px] font-semibold ${priorityStyles[work.priority]}`}
                    >
                      {work.priority}
                    </span>
                  </td>

                  <td className="px-3 py-4 xl:px-4">
                    <div className="w-24">
                      <div className="mb-1 flex justify-between text-[10px]">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-bold text-slate-700">
                          {work.progress}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-600 transition-all"
                          style={{ width: `${work.progress}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-4 xl:px-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${statusStyles[work.status]}`}
                    >
                      {work.status}
                    </span>
                  </td>

                  <td className="max-w-[170px] px-3 py-4 xl:px-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <FileImage
                        size={15}
                        className="shrink-0 text-emerald-700"
                      />
                      {work.photos.length} photo(s)
                    </div>
                    <p className="mt-1 break-words text-[10px] text-slate-400">
                      {work.completionRemarks || "No remarks"}
                    </p>
                  </td>

                  <td className="px-3 py-4 xl:px-4">
                    <button
                      type="button"
                      onClick={() => openDetails(work)}
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-800"
                    >
                      <Eye size={14} />
                      Monitor
                    </button>
                  </td>
                </tr>
              ))}

              {filteredWorks.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center">
                    <Search size={28} className="mx-auto text-slate-300" />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No work orders found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Change your search or filters and try again.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Record Count */}
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-3 text-xs text-slate-500 sm:px-5">
          <span>
            Showing {filteredWorks.length} of {works.length} work orders
          </span>
        </div>
      </section>


      {/* Work monitoring modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close monitoring dialog"
            onClick={() => setSelectedWork(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {selectedWork.reference}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Work Monitoring Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedWork(null)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Job details */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <h3 className="font-bold text-slate-900">
                  {selectedWork.service}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedWork.customer} · {selectedWork.company}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  <MapPin
                    size={13}
                    className="mr-1 inline"
                  />
                  {selectedWork.location}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[selectedWork.status]}`}
                  >
                    {selectedWork.status}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${priorityStyles[selectedWork.priority]}`}
                  >
                    {selectedWork.priority} Priority
                  </span>
                </div>
              </div>

              {/* Employee status */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-800">
                  Employee Work Status
                </label>
                <select
                  value={selectedWork.employeeStatus}
                  onChange={(event) => {
                    const employeeStatus =
                      event.target.value as EmployeeStatus;

                    updateWork(selectedWork.id, {
                      employeeStatus,
                    });
                    setSelectedWork({
                      ...selectedWork,
                      employeeStatus,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                >
                  <option value="Working">Working</option>
                  <option value="Available">Available</option>
                  <option value="On Break">On Break</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              {/* Progress */}
              {selectedWork.status !== "Completed" && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800">
                      Work Progress
                    </label>
                    <span className="text-xs font-bold text-emerald-700">
                      {selectedWork.progress}%
                    </span>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={selectedWork.progress}
                    onChange={(event) => {
                      const progress = Number(event.target.value);

                      updateWork(selectedWork.id, { progress });
                      setSelectedWork({
                        ...selectedWork,
                        progress,
                      });
                    }}
                    className="w-full accent-emerald-700"
                  />

                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Not started</span>
                    <span>Halfway</span>
                    <span>Complete</span>
                  </div>
                </div>
              )}

              {/* Completion photos */}
              <div>
                <label className="mb-2 block text-xs font-bold text-slate-800">
                  Work Completion Photos
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6 text-center transition hover:border-emerald-500 hover:bg-emerald-50/50">
                  <ImagePlus
                    size={26}
                    className="text-emerald-700"
                  />
                  <span className="mt-2 text-sm font-semibold text-slate-700">
                    Upload completion photos
                  </span>
                  <span className="mt-1 text-xs text-slate-400">
                    JPG, PNG or WEBP images
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(event) => {
                      const files = Array.from(
                        event.target.files ?? []
                      );

                      setPhotoFiles((current) => [
                        ...current,
                        ...files.filter((file) =>
                          file.type.startsWith("image/")
                        ),
                      ]);

                      event.target.value = "";
                    }}
                  />
                </label>

                {(selectedWork.photos.length > 0 ||
                  photoFiles.length > 0) && (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedWork.photos.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={src}
                          alt={`Completion evidence ${index + 1}`}
                          className="h-28 w-full object-cover"
                        />
                        <p className="truncate px-2 py-1.5 text-[10px] text-slate-500">
                          Saved photo {index + 1}
                        </p>
                      </div>
                    ))}

                    {photoFiles.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="overflow-hidden rounded-lg border border-slate-200"
                      >
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="h-28 w-full object-cover"
                        />
                        <div className="flex items-center justify-between gap-1 px-2 py-1.5">
                          <span className="truncate text-[10px] text-slate-500">
                            {file.name}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPhotoFiles((current) =>
                                current.filter(
                                  (_, i) => i !== index
                                )
                              )
                            }
                            aria-label={`Remove ${file.name}`}
                            className="shrink-0 text-red-600"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completion remarks */}
              <div>
                <label className="mb-2 flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MessageSquare
                    size={15}
                    className="text-emerald-700"
                  />
                  Completion Remarks
                </label>
                <textarea
                  rows={4}
                  value={remarks}
                  onChange={(event) =>
                    setRemarks(event.target.value)
                  }
                  placeholder="Enter work performed, parts replaced, test results and any follow-up requirements..."
                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
                />
              </div>

              {/* Existing completion information */}
              {selectedWork.status === "Completed" && (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                  <p className="text-xs font-bold text-emerald-800">
                    <CheckCircle2
                      size={14}
                      className="mr-1 inline"
                    />
                    Work completed
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    This work order is marked as completed. Saving updates the remarks and adds any new photos.
                  </p>
                </div>
              )}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setSelectedWork(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  onClick={saveMonitoringDetails}
                  className="rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  Save Details
                </button>

                {selectedWork.status !== "Completed" && (
                  <button
                    onClick={markCompleted}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    <CheckCircle2 size={15} />
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
