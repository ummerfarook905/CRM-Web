import {
  AlertCircle,
  ArrowRight,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  Search,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  Wrench,
  X,
} from "lucide-react";

import { useMemo, useState, type ElementType } from "react";
import { useNavigate } from "react-router-dom";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface StatCard {
  title: string;
  value: string;
  description: string;
  highlight: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  accent: string;
  highlightColor: string;
  path: string;
}

interface DashboardRecord {
  id: string;
  name: string;
  detail: string;
  status: string;
  date: string;
}

/* -------------------------------------------------------------------------- */
/* KPI cards                                                                   */
/* -------------------------------------------------------------------------- */

const stats: StatCard[] = [
  {
    title: "TOTAL CUSTOMERS",
    value: "1,482",
    description: "Active customer accounts",
    highlight: "+8.4% MoM",
    icon: Users,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
    accent: "border-t-emerald-900",
    highlightColor: "text-emerald-700",
    path: "/admin/Customers",
  },
  {
    title: "NEW ENQUIRIES",
    value: "126",
    description: "New enquiries this month",
    highlight: "+12.8%",
    icon: UserPlus,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    accent: "border-t-blue-600",
    highlightColor: "text-blue-700",
    path: "/admin/Enquiries",
  },
  {
    title: "SERVICE REQUESTS",
    value: "348",
    description: "Total open requests",
    highlight: "42 Today",
    icon: ClipboardList,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    accent: "border-t-violet-500",
    highlightColor: "text-violet-700",
    path: "/admin/Services",
  },
  {
    title: "PENDING SERVICES",
    value: "64",
    description: "Services awaiting action",
    highlight: "18 High Priority",
    icon: AlertCircle,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-700",
    accent: "border-t-amber-500",
    highlightColor: "text-amber-700",
    path: "/admin/Services?status=pending",
  },
  {
    title: "SCHEDULED SERVICES",
    value: "92",
    description: "Services scheduled",
    highlight: "24 Today",
    icon: CalendarClock,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-700",
    accent: "border-t-cyan-500",
    highlightColor: "text-cyan-700",
    path: "/admin/Services?status=scheduled",
  },
  {
    title: "IN-PROGRESS WORKS",
    value: "47",
    description: "Currently being handled",
    highlight: "12 Technicians",
    icon: Wrench,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-700",
    accent: "border-t-orange-500",
    highlightColor: "text-orange-700",
    path: "/admin/Services?status=in-progress",
  },
  {
    title: "COMPLETED WORKS",
    value: "1,284",
    description: "Successfully completed",
    highlight: "+14.2%",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    accent: "border-t-emerald-500",
    highlightColor: "text-emerald-700",
    path: "/admin/Services?status=completed",
  },
  {
    title: "UPCOMING CHECKUPS",
    value: "38",
    description: "Scheduled maintenance",
    highlight: "Next 7 Days",
    icon: CalendarCheck,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-700",
    accent: "border-t-sky-500",
    highlightColor: "text-sky-700",
    path: "/admin/Services?type=checkup",
  },
  {
    title: "EMPLOYEES",
    value: "86",
    description: "Total employees",
    highlight: "72 Active Today",
    icon: Users,
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-700",
    accent: "border-t-indigo-500",
    highlightColor: "text-indigo-700",
    path: "/admin/Employees",
  },
  {
    title: "ATTENDANCE SUMMARY",
    value: "94.8%",
    description: "Today's attendance",
    highlight: "82 Present",
    icon: TrendingUp,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    accent: "border-t-emerald-500",
    highlightColor: "text-emerald-700",
    path: "/admin/Attendance",
  },
  {
    title: "OVERTIME SUMMARY",
    value: "184h",
    description: "Overtime this month",
    highlight: "14 Employees",
    icon: Timer,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-700",
    accent: "border-t-rose-500",
    highlightColor: "text-rose-700",
    path: "/admin/Overtime",
  },
];

/* -------------------------------------------------------------------------- */
/* Demo records for KPI popup                                                  */
/* Replace these examples with real API data when your backend is connected.   */
/* -------------------------------------------------------------------------- */

