import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Download,
  FileText,
  Flag,
  Plus,
  UserPlus,
  Users,
  Wrench,
  Zap,
  ChevronRight,
  Clock,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

interface StatCard {
  title: string;
  value: string;
  percentage: string;
  description: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accent: string;
  secondary?: string;
}

const stats: StatCard[] = [
  {
    title: "VIEW INCOMING WORK",
    value: "48",
    percentage: "+12.5%",
    description: "12 New Today",
    icon: Download,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-800",
    accent: "border-t-slate-900",
  },

  {
    title: "VIEW SERVICE DETAILS",
    value: "126",
    percentage: "+8.4%",
    description: "Total Service Requests",
    icon: FileText,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    accent: "border-t-blue-500",
  },

  {
    title: "ASSIGN EMPLOYEES",
    value: "92",
    percentage: "+6.2%",
    description: "Employees Assigned",
    icon: UserPlus,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    accent: "border-t-violet-500",
  },

  {
    title: "SET WORK DATE",
    value: "64",
    percentage: "+10.1%",
    description: "Scheduled This Week",
    icon: Calendar,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    accent: "border-t-lime-500",
  },

  {
    title: "SET PRIORITY",
    value: "38",
    percentage: "",
    description: "20 Normal Priority",
    secondary: "18 High Priority",
    icon: Flag,
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    accent: "border-t-orange-500",
  },

  {
    title: "ADD WORK INSTRUCTIONS",
    value: "74",
    percentage: "+14.3%",
    description: "Works With Instructions",
    icon: ClipboardList,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-700",
    accent: "border-t-cyan-500",
  },

  {
    title: "ASSIGN MULTIPLE EMPLOYEES",
    value: "28",
    percentage: "+7.6%",
    description: "Works With Multiple Employees",
    icon: Users,
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    accent: "border-t-red-500",
  },
];

interface WorkItem {
  id: number;
  customer: string;
  service: string;
  location: string;
  priority: "High" | "Medium" | "Low";
  status: "New" | "Pending" | "Assigned";
  date: string;
}

const recentWorks: WorkItem[] = [
  {
    id: 1,
    customer: "ABC Industries",
    service: "RO Maintenance",
    location: "Chennai",
    priority: "High",
    status: "New",
    date: "Oct 15, 2024",
  },

  {
    id: 2,
    customer: "GreenTech Pvt Ltd",
    service: "AMC Service",
    location: "Coimbatore",
    priority: "Medium",
    status: "Pending",
    date: "Oct 15, 2024",
  },

  {
    id: 3,
    customer: "Sunrise Apartments",
    service: "Filter Replacement",
    location: "Madurai",
    priority: "High",
    status: "Assigned",
    date: "Oct 14, 2024",
  },

  {
    id: 4,
    customer: "Global Foods",
    service: "System Checkup",
    location: "Trichy",
    priority: "Medium",
    status: "New",
    date: "Oct 14, 2024",
  },

  {
    id: 5,
    customer: "Sri Hospitals",
    service: "AMC Visit",
    location: "Salem",
    priority: "Low",
    status: "Pending",
    date: "Oct 13, 2024",
  },
];

interface QuickAction {
  name: string;
  path: string;
  icon: React.ElementType;
  bg: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    name: "View Incoming Work",
    path: "/manager/incoming-work",
    icon: Download,
    bg: "bg-emerald-50",
    color: "text-emerald-700",
  },

  {
    name: "View Service Details",
    path: "/manager/service-requests",
    icon: FileText,
    bg: "bg-blue-50",
    color: "text-blue-700",
  },

  {
    name: "Assign Employees",
    path: "/manager/assign-employees",
    icon: Users,
    bg: "bg-violet-50",
    color: "text-violet-700",
  },

  {
    name: "Set Work Date",
    path: "/manager/work-date",
    icon: Calendar,
    bg: "bg-emerald-50",
    color: "text-emerald-700",
  },

  {
    name: "Set Priority",
    path: "/manager/priority",
    icon: Flag,
    bg: "bg-orange-50",
    color: "text-orange-600",
  },

  {
    name: "Add Work Instructions",
    path: "/manager/work-instructions",
    icon: ClipboardList,
    bg: "bg-cyan-50",
    color: "text-cyan-700",
  },

  {
    name: "Assign Multiple Employees",
    path: "/manager/multiple-employees",
    icon: Users,
    bg: "bg-red-50",
    color: "text-red-600",
  },
];

