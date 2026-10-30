import { useEffect, useMemo, useState } from "react";
import { Activity, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Eye, FileCheck2, Image, MapPin, Search, Users, X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import {
  approveWorkServiceReport,
  fetchWorkOrderDetail,
  fetchWorkOrderHistory,
  fetchWorkOrderPhotos,
  fetchWorkOrders,
  type MonitoredWorkOrder,
} from "../../services/WorkMonitoringSlice";

const statusOptions = ["All statuses", "PENDING", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "APPROVED", "CANCELLED"];
const label = (value: string) => value.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const dateLabel = (value: string) => value ? new Date(value).toLocaleDateString() : "Not scheduled";
const timeLabel = (value: string) => value ? value.slice(0, 5) : "";
const reportCanApprove = (status: string) => ["SUBMITTED", "UNDER REVIEW", "UNDER_REVIEW"].includes(status.toUpperCase());

export default function WorkMonitoring() {
  const dispatch = useAppDispatch();
  const { items, pagination, loading, error, detail, detailLoading, detailError, history, historyLoading, photos, photosLoading, reportUpdating, reportError } = useAppSelector((state) => state.workMonitoring);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState("");

  useEffect(() => { void dispatch(fetchWorkOrders({ page, limit: 20, status: status || undefined })); }, [dispatch, page, status]);
  useEffect(() => {
    if (!activeId) return;
    void dispatch(fetchWorkOrderDetail(activeId));
    void dispatch(fetchWorkOrderHistory(activeId));
    void dispatch(fetchWorkOrderPhotos(activeId));
  }, [dispatch, activeId]);

  const visibleItems = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return needle ? items.filter((item) => [item.reference, item.customer, item.company, item.service, item.location, ...item.assignments.map((a) => a.employeeName)].join(" ").toLowerCase().includes(needle)) : items;
  }, [items, search]);
  const assigned = items.filter((item) => item.assignments.length > 0).length;
  const inProgress = items.filter((item) => item.status.toUpperCase().replaceAll(" ", "_") === "IN_PROGRESS").length;
  const completed = items.filter((item) => item.status.toUpperCase() === "COMPLETED").length;

  const openDetails = (work: MonitoredWorkOrder) => { setActiveId(work.id); setApprovalNote(""); };
  const approve = async () => {
    if (!detail?.serviceReport) return;
    const result = await dispatch(approveWorkServiceReport({ reportId: detail.serviceReport.id, note: approvalNote }));
    if (approveWorkServiceReport.fulfilled.match(result)) {
      void dispatch(fetchWorkOrderDetail(detail.id));
      void dispatch(fetchWorkOrders({ page, limit: 20, status: status || undefined }));
      setApprovalNote("");
    }
  };

  return <div className="space-y-6 text-slate-900">
    <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div><h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Work Monitoring</h1><p className="mt-1 text-sm text-slate-500">Track work orders, technician assignments, field evidence, and service reports.</p></div>
      <button onClick={() => void dispatch(fetchWorkOrders({ page, limit: 20, status: status || undefined }))} className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800">Refresh work orders</button>
    </header>

    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { title: "Work orders", value: pagination.total, icon: Activity, tone: "text-emerald-800 bg-emerald-50", accent: "border-t-slate-900" },
        { title: "With technicians", value: assigned, icon: Users, tone: "text-blue-700 bg-blue-50", accent: "border-t-blue-500" },
        { title: "In progress", value: inProgress, icon: Clock3, tone: "text-blue-700 bg-blue-50", accent: "border-t-violet-500" },
        { title: "Completed this page", value: completed, icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50", accent: "border-t-lime-500" },
      ].map(({ title, value, icon: Icon, tone, accent }) => <article key={title} className={`rounded-xl border border-slate-200 border-t-4 ${accent} bg-white p-5 shadow-sm`}><div className="flex items-start justify-between gap-3"><span className="text-[11px] font-bold leading-5 tracking-wide text-slate-500">{title}</span><span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={20}/></span></div><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">Live work order data</p></article>)}
    </section>

    <section className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><h2 className="text-lg font-bold text-black">Work orders</h2><p className="text-sm text-slate-500">Fields are populated from the work order API.</p></div><div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders, customers, technicians" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 sm:w-72"/></label><select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value === "All statuses" ? "" : e.target.value); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{statusOptions.map((option) => <option key={option} value={option === "All statuses" ? "" : option}>{label(option)}</option>)}</select></div></div>
      {error && <div role="alert" className="m-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}<button className="ml-3 font-semibold underline" onClick={() => void dispatch(fetchWorkOrders({ page, limit: 20, status: status || undefined }))}>Retry</button></div>}
      {loading && <div className="p-12 text-center text-sm text-slate-500">Loading work orders…</div>}
      {!loading && !error && visibleItems.length === 0 && <div className="p-12 text-center text-sm text-slate-500">No work orders match this view.</div>}
      {!loading && visibleItems.length > 0 && <><div className="overflow-x-auto"><table className="w-full min-w-[950px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Work order</th><th className="px-5 py-3">Customer / service</th><th className="px-5 py-3">Technicians</th><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Status / priority</th><th className="px-5 py-3">Evidence</th><th className="px-5 py-3"> </th></tr></thead><tbody className="divide-y divide-slate-100">{visibleItems.map((work) => <tr key={work.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><p className="font-bold text-slate-900">{work.reference}</p><p className="mt-1 text-xs text-slate-500">Created {dateLabel(work.createdAt)}</p></td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{work.customer}</p><p className="text-xs text-slate-500">{work.company !== "—" ? `${work.company} · ` : ""}{work.service}</p><p className="mt-1 flex items-center gap-1 text-xs text-slate-500"><MapPin size={12}/>{work.location}</p></td><td className="px-5 py-4"><div className="space-y-1">{work.assignments.length ? work.assignments.map((assignment) => <p key={assignment.id || assignment.employeeId} className="text-slate-700">{assignment.employeeName}<span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{label(assignment.status)}</span></p>) : <span className="text-slate-400">Unassigned</span>}</div></td><td className="px-5 py-4"><p className="flex items-center gap-1.5 text-slate-700"><CalendarDays size={14}/>{dateLabel(work.scheduledDate)}</p><p className="mt-1 text-xs text-slate-500">{[timeLabel(work.scheduledStartTime), timeLabel(work.scheduledEndTime)].filter(Boolean).join("–") || "Time not set"}</p></td><td className="px-5 py-4"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{label(work.status)}</span><p className="mt-2 text-xs text-slate-500">{label(work.priority)} priority</p></td><td className="px-5 py-4"><p className="flex items-center gap-1.5 text-slate-700"><Image size={15}/>{work.photoCount} photos</p><p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500"><FileCheck2 size={14}/>{work.serviceReport ? `Report: ${label(work.serviceReport.status)}` : "No report"}</p></td><td className="px-5 py-4"><button onClick={() => openDetails(work)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400 hover:text-emerald-800"><Eye size={15}/>Details</button></td></tr>)}</tbody></table></div><footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500"><span>{pagination.total ? `Page ${pagination.page} of ${Math.max(1, pagination.totalPages)} · ${pagination.total} work orders` : "No work orders"}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></footer></>}
    </section>

    {activeId && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/45 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setActiveId(null); }}><section role="dialog" aria-modal="true" aria-labelledby="work-detail-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Work order details</p><h2 id="work-detail-title" className="mt-1 text-xl font-bold text-black">{detail?.reference ?? "Loading…"}</h2></div><button aria-label="Close" onClick={() => setActiveId(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header>
      {detailLoading && <p className="p-8 text-center text-slate-500">Loading work order details…</p>}{detailError && <p role="alert" className="m-5 rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{detailError}</p>}{detail && <div className="space-y-6 p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[["Customer", detail.customer], ["Phone", detail.customerPhone || "—"], ["Email", detail.customerEmail || "—"], ["Company", detail.company], ["Service", detail.service], ["Location", detail.location], ["Manager", detail.manager], ["Status", label(detail.status)], ["Priority", label(detail.priority)], ["Schedule", `${dateLabel(detail.scheduledDate)} ${[timeLabel(detail.scheduledStartTime), timeLabel(detail.scheduledEndTime)].filter(Boolean).join("–")}`], ["Booking ID", detail.bookingId || "—"]].map(([key, value]) => <div key={key} className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">{key}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>)}</div>
        {detail.instructions && <div><h3 className="mb-2 font-bold text-slate-900">Work instructions</h3><p className="rounded-xl border border-slate-100 p-3 text-sm text-slate-600">{detail.instructions}</p></div>}
        <div><h3 className="mb-2 font-bold text-slate-900">Technician assignments</h3>{detail.assignments.length ? <div className="grid gap-3 sm:grid-cols-2">{detail.assignments.map((assignment) => <article key={assignment.id || assignment.employeeId} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{assignment.employeeName}</p><span className="text-xs font-semibold text-blue-700">{label(assignment.status)}</span></div><div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">{[["Assigned", assignment.assignedAt], ["Accepted", assignment.acceptedAt], ["Started", assignment.startedAt], ["Completed", assignment.completedAt]].map(([name, value]) => <p key={name}>{name}: {value ? new Date(value).toLocaleString() : "—"}</p>)}</div></article>)}</div> : <p className="text-sm text-slate-500">No technician assignments.</p>}</div>
        <div className="grid gap-5 lg:grid-cols-2"><div><h3 className="mb-2 font-bold text-slate-900">Status history</h3>{historyLoading ? <p className="text-sm text-slate-500">Loading history…</p> : history.length ? <div className="space-y-2">{history.map((entry) => <div key={entry.id} className="rounded-xl border border-slate-100 p-3"><p className="text-sm font-semibold">{entry.fromStatus ? `${label(entry.fromStatus)} → ` : ""}{label(entry.toStatus)}</p><p className="mt-1 text-xs text-slate-500">{entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}{entry.note ? ` · ${entry.note}` : ""}</p></div>)}</div> : <p className="text-sm text-slate-500">No status history available.</p>}</div><div><h3 className="mb-2 font-bold text-slate-900">Field photos</h3>{photosLoading ? <p className="text-sm text-slate-500">Loading photos…</p> : photos.length ? <div className="grid grid-cols-2 gap-2">{photos.map((photo) => <figure key={photo.id} className="overflow-hidden rounded-xl border border-slate-200"><img src={photo.imageUrl} alt={photo.caption || "Work order field photo"} className="h-32 w-full object-cover"/><figcaption className="p-2 text-xs text-slate-500">{photo.caption || (photo.createdAt ? new Date(photo.createdAt).toLocaleDateString() : "Field photo")}</figcaption></figure>)}</div> : <p className="text-sm text-slate-500">No field photos available.</p>}</div></div>
        <div><h3 className="mb-2 font-bold text-slate-900">Service report</h3>{detail.serviceReport ? <div className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{detail.serviceReport.reportNumber || "Service report"}</p><p className="text-xs text-slate-500">Status: {label(detail.serviceReport.status)}{detail.serviceReport.updatedAt ? ` · Updated ${dateLabel(detail.serviceReport.updatedAt)}` : ""}</p></div>{reportCanApprove(detail.serviceReport.status) && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">Awaiting approval</span>}</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{[["Work summary", detail.serviceReport.workSummary], ["Work performed", detail.serviceReport.workPerformed], ["Issues found", detail.serviceReport.issuesFound], ["Materials used", detail.serviceReport.materialsUsed], ["Recommendations", detail.serviceReport.recommendations], ["Completion remarks", detail.serviceReport.completionRemarks]].filter(([, value]) => value).map(([title, value]) => <div key={title}><p className="text-xs font-semibold text-slate-500">{title}</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{value}</p></div>)}</div>{reportCanApprove(detail.serviceReport.status) && <div className="mt-4 flex flex-col gap-2 sm:flex-row"><input value={approvalNote} onChange={(event) => setApprovalNote(event.target.value)} placeholder="Approval note (optional)" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500"/><button disabled={reportUpdating} onClick={() => void approve()} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{reportUpdating ? "Approving…" : "Approve report"}</button></div>}{reportError && <p role="alert" className="mt-2 text-sm text-rose-700">{reportError}</p>}</div> : <p className="text-sm text-slate-500">No service report has been submitted.</p>}</div>
      </div>}</section></div>}
  </div>;
}