const demoRecords: DashboardRecord[] = [
  {
    id: "1001",
    name: "Rajesh Kumar",
    detail: "ABC Industries",
    status: "Active",
    date: "2026-10-10",
  },
  {
    id: "1002",
    name: "Anil Thomas",
    detail: "GreenTech Pvt Ltd",
    status: "In Progress",
    date: "2026-10-10",
  },
  {
    id: "1003",
    name: "Priya Menon",
    detail: "Sunrise Apartments",
    status: "Scheduled",
    date: "2026-10-09",
  },
  {
    id: "1004",
    name: "Suresh Nair",
    detail: "Sri Hospitals",
    status: "Completed",
    date: "2026-10-09",
  },
  {
    id: "1005",
    name: "Meera Joseph",
    detail: "Water Plant Maintenance",
    status: "Pending",
    date: "2026-10-08",
  },
  {
    id: "1006",
    name: "Arun Mathew",
    detail: "Equipment Inspection",
    status: "Active",
    date: "2026-10-08",
  },
  {
    id: "1007",
    name: "Nikhil Kumar",
    detail: "Filter Replacement",
    status: "Scheduled",
    date: "2026-10-07",
  },
  {
    id: "1008",
    name: "Fathima Ali",
    detail: "Annual Maintenance",
    status: "Pending",
    date: "2026-10-07",
  },
  {
    id: "1009",
    name: "Adil Rahman",
    detail: "RO System Service",
    status: "Completed",
    date: "2026-10-06",
  },
  {
    id: "1010",
    name: "Sneha Das",
    detail: "Site Inspection",
    status: "Active",
    date: "2026-10-06",
  },
];

const statusStyles: Record<string, string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Scheduled: "bg-blue-50 text-blue-700",
  Pending: "bg-amber-50 text-amber-700",
  "In Progress": "bg-orange-50 text-orange-700",
  Completed: "bg-slate-100 text-slate-700",
  Present: "bg-emerald-50 text-emerald-700",
  Absent: "bg-red-50 text-red-700",
  Late: "bg-amber-50 text-amber-700",
  New: "bg-blue-50 text-blue-700",
  Contacted: "bg-violet-50 text-violet-700",
  Approved: "bg-emerald-50 text-emerald-700",
  Rejected: "bg-red-50 text-red-700",
};

/* Creates exactly 10 preview records for the selected KPI. */
function getRecordsForKpi(stat: StatCard): DashboardRecord[] {
  const prefix = stat.title.includes("CUSTOMER")
    ? "CUS"
    : stat.title.includes("ENQUIR")
      ? "ENQ"
      : stat.title.includes("EMPLOYEE")
        ? "EMP"
        : stat.title.includes("ATTENDANCE")
          ? "ATT"
          : stat.title.includes("OVERTIME")
            ? "OT"
            : stat.title.includes("CHECKUP")
              ? "CHK"
              : "SRV";

  return demoRecords.map((record, index) => {
    let status = record.status;

    if (stat.title === "NEW ENQUIRIES") {
      status = ["New", "Contacted", "New", "Assigned"][index % 4];
    } else if (stat.title === "PENDING SERVICES") {
      status = "Pending";
    } else if (stat.title === "SCHEDULED SERVICES") {
      status = "Scheduled";
    } else if (stat.title === "IN-PROGRESS WORKS") {
      status = "In Progress";
    } else if (stat.title === "COMPLETED WORKS") {
      status = "Completed";
    } else if (stat.title === "ATTENDANCE SUMMARY") {
      status = ["Present", "Present", "Late", "Present", "Absent"][
        index % 5
      ];
    } else if (stat.title === "OVERTIME SUMMARY") {
      status = ["Pending", "Approved", "Approved", "Rejected"][
        index % 4
      ];
    } else if (stat.title === "EMPLOYEES") {
      status = index === 8 ? "Inactive" : "Active";
    }

    return {
      ...record,
      id: `${prefix}-${record.id}`,
      status,
    };
  });
}