export default function ManagerDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Manager Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage service works, assign employees and track progress.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={15} />

          Last updated: Just now
        </div>

      </div>

      {/* ================================================= */}
      {/* STAT CARDS */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => {
                const action = quickActions.find(
                  (item) => item.name.toUpperCase() === stat.title
                );

                if (action) {
                  navigate(action.path);
                }
              }}
              className={`
                group
                relative
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                border-t-4
                ${stat.accent}
                bg-white
                p-5
                text-left
                shadow-sm
                transition
                duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              `}
            >

              {/* Top */}
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="max-w-[180px] text-[11px] font-bold leading-5 tracking-wide text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>

                </div>

                <div
                  className={`
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    ${stat.iconBg}
                    ${stat.iconColor}
                  `}
                >
                  <Icon
                    size={21}
                    strokeWidth={2}
                  />
                </div>

              </div>

              {/* Bottom */}
              <div className="mt-5 flex items-end justify-between gap-3">

                <div className="flex items-center gap-2">

                  {stat.percentage && (
                    <>
                      <ArrowUpRight
                        size={17}
                        className="text-emerald-600"
                      />

                      <span className="text-sm font-bold text-emerald-700">
                        {stat.percentage}
                      </span>
                    </>
                  )}

                  {!stat.percentage && (
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500" />
                  )}

                </div>

                <div className="text-right">

                  {stat.secondary && (
                    <p className="text-xs font-semibold text-orange-700">
                      {stat.secondary}
                    </p>
                  )}

                  <p className="max-w-[130px] text-xs leading-4 text-slate-500">
                    {stat.description}
                  </p>

                </div>

              </div>

            </button>
          );
        })}

      </div>

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(300px,0.9fr)]">

        {/* ================================================= */}
        {/* RECENT INCOMING WORK */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          {/* Header */}
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <FileText size={20} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Incoming Works
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Latest service requests and work assignments.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/manager/incoming-work")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
            >
              View All

              <ArrowUpRight size={15} />
            </button>

          </div>

          {/* Table */}
          <div className="mt-5 overflow-x-auto">

            <table className="w-full min-w-[760px]">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">

                  <th className="rounded-l-lg px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    #
                  </th>

                  <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    Customer
                  </th>

                  <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    Service Type
                  </th>

                  <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    Location
                  </th>

                  <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    Priority
                  </th>

                  <th className="px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    Status
                  </th>

                  <th className="rounded-r-lg px-3 py-3 text-left text-[11px] font-bold text-slate-500">
                    Received On
                  </th>

                </tr>
              </thead>

              <tbody>

                {recentWorks.map((work) => (
                  <tr
                    key={work.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >

                    <td className="px-3 py-4 text-xs text-slate-500">
                      {work.id}
                    </td>

                    <td className="px-3 py-4 text-xs font-semibold text-slate-800">
                      {work.customer}
                    </td>

                    <td className="px-3 py-4 text-xs text-slate-600">
                      {work.service}
                    </td>

                    <td className="px-3 py-4 text-xs text-slate-600">
                      {work.location}
                    </td>

                    <td className="px-3 py-4">
                      <PriorityBadge priority={work.priority} />
                    </td>

                    <td className="px-3 py-4">
                      <StatusBadge status={work.status} />
                    </td>

                    <td className="px-3 py-4 text-xs text-slate-500">
                      {work.date}
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </div>

        {/* ================================================= */}
        {/* QUICK ACTIONS */}
        {/* ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

          {/* Header */}
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Zap size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Quick Actions
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Manage your daily operations.
              </p>
            </div>

          </div>

          {/* Actions */}
          <div className="mt-5 space-y-2">

            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.path}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-2.5 text-left transition hover:border-slate-200 hover:bg-slate-50"
                >

                  <div
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      ${action.bg}
                      ${action.color}
                    `}
                  >
                    <Icon
                      size={17}
                      strokeWidth={2}
                    />
                  </div>

                  <span className="flex-1 text-xs font-medium text-slate-800">
                    {action.name}
                  </span>

                  <ChevronRight
                    size={16}
                    className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700"
                  />

                </button>
              );
            })}

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* TODAY'S WORK SUMMARY */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          title="New Works"
          value="12"
          description="Received today"
          icon={Download}
          iconClass="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Assigned"
          value="28"
          description="Employees assigned"
          icon={Users}
          iconClass="bg-violet-50 text-violet-700"
        />

        <SummaryCard
          title="In Progress"
          value="17"
          description="Currently active"
          icon={Wrench}
          iconClass="bg-orange-50 text-orange-700"
        />

        <SummaryCard
          title="Completed"
          value="34"
          description="Completed today"
          icon={CheckCircle2}
          iconClass="bg-emerald-50 text-emerald-700"
        />

      </div>

    </div>
  );
}

/* ===================================================== */
/* PRIORITY BADGE */
/* ===================================================== */

interface PriorityBadgeProps {
  priority: "High" | "Medium" | "Low";
}

function PriorityBadge({
  priority,
}: PriorityBadgeProps) {
  const styles = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-[10px]
        font-bold
        ${styles[priority]}
      `}
    >
      {priority}
    </span>
  );
}

/* ===================================================== */
/* STATUS BADGE */
/* ===================================================== */

interface StatusBadgeProps {
  status: "New" | "Pending" | "Assigned";
}

function StatusBadge({
  status,
}: StatusBadgeProps) {
  const styles = {
    New: "bg-blue-100 text-blue-700",
    Pending: "bg-slate-100 text-slate-700",
    Assigned: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`
        inline-flex
        rounded-full
        px-3
        py-1
        text-[10px]
        font-bold
        ${styles[status]}
      `}
    >
      {status}
    </span>
  );
}

/* ===================================================== */
/* SUMMARY CARD */
/* ===================================================== */

interface SummaryCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div
        className={`
          flex
          h-10
          w-10
          shrink-0
          items-center
          justify-center
          rounded-xl
          ${iconClass}
        `}
      >
        <Icon size={19} />
      </div>

      <div className="min-w-0">

        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </p>

        <div className="flex items-baseline gap-2">

          <p className="text-xl font-bold text-slate-900">
            {value}
          </p>

          <p className="truncate text-[10px] text-slate-400">
            {description}
          </p>

        </div>

      </div>

    </div>
  );
}