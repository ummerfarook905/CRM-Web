import {
  AlertCircle,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Users,
  UserPlus,
  Wrench,
  Timer,
  TrendingUp,
} from "lucide-react";

interface StatCard {
  title: string;
  value: string;
  description: string;
  highlight: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  accent: string;
  highlightColor: string;
}

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
  },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

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

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock3 size={14} />

          Last updated: Just now
        </div>

      </div>

      {/* ================================================= */}
      {/* KPI CARDS */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className={`
                relative
                overflow-hidden
                rounded-xl
                border
                border-slate-200
                border-t-4
                ${stat.accent}
                bg-white
                p-4
                shadow-sm
                transition
                duration-200
                hover:-translate-y-0.5
                hover:shadow-md
              `}
            >

              {/* Top Row */}
              <div className="flex items-start justify-between gap-3">

                <div className="min-w-0">

                  <p className="text-[11px] font-bold uppercase leading-5 tracking-wide text-slate-500">
                    {stat.title}
                  </p>

                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>

                </div>

                {/* Icon */}
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
                  <Icon size={20} strokeWidth={2} />
                </div>

              </div>

              {/* Bottom */}
              <div className="mt-4 flex items-end justify-between gap-2">

                <p className="text-xs leading-4 text-slate-500">
                  {stat.description}
                </p>

                <span
                  className={`
                    shrink-0
                    text-[11px]
                    font-bold
                    ${stat.highlightColor}
                  `}
                >
                  {stat.highlight}
                </span>

              </div>

            </div>
          );
        })}

      </div>

      {/* ================================================= */}
      {/* OPERATION SUMMARY */}
      {/* ================================================= */}

      <div className="grid gap-5 lg:grid-cols-3">

        {/* Service Overview */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 lg:col-span-2">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Service Overview
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Current service workload
              </p>
            </div>

            <button className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
              View Details
            </button>

          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">

            <div className="rounded-lg bg-amber-50 p-4">
              <p className="text-xs text-amber-700">
                Pending
              </p>

              <p className="mt-1 text-2xl font-bold text-amber-900">
                64
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs text-blue-700">
                Scheduled
              </p>

              <p className="mt-1 text-2xl font-bold text-blue-900">
                92
              </p>
            </div>

            <div className="rounded-lg bg-orange-50 p-4">
              <p className="text-xs text-orange-700">
                In Progress
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-900">
                47
              </p>
            </div>

            <div className="rounded-lg bg-emerald-50 p-4">
              <p className="text-xs text-emerald-700">
                Completed
              </p>

              <p className="mt-1 text-2xl font-bold text-emerald-900">
                1,284
              </p>
            </div>

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
                Today's workforce
              </p>
            </div>

          </div>

          <div className="mt-6">

            <div className="flex items-end justify-between">

              <div>
                <p className="text-3xl font-bold text-slate-900">
                  94.8%
                </p>

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
                style={{
                  width: "94.8%",
                }}
              />

            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">

              <div>
                <p className="text-lg font-bold text-slate-900">
                  82
                </p>

                <p className="text-[10px] text-slate-500">
                  Present
                </p>
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">
                  3
                </p>

                <p className="text-[10px] text-slate-500">
                  Late
                </p>
              </div>

              <div>
                <p className="text-lg font-bold text-slate-900">
                  1
                </p>

                <p className="text-[10px] text-slate-500">
                  Absent
                </p>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* ================================================= */}
      {/* RECENT ACTIVITY */}
      {/* ================================================= */}

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

          <button className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">
            View All
          </button>

        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">

          <ActivityItem
            title="New service request received"
            description="Customer #1048 submitted a service request."
            time="5 minutes ago"
            icon={ClipboardList}
          />

          <ActivityItem
            title="Work order completed"
            description="WO-2847 was completed by the field team."
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
            description="Technician checked in at the assigned site."
            time="45 minutes ago"
            icon={Wrench}
          />

        </div>

      </div>

    </div>
  );
}

/* ===================================================== */
/* ACTIVITY ITEM */
/* ===================================================== */

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
  icon: React.ElementType;
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

        <p className="text-xs font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-4 text-slate-500">
          {description}
        </p>

        <p className="mt-2 text-[10px] text-slate-400">
          {time}
        </p>

      </div>

    </div>
  );
}