/* -------------------------------------------------------------------------- */
/* Dashboard                                                                   */
/* -------------------------------------------------------------------------- */

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [selectedStat, setSelectedStat] = useState<StatCard | null>(null);
  const [recordSearch, setRecordSearch] = useState("");

  const selectedRecords = useMemo(() => {
    if (!selectedStat) return [];

    const query = recordSearch.trim().toLowerCase();

    return getRecordsForKpi(selectedStat).filter((record) => {
      if (!query) return true;

      return [
        record.id,
        record.name,
        record.detail,
        record.status,
        record.date,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [selectedStat, recordSearch]);

  const openKpi = (stat: StatCard) => {
    setSelectedStat(stat);
    setRecordSearch("");
  };

  const closeKpi = () => {
    setSelectedStat(null);
    setRecordSearch("");
  };

  return (
    <div className="space-y-6">
      {/* Page header */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Operations Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor customers, services, workforce and daily operations.
          </p>
        </div>
      </div>

      {/* KPI cards */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => openKpi(stat)}
              aria-label={`View 10 records for ${stat.title}`}
              className={`relative w-full cursor-pointer overflow-hidden rounded-xl border border-slate-200 border-t-4 ${stat.accent} bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase leading-5 tracking-wide text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-4 flex items-end justify-between gap-2">
                <p className="text-xs leading-4 text-slate-500">
                  {stat.description}
                </p>

                <span
                  className={`shrink-0 text-[11px] font-bold ${stat.highlightColor}`}
                >
                  {stat.highlight}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-800">
                <Eye size={14} />
                View 
                <ArrowRight size={13} className="ml-auto" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Service and attendance overview */}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Service Overview
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Current service workload
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/Services")}
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              View Details <ArrowRight size={14} />
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <OverviewItem
              label="Pending"
              value="64"
              color="amber"
            />

            <OverviewItem
              label="Scheduled"
              value="92"
              color="blue"
            />

            <OverviewItem
              label="In Progress"
              value="47"
              color="orange"
            />

            <OverviewItem
              label="Completed"
              value="1,284"
              color="emerald"
            />
          </div>
        </div>

        {/* Attendance */}

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Users size={19} />
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Attendance
              </h2>
              <p className="text-xs text-slate-500">
                Today&apos;s workforce
              </p>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-3xl font-bold text-slate-900">94.8%</p>
                <p className="mt-1 text-xs text-slate-500">
                  Overall attendance
                </p>
              </div>

              <span className="text-xs font-bold text-emerald-600">
                +2.4%
              </span>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{ width: "94.8%" }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <AttendanceCount value="82" label="Present" />
              <AttendanceCount value="3" label="Late" />
              <AttendanceCount value="1" label="Absent" />
            </div>

            <button
              type="button"
              onClick={() => navigate("/admin/Attendance")}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
            >
              Go to Attendance <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Recent activity */}

      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Recent Activity
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Latest updates from your operations
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/admin/Services")}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View All
          </button>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ActivityItem
            title="New service request received"
            description="A customer submitted a service request."
            time="5 minutes ago"
            icon={ClipboardList}
          />

          <ActivityItem
            title="Work order completed"
            description="A work order was completed by the field team."
            time="18 minutes ago"
            icon={CheckCircle2}
          />

          <ActivityItem
            title="New customer registered"
            description="A new customer account was created."
            time="32 minutes ago"
            icon={UserPlus}
          />

          <ActivityItem
            title="Technician check-in"
            description="A technician checked in at the assigned site."
            time="45 minutes ago"
            icon={Wrench}
          />
        </div>
      </div>

      {/* KPI records popup */}

      {selectedStat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeKpi();
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Popup header */}

            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${selectedStat.iconBg} ${selectedStat.iconColor}`}
                >
                  {(() => {
                    const Icon = selectedStat.icon;
                    return <Icon size={22} />;
                  })()}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900 sm:text-xl">
                    {selectedStat.title}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Showing 10 preview records · Total: {selectedStat.value}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeKpi}
                aria-label="Close popup"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Popup summary */}

            <div className="grid grid-cols-2 gap-3 border-b border-slate-100 bg-slate-50 p-5 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Total</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {selectedStat.value}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3">
                <p className="text-xs text-slate-500">Preview records</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  10
                </p>
              </div>

              <div className="col-span-2 rounded-lg border border-slate-200 bg-white p-3 sm:col-span-1">
                <p className="text-xs text-slate-500">Category</p>
                <p className="mt-1 truncate text-sm font-bold text-emerald-800">
                  {selectedStat.title}
                </p>
              </div>
            </div>

            {/* Search records */}

            <div className="border-b border-slate-100 p-4 sm:px-6">
              <div className="relative max-w-sm">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={recordSearch}
                  onChange={(event) => setRecordSearch(event.target.value)}
                  placeholder="Search these records..."
                  className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>
            </div>

            {/* Records table */}

            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[650px] text-left">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-5 py-3 font-semibold">Record ID</th>
                    <th className="px-5 py-3 font-semibold">Name</th>
                    <th className="px-5 py-3 font-semibold">Details</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {selectedRecords.map((record) => (
                    <tr
                      key={record.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-emerald-800">
                        {record.id}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-medium text-slate-800">
                        {record.name}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {record.detail}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusStyles[record.status] ||
                            "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {record.date}
                      </td>
                    </tr>
                  ))}

                  {selectedRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No records match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Popup footer and allocated page button */}

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <p className="text-xs text-slate-500">
                Showing {selectedRecords.length} of 10 preview records
              </p>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={closeKpi}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => navigate(selectedStat.path)}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
                >
                  {selectedStat.title}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Reusable components                                                         */
/* -------------------------------------------------------------------------- */

function OverviewItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "amber" | "blue" | "orange" | "emerald";
}) {
  const colorStyles = {
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  return (
    <button
      type="button"
      className={`rounded-lg p-4 text-left transition hover:ring-2 hover:ring-emerald-200 ${colorStyles[color]}`}
    >
      <p className="text-xs">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </button>
  );
}

function AttendanceCount({
  value,
  label,
}: {
  value: string;
  label: string;
}) {
  return (
    <div>
      <p className="text-lg font-bold text-slate-900">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: ElementType;
}

function ActivityItem({
  title,
  description,
  time,
  icon: Icon,
}: ActivityItemProps) {
  return (
    <div className="flex gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-800">{title}</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          {description}
        </p>
        <p className="mt-2 text-[10px] text-slate-400">{time}</p>
      </div>
    </div>
  );
}