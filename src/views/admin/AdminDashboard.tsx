import {
  Activity,
  ArrowRight,
  CalendarDays,
  CalendarRange,
  CircleHelp,
  ClipboardList,
  Clock3,
  Headphones,
  FileCheck2,
  Users,
  UserRoundPlus,
  Wrench,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminDashboardViewModel } from "../../viewmodels/admin/UseAdminDashboardViewModel";
import { useServiceReportPendingCount } from "../../hooks/useServiceReportPendingCount";

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const displayDate = (value: string) => {
  if (!value) return "Date not set";
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

const statusTone = (status: string) => {
  const normalized = status.toLowerCase();
  if (["completed", "approved", "active"].includes(normalized)) {
    return "bg-emerald-50 text-emerald-700";
  }
  if (["scheduled", "in progress"].includes(normalized)) {
    return "bg-blue-50 text-blue-700";
  }
  if (["rejected", "cancelled"].includes(normalized)) {
    return "bg-rose-50 text-rose-700";
  }
  return "bg-amber-50 text-amber-700";
};

export default function AdminDashboard() {
  const vm = useAdminDashboardViewModel();
  const navigate = useNavigate();
  const [now, setNow] = useState(() => new Date());
  const reportReview = useServiceReportPendingCount("admin");

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const today = dateKey(now);
  const scheduledToday = vm.bookings.filter(
    (booking) => booking.scheduledDate?.slice(0, 10) === today,
  );
  const completedRate = vm.stats.totalBookings
    ? Math.round((vm.stats.completedBookings / vm.stats.totalBookings) * 100)
    : 0;

  const week = useMemo(() => {
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      const key = dateKey(date);
      const count = vm.bookings.filter((booking) =>
        [booking.requestedDate, booking.scheduledDate].some(
          (value) => value?.slice(0, 10) === key,
        ),
      ).length;
      return {
        key,
        label: date.toLocaleDateString("en-IN", { weekday: "short" }),
        count,
      };
    });
  }, [now, vm.bookings]);
  const maxWeekCount = Math.max(1, ...week.map((day) => day.count));

  const miniStats = [
    {
      title: "New enquiries",
      value: vm.stats.totalEnquiries,
      note: `${vm.stats.pendingEnquiries} waiting for follow-up`,
      icon: UserRoundPlus,
      tone: "blue",
      path: "/admin/Enquiries",
    },
    {
      title: "Today’s bookings",
      value: scheduledToday.length,
      note: "Scheduled for today",
      icon: CalendarDays,
      tone: "green",
      path: "/admin/Services",
    },
    {
      title: "Service requests",
      value: vm.stats.totalBookings,
      note: `${vm.stats.pendingBookings} need attention`,
      icon: ClipboardList,
      tone: "sky",
      path: "/admin/Services",
    },
    {
      title: "Attendance today",
      value: `${vm.stats.present}`,
      note: `${vm.stats.late} late check-ins`,
      icon: Users,
      tone: "teal",
      path: "/admin/Attendance",
    },
    {
      title: "Active customers",
      value: vm.stats.activeCustomers,
      note: `${vm.stats.totalCustomers} customer records`,
      icon: Activity,
      tone: "blue",
      path: "/admin/Customers",
    },
    {
      title: "Reports awaiting review",
      value: reportReview.count ?? "—",
      note: reportReview.loading ? "Loading submitted reports" : "Submitted service reports",
      icon: FileCheck2,
      tone: "teal",
      path: "/admin/WorkVerification",
    },
  ];

  const recentBookings = [...vm.bookings]
    .sort((a, b) => (b.requestedDate || "").localeCompare(a.requestedDate || ""))
    .slice(0, 4);
  const toneClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    green: "bg-emerald-100 text-emerald-700",
    sky: "bg-sky-100 text-sky-700",
    teal: "bg-teal-100 text-teal-700",
  };

  return (
    <div className="space-y-6 pb-5 text-slate-900">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-medium text-slate-500">
            Welcome back <span className="mx-1 text-blue-600">•</span>
            {now.toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-[27px]">
            Service operations
          </h1>
        </div>
        <div className="flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm sm:self-auto">
          <span className={`h-2 w-2 rounded-full ${vm.loading ? "animate-pulse bg-amber-400" : "bg-emerald-500"}`} />
          {vm.loading ? "Syncing backend data" : "Backend data connected"}
        </div>
      </header>

      {vm.hasErrors && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Some dashboard data is unavailable: {vm.errors.join(" · ")}
        </div>
      )}

      <section
        aria-label="Service operations overview"
        className="space-y-3 rounded-[26px] border border-blue-200/70 bg-gradient-to-br from-blue-100 via-blue-300 to-blue-600 p-3 shadow-[0_18px_50px_rgba(37,99,235,0.17)] sm:p-4"
      >
        <div className="grid gap-3 xl:grid-cols-[minmax(178px,1fr)_minmax(220px,1.45fr)_minmax(165px,0.95fr)_minmax(210px,1.35fr)_minmax(180px,1fr)]">
          <article className="relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-[#3288f1] to-[#1559c2] p-5 text-white shadow-sm">
            <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border-[24px] border-white/10" />
            <div className="relative">
              <p className="text-sm font-semibold text-blue-50">Completion rate</p>
              <p className="mt-5 text-[42px] font-bold leading-none tracking-tight">
                {completedRate}%
              </p>
            </div>
            <div className="relative rounded-2xl bg-white/15 px-3.5 py-3 text-xs leading-5 text-white/95">
              {vm.stats.completedBookings} completed from {vm.stats.totalBookings} service requests
            </div>
          </article>

          <article className="flex min-h-[210px] flex-col rounded-[22px] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Bookings this week</h2>
                <p className="mt-1 text-xs text-slate-500">Requested and scheduled work</p>
              </div>
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-blue-700">
                {week.reduce((sum, day) => sum + day.count, 0)} total
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {week.reduce((sum, day) => sum + day.count, 0)}
            </p>
            <div className="mt-auto flex h-[74px] items-end justify-between gap-2 pt-4" aria-label="Bookings by weekday">
              {week.map((day) => (
                <div key={day.key} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="flex h-full w-full items-end justify-center">
                    <div
                      className={`w-2.5 rounded-full ${day.key === today ? "bg-blue-600" : "bg-slate-300"}`}
                      style={{ height: `${Math.max(7, (day.count / maxWeekCount) * 48)}px` }}
                      title={`${day.count} booking(s)`}
                    />
                  </div>
                  <span className={`text-[9px] font-semibold uppercase ${day.key === today ? "text-blue-700" : "text-slate-400"}`}>
                    {day.label.slice(0, 1)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="flex min-h-[210px] flex-col items-center justify-center rounded-[22px] bg-white p-4 text-center shadow-sm">
            <p className="self-start text-left text-sm font-bold text-slate-900">Local time</p>
            <div className="relative mt-3 flex h-[134px] w-[134px] items-center justify-center rounded-full p-[7px]" style={{ background: "conic-gradient(#2563eb 0 72%, #e5eaf1 72% 100%)" }}>
              <div className="flex h-full w-full flex-col items-center justify-center rounded-full border border-slate-100 bg-white">
                <Clock3 size={16} className="mb-1 text-blue-600" />
                <span className="text-xl font-bold tabular-nums text-slate-900">
                  {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="mt-1 text-[10px] text-slate-500">
                  {now.toLocaleDateString("en-IN", { weekday: "long" })}
                </span>
              </div>
            </div>
          </article>

          <article className="flex min-h-[210px] flex-col rounded-[22px] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Workload status</h2>
                <p className="mt-1 text-xs text-slate-500">Current booking pipeline</p>
              </div>
              <Wrench size={19} className="text-blue-600" />
            </div>
            <div className="mt-5 grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Pending", value: vm.stats.pendingBookings, color: "text-amber-600" },
                { label: "Active", value: vm.stats.inProgressBookings, color: "text-blue-600" },
                { label: "Done", value: vm.stats.completedBookings, color: "text-emerald-600" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 px-2 py-3">
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                  <p className="mt-1 text-[10px] text-slate-500">{item.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-auto pt-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-blue-600" style={{ width: `${completedRate}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">{completedRate}% of all requests completed</p>
            </div>
          </article>

          <button
            type="button"
            onClick={() => navigate("/admin/Services")}
            className="group relative flex min-h-[210px] flex-col justify-between overflow-hidden rounded-[22px] bg-gradient-to-br from-[#138968] to-[#087054] p-5 text-left text-white shadow-sm transition hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
          >
            <div className="absolute -right-7 -top-8 h-32 w-32 rounded-full border-[22px] border-white/10" />
            <div className="relative flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-emerald-50">On schedule today</p>
                <p className="mt-1 text-xs text-emerald-100/80">Service visits</p>
              </div>
              <span className="text-3xl font-bold">{scheduledToday.length}</span>
            </div>
            <div className="relative">
              <p className="text-xs leading-5 text-emerald-50/90">
                {scheduledToday.length ? `${scheduledToday.length} scheduled visit${scheduledToday.length === 1 ? "" : "s"} today` : "Nothing scheduled for today"}
              </p>
              <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/90">
                Open bookings <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {miniStats.map((item) => {
            const Icon = item.icon;
            return (
              <button
                type="button"
                key={item.title}
                onClick={() => navigate(item.path)}
                className="group min-w-0 rounded-[20px] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${toneClasses[item.tone]}`}>
                    <Icon size={18} />
                  </span>
                  <span className="truncate text-xs font-bold text-slate-700">{item.title}</span>
                </div>
                <p className="mt-3 text-[28px] font-bold leading-none tracking-tight text-slate-900">{item.value}</p>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
                  <span className="truncate text-[10px] text-slate-500">{item.note}</span>
                  <ArrowRight size={14} className="shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-blue-600" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                <Headphones size={19} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Service activity</h2>
                <p className="mt-0.5 text-xs text-slate-500">Recent requests and their progress</p>
              </div>
            </div>
            <button type="button" onClick={() => navigate("/admin/Services")} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:text-blue-700">
              View all <ArrowRight size={14} />
            </button>
          </header>

          <div className="grid gap-5 p-5 md:grid-cols-[220px_1fr]">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-5 text-center">
              <div className="relative flex h-36 w-36 items-center justify-center rounded-full p-3" style={{ background: `conic-gradient(#2563eb ${completedRate}%, #e2e8f0 ${completedRate}% 100%)` }}>
                <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white">
                  <span className="text-3xl font-bold text-slate-900">{vm.stats.completedBookings}</span>
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">Completed</span>
                </div>
              </div>
              <p className="mt-4 text-xs font-semibold text-slate-700">{completedRate}% completion rate</p>
              <p className="mt-1 text-[10px] text-slate-500">Across {vm.stats.totalBookings} service requests</p>
            </div>

            <div className="min-w-0">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Recent requests</p>
                <span className="text-[10px] text-slate-400">Latest first</span>
              </div>
              <div className="divide-y divide-slate-100">
                {recentBookings.map((booking) => (
                  <div key={booking.id} className="flex min-w-0 items-center justify-between gap-3 py-3 first:pt-1">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-800">{booking.customer || booking.reference || "Service request"}</p>
                      <p className="mt-1 truncate text-[10px] text-slate-500">{booking.reference} · {booking.company || booking.location || "Customer booking"}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className={`rounded-full px-2 py-1 text-[9px] font-semibold ${statusTone(booking.status)}`}>{booking.status || "Pending"}</span>
                      <span className="text-[9px] text-slate-400">{displayDate(booking.requestedDate)}</span>
                    </div>
                  </div>
                ))}
                {!vm.loading && recentBookings.length === 0 && (
                  <p className="py-8 text-center text-xs text-slate-500">No service requests have been returned by the API.</p>
                )}
                {vm.loading && recentBookings.length === 0 && (
                  <p className="py-8 text-center text-xs text-slate-500">Loading service activity…</p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
          <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CalendarRange size={19} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Today’s schedule</h2>
              <p className="mt-0.5 text-xs text-slate-500">Service visits and field work</p>
            </div>
          </header>
          <div className="space-y-3 p-5">
            {scheduledToday.slice(0, 4).map((booking) => (
              <div key={booking.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700"><Clock3 size={16} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-slate-800">{booking.customer || booking.reference}</p>
                  <p className="mt-1 truncate text-[10px] text-slate-500">{booking.company || booking.location || "Service visit"}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-slate-500">{booking.scheduledTime || "Time unset"}</span>
              </div>
            ))}
            {scheduledToday.length === 0 && (
              <div className="flex min-h-[190px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 text-center">
                <CalendarDays size={24} className="text-emerald-600" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No visits scheduled today</p>
                <p className="mt-1 max-w-[230px] text-xs leading-5 text-slate-500">New confirmed service dates will appear here.</p>
              </div>
            )}
            <button type="button" onClick={() => navigate("/admin/Services")} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800 transition hover:bg-emerald-100">
              Open service bookings <ArrowRight size={14} />
            </button>
          </div>
        </section>
      </div>

      <footer className="flex items-center justify-between border-t border-slate-200 pt-4 text-[10px] text-slate-500">
        <span>Service Operations · Admin workspace</span>
        <span className="inline-flex items-center gap-1"><CircleHelp size={12} /> Data refreshes from the backend</span>
      </footer>
    </div>
  );
}
