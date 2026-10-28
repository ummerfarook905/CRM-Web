
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Eye,
  LoaderCircle,
  Users,
  UserRoundPlus,
  Wrench,
  Timer,
  ArrowRight,
  TrendingUp,
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAdminDashboardViewModel } from "../../viewmodels/admin/UseAdminDashboardViewModel";

type DashboardRecord = Record<string, unknown>;

function formatNumber(value: number | undefined | null): string {
  return (value ?? 0).toLocaleString("en-IN");
}

function getText(
  value: unknown,
  keys: string[],
  fallback = "—",
): string {
  if (typeof value !== "object" || value === null) return fallback;

  const record = value as DashboardRecord;

  for (const key of keys) {
    const item = record[key];

    if (
      (typeof item === "string" || typeof item === "number") &&
      String(item).trim()
    ) {
      return String(item);
    }

    if (typeof item === "object" && item !== null) {
      const nested = item as DashboardRecord;
      const nestedName = nested.name ?? nested.title;

      if (
        typeof nestedName === "string" &&
        nestedName.trim()
      ) {
        return nestedName;
      }
    }
  }

  return fallback;
}

function formatDate(value: string): string {
  if (!value || value === "—") return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeStatus(value: string): string {
  return value.toLowerCase().replace(/[_-]+/g, " ");
}

function StatusBadge({ status }: { status: string }) {
  const normalized = normalizeStatus(status);

  let color = "border-slate-700 bg-slate-800 text-slate-300";

  if (
    ["active", "approved", "completed", "present", "paid"].includes(
      normalized,
    )
  ) {
    color = "border-emerald-900 bg-emerald-950 text-emerald-400";
  } else if (
    ["pending", "scheduled", "late", "in progress", "new"].includes(
      normalized,
    )
  ) {
    color = "border-amber-900 bg-amber-950 text-amber-400";
  } else if (
    ["inactive", "rejected", "absent", "cancelled"].includes(
      normalized,
    )
  ) {
    color = "border-rose-900 bg-rose-950 text-rose-400";
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${color}`}
    >
      {status || "Unknown"}
    </span>
  );
}

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  detail?: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  onOverview: () => void;
  onNavigate: () => void;
};

function StatCard({
  title,
  value,
  description,
  detail,
  icon: Icon,
  color,
  iconBg,
  onOverview,
  onNavigate,
}: StatCardProps) {
  return (
    <article
      className={`group flex min-h-[162px] min-w-0 flex-col rounded-xl border border-[#3a3a3a] border-t-[4px] ${color} bg-[#121212] p-4 transition-colors hover:bg-[#171717]`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8db5ee]">
          {title}
        </p>
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon size={19} />
        </span>
      </div>

      <p className="mt-[-2px] text-[29px] font-bold leading-tight tracking-tight text-white">
        {value}
      </p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pt-4">
        <p className="text-xs text-[#91a9c9]">{description}</p>
        {detail && <p className="text-[11px] font-semibold text-[#50d6aa]">{detail}</p>}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-[#62d9b0]">
        <button
          type="button"
          onClick={onOverview}
          aria-label={`View ${title} overview`}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[#62d9b0]"
        >
          <Eye size={14} />
          Overview
        </button>
        <button
          type="button"
          onClick={onNavigate}
          aria-label={`Go to ${title} page`}
          title={`Open ${title}`}
          className="rounded p-1 cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#62d9b0]"
        >
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </article>
  );
}

function StatOverviewModal({
  title,
  rows,
  loading,
  onClose,
  onNavigate,
  pageLabel,
}: {
  title: string;
  rows: unknown[];
  loading: boolean;
  onClose: () => void;
  onNavigate: () => void;
  pageLabel: string;
}) {
  const columns = [
    {
      label: "Name / Reference",
      render: (row: unknown) =>
        getText(row, ["name", "fullName", "customerName", "employeeName", "title", "reference", "bookingNo", "enquiryNo", "employeeNo", "id"]),
    },
    {
      label: "Details",
      render: (row: unknown) =>
        getText(row, ["email", "phone", "serviceName", "service", "category", "description", "hours", "duration"]),
    },
    {
      label: "Status",
      render: (row: unknown) => {
        const status = getText(row, ["status", "bookingStatus", "enquiryStatus", "approvalStatus", "attendanceStatus"], "");
        return status ? <StatusBadge status={status} /> : "—";
      },
    },
    {
      label: "Date",
      render: (row: unknown) =>
        formatDate(getText(row, ["createdAt", "date", "bookingDate", "scheduledDate", "joiningDate", "checkIn"], "—")),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="stat-overview-title"
        className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-xl border border-[#3b3b3b] bg-[#121212] shadow-2xl"
      >
        <header className="flex items-center justify-between gap-4 border-b border-[#292929] p-5">
          <div>
            <h2 id="stat-overview-title" className="text-lg font-bold text-white">{title}</h2>
            <p className="mt-1 text-xs text-[#8fa8cb]">
              Showing up to 10 records 
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close overview"
            className="rounded-lg border border-[#383838] px-3 py-2 text-sm text-slate-300 hover:bg-[#242424]"
          >
            ✕
          </button>
        </header>

        <div className="max-h-[calc(90vh-160px)] overflow-y-auto p-4 sm:p-5">
          <DashboardTable
            columns={columns}
            rows={rows.slice(0, 10)}
            loading={loading}
            emptyMessage={`No ${title.toLowerCase()} records are available from the API.`}
          />
        </div>

        <footer className="flex flex-col-reverse gap-3 border-t border-[#292929] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-[#8fa8cb]">{Math.min(rows.length, 10)} record(s) shown</p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#3b3b3b] px-4 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-[#242424]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onNavigate}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#008f60] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#00a873]"
            >
              Go to {pageLabel} <ArrowRight size={15} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function PanelHeading({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle: string;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#14241f] text-[#49d3a5]">
        <Icon size={19} />
      </span>

      <div className="min-w-0">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <p className="mt-1 text-xs text-[#8ca3c2]">{subtitle}</p>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
      <ClipboardList size={23} className="text-slate-600" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

function DashboardTable({
  columns,
  rows,
  loading,
  emptyMessage,
}: {
  columns: {
    label: string;
    render: (row: unknown) => React.ReactNode;
  }[];
  rows: unknown[];
  loading: boolean;
  emptyMessage: string;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-400">
        <LoaderCircle size={17} className="animate-spin" />
        Loading records...
      </div>
    );
  }

  if (rows.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[540px] text-left">
        <thead>
          <tr className="border-y border-[#292929] bg-[#171717]">
            {columns.map((column) => (
              <th
                key={column.label}
                className="whitespace-nowrap px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#91a9c9]"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-[#292929]">
          {rows.map((row, index) => (
            <tr
              key={getText(row, ["id", "reference", "employeeNo"], String(index))}
              className="transition-colors hover:bg-[#191919]"
            >
              {columns.map((column) => (
                <td
                  key={column.label}
                  className="px-4 py-3.5 text-sm text-[#b9c5d6]"
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AdminDashboard() {
  const vm = useAdminDashboardViewModel();
  const navigate = useNavigate();
  const [selectedOverview, setSelectedOverview] = useState<{
    title: string;
    rows: unknown[];
    path: string;
    pageLabel: string;
  } | null>(null);

  const { stats, loading, errors, hasErrors } = vm;
  const optionalData = vm as typeof vm & Record<string, unknown>;
  const asRecords = (value: unknown): unknown[] => Array.isArray(value) ? value : [];
  const employeeRecords = asRecords(optionalData.employees ?? optionalData.employeeRecords);
  const attendanceRecords = asRecords(optionalData.attendance ?? optionalData.attendanceRecords);

  const attendancePercentage =
    stats.attendanceCount > 0
      ? Math.round((stats.present / stats.attendanceCount) * 1000) / 10
      : 0;

  const statCards = [
    {
      title: "Total Customers",
      value: stats.totalCustomers,
      description: "Customer accounts",
      detail: `${formatNumber(stats.activeCustomers)} active`,
      icon: Users,
      color: "border-t-[#568a76]",
      iconBg: "bg-[#22242b] text-[#c8a1ff]",
    },
    {
      title: "New Enquiries",
      value: stats.totalEnquiries,
      description: "Enquiries received",
      detail: `${formatNumber(stats.pendingEnquiries)} pending`,
      icon: UserRoundPlus,
      color: "border-t-[#5969bf]",
      iconBg: "bg-[#22242b] text-[#a9b5ff]",
    },
    {
      title: "Service Requests",
      value: stats.totalBookings,
      description: "Total service bookings",
      detail: `${formatNumber(stats.pendingBookings)} pending`,
      icon: ClipboardList,
      color: "border-t-[#884cc2]",
      iconBg: "bg-[#29232e] text-[#df8cff]",
    },
    {
      title: "Pending Services",
      value: stats.pendingBookings,
      description: "Bookings awaiting action",
      detail: undefined,
      icon: AlertCircle,
      color: "border-t-[#b77900]",
      iconBg: "bg-[#292317] text-[#ff9b30]",
    },
    {
      title: "Scheduled Services",
      value: stats.scheduledBookings,
      description: "Scheduled bookings",
      detail: undefined,
      icon: CalendarClock,
      color: "border-t-[#00839d]",
      iconBg: "bg-[#15282c] text-[#43c6e9]",
    },
    {
      title: "In-Progress Works",
      value: stats.inProgressBookings,
      description: "Bookings in progress",
      detail: undefined,
      icon: Wrench,
      color: "border-t-[#d34200]",
      iconBg: "bg-[#2b211a] text-[#ff8c42]",
    },
    {
      title: "Completed Works",
      value: stats.completedBookings,
      description: "Completed bookings",
      detail: undefined,
      icon: CheckCircle2,
      color: "border-t-[#008f50]",
      iconBg: "bg-[#142820] text-[#4ed6a0]",
    },
    {
      title: "Employees",
      value: stats.totalEmployees,
      description: "Employee records in Redux",
      detail: undefined,
      icon: Users,
      color: "border-t-[#0085c7]",
      iconBg: "bg-[#19252d] text-[#5ab8ff]",
    },
    {
      title: "Attendance Summary",
      value: `${attendancePercentage}%`,
      description: "Present among returned records",
      detail: `${formatNumber(stats.present)} present`,
      icon: TrendingUp,
      color: "border-t-[#008c4b]",
      iconBg: "bg-[#172a23] text-[#4ed6a0]",
    },
    {
      title: "Overtime Summary",
      value: formatNumber(stats.pendingOvertime),
      description: "Overtime requests pending",
      detail: undefined,
      icon: Timer,
      color: "border-t-[#a71946]",
      iconBg: "bg-[#2a1c23] text-[#ff6b87]",
    },
  ];

  const cardDestinations: Record<string, { path: string; pageLabel: string }> = {
    "Total Customers": { path: "/admin/Customers", pageLabel: "Customers" },
    "New Enquiries": { path: "/admin/Enquiries", pageLabel: "Enquiries" },
    "Service Requests": { path: "/admin/Services", pageLabel: "Service Requests" },
    "Pending Services": { path: "/admin/Services?status=pending", pageLabel: "Pending Services" },
    "Scheduled Services": { path: "/admin/Services?status=scheduled", pageLabel: "Scheduled Services" },
    "In-Progress Works": { path: "/admin/Services?status=in-progress", pageLabel: "In-Progress Works" },
    "Completed Works": { path: "/admin/Services?status=completed", pageLabel: "Completed Works" },
    Employees: { path: "/admin/Employees", pageLabel: "Employees" },
    "Attendance Summary": { path: "/admin/Attendance", pageLabel: "Attendance" },
    "Overtime Summary": { path: "/admin/Overtime", pageLabel: "Overtime" },
  };

  const getRowsForCard = (title: string): unknown[] => {
    const statusOf = (row: unknown) => normalizeStatus(
      getText(row, ["status", "bookingStatus", "enquiryStatus", "approvalStatus", "attendanceStatus"], ""),
    );
    switch (title) {
      case "Total Customers": return vm.customers;
      case "New Enquiries": return vm.enquiries;
      case "Service Requests": return vm.bookings;
      case "Pending Services": return vm.bookings.filter((row) => ["pending", "new", "requested"].includes(statusOf(row)));
      case "Scheduled Services": return vm.bookings.filter((row) => statusOf(row) === "scheduled");
      case "In-Progress Works": return vm.bookings.filter((row) => ["in progress", "inprogress", "started"].includes(statusOf(row)));
      case "Completed Works": return vm.bookings.filter((row) => statusOf(row) === "completed");
      case "Employees": return employeeRecords;
      case "Attendance Summary": return attendanceRecords;
      case "Overtime Summary": return vm.overtime;
      default: return [];
    }
  };

  const bookingStats = [
    {
      label: "Pending",
      value: stats.pendingBookings,
      text: "text-[#ff8c42]",
      bg: "bg-[#272114]",
    },
    {
      label: "Scheduled",
      value: stats.scheduledBookings,
      text: "text-[#a6b4ff]",
      bg: "bg-[#20242c]",
    },
    {
      label: "In Progress",
      value: stats.inProgressBookings,
      text: "text-[#ff824d]",
      bg: "bg-[#292119]",
    },
    {
      label: "Completed",
      value: stats.completedBookings,
      text: "text-[#4ed6a0]",
      bg: "bg-[#172820]",
    },
  ];

  return (
    <main className="min-h-screen bg-[#1e2223] px-1 py-1 text-white">
      <div className="w-full space-y-6">
        {/* Page heading */}
        <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#42d6a0]">
              Operations Overview
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-white">
              Dashboard
            </h1>

            <p className="mt-1 text-sm text-[#8fa8cb]">
              Monitor customers, services, workforce and daily operations.
            </p>
          </div>

          {/* <div className="flex items-center gap-2 self-start rounded-lg border border-[#383c3d] bg-[#171a1b] px-3 py-2 text-xs text-[#9eafc5] sm:self-auto">
            {loading ? (
              <LoaderCircle
                size={15}
                className="animate-spin text-[#42d6a0]"
              />
            ) : (
              <Activity size={15} className="text-[#42d6a0]" />
            )}
            {loading ? "Loading API data..." : "Live API data"}
          </div> */}
        </header>

        {/* API errors */}
        {hasErrors && (
          <div className="rounded-xl border border-amber-800 bg-[#2b2518] p-4">
            <div className="flex items-start gap-3">
              <AlertCircle
                size={20}
                className="mt-0.5 shrink-0 text-amber-400"
              />
              <div>
                <h2 className="text-sm font-semibold text-amber-300">
                  Some dashboard data could not be loaded
                </h2>
                <ul className="mt-2 space-y-1 text-sm text-amber-200">
                  {errors.map((error, index) => (
                    <li key={`${error}-${index}`}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* KPI cards */}
        <section aria-label="Operations statistics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {statCards.map((card) => {
              const destination = cardDestinations[card.title];
              return (
                <StatCard
                  key={card.title}
                  {...card}
                  onOverview={() => setSelectedOverview({
                    title: card.title,
                    rows: getRowsForCard(card.title),
                    path: destination.path,
                    pageLabel: destination.pageLabel,
                  })}
                  onNavigate={() => navigate(destination.path)}
                />
              );
            })}
          </div>
        </section>

        {/* Service and attendance overview */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <section className="min-w-0 rounded-xl border border-[#3b3b3b] bg-[#121212] p-5 xl:col-span-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white">
                  Service Overview
                </h2>
                <p className="mt-1 text-xs text-[#8fa8cb]">
                  Current service workload
                </p>
              </div>

              <span className="flex items-center gap-1 text-xs font-semibold text-[#52d8b0]">
                <button
                  type="button"
                  onClick={() => navigate("/admin/Services")}
                  aria-label="Go to Service Management"
                  className="flex cursor-pointer items-center gap-1 rounded text-xs font-semibold text-[#52d8b0] hover:text-[#7ce8c6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#62d9b0]"
                >
                  {formatNumber(stats.totalBookings)} total bookings
                  <ArrowRight
                    size={14}
                    className="transition-transform hover:translate-x-1"
                  />
                </button>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
              {bookingStats.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg p-4 ${item.bg}`}
                >
                  <p className={`text-xs font-medium ${item.text}`}>
                    {item.label}
                  </p>
                  <p className={`mt-2 text-2xl font-bold ${item.text}`}>
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 border-t border-[#2e2e2e] pt-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs text-[#a6b5c9]">
                  Completed booking share
                </p>
                <p className="text-xs font-semibold text-[#4ed6a0]">
                  {stats.totalBookings > 0
                    ? `${Math.round(
                        (stats.completedBookings / stats.totalBookings) *
                          100,
                      )}%`
                    : "0%"}
                </p>
              </div>

              <div
                className="h-2 overflow-hidden rounded-full bg-[#292929]"
                role="progressbar"
                aria-label="Completed booking share"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  stats.totalBookings > 0
                    ? Math.min(
                        100,
                        Math.round(
                          (stats.completedBookings / stats.totalBookings) *
                            100,
                        ),
                      )
                    : 0
                }
              >
                <div
                  className="h-full rounded-full bg-[#008f60] transition-all"
                  style={{
                    width: `${
                      stats.totalBookings > 0
                        ? Math.min(
                            100,
                            (stats.completedBookings / stats.totalBookings) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </section>

          <section className="min-w-0 rounded-xl border border-[#3b3b3b] bg-[#121212] p-5 xl:col-span-4">
            <div className="flex items-start justify-between gap-3">
              <PanelHeading
                title="Attendance"
                subtitle="Workforce records returned by the API"
                icon={Users}
              />

              <button
                type="button"
                onClick={() => navigate("/admin/Attendance")}
                title="Go to Attendance"
                aria-label="Go to attendance page"
                className="cursor-pointer rounded p-1 text-[#52d8b0] hover:text-[#7ce8c6] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#62d9b0]"
              >
                <ArrowRight
                  size={15}
                  className="transition-transform hover:translate-x-1"
                />
              </button>
            </div>
            <div className="mt-6">
              <p className="text-3xl font-bold text-white">
                {attendancePercentage}%
              </p>
              <p className="mt-1 text-xs text-[#8fa8cb]">
                Present among returned attendance records
              </p>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#292929]">
              <div
                className="h-full rounded-full bg-[#009b68] transition-all"
                style={{ width: `${attendancePercentage}%` }}
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                {
                  label: "Present",
                  value: stats.present,
                  color: "text-[#4ed6a0]",
                },
                {
                  label: "Late",
                  value: stats.late,
                  color: "text-[#ffc36b]",
                },
                {
                  label: "Absent",
                  value: stats.absent,
                  color: "text-[#ff7188]",
                },
                {
                  label: "On Leave",
                  value: stats.onLeave,
                  color: "text-[#79bfff]",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#292929] bg-[#181818] p-3"
                >
                  <p className="text-xs text-[#9eafc5]">{item.label}</p>
                  <p className={`mt-1 text-xl font-bold ${item.color}`}>
                    {formatNumber(item.value)}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="flex flex-col gap-2 border-t border-[#343839] py-4 text-xs text-[#8191a5] sm:flex-row sm:items-center sm:justify-between">
          <p>Operations Overview · Admin Dashboard</p>
        </footer>
      </div>

      {selectedOverview && (
        <StatOverviewModal
          title={selectedOverview.title}
          rows={selectedOverview.rows}
          loading={loading}
          pageLabel={selectedOverview.pageLabel}
          onClose={() => setSelectedOverview(null)}
          onNavigate={() => {
            const destination = selectedOverview.path;
            setSelectedOverview(null);
            navigate(destination);
          }}
        />
      )}
    </main>
  );
}
