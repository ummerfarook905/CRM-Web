import { useCallback, useEffect, useState } from "react";
import { Check, ChevronLeft, ChevronRight, ExternalLink, FileCheck2, RefreshCw, RotateCcw, X } from "lucide-react";
import { api } from "../../api/axios";
import { useAppSelector } from "../../app/Hooks";

type UnknownRecord = Record<string, unknown>;
type ReportStatus = "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "CORRECTION_REQUIRED" | string;
interface ServiceReport {
  id: string;
  reportNumber: string;
  status: ReportStatus;
  submittedAt: string;
  workSummary: string;
  workPerformed: string;
  issuesFound: string;
  materialsUsed: string;
  recommendations: string;
  completionRemarks: string;
  photos: Array<{ id: string; url: string; caption: string }>;
  employee: UnknownRecord;
  workOrder: UnknownRecord;
  raw: UnknownRecord;
}
interface Pager { page: number; limit: number; total: number; totalPages: number }

const asRecord = (value: unknown): UnknownRecord => value && typeof value === "object" ? value as UnknownRecord : {};
const text = (value: unknown, fallback = "—"): string => typeof value === "string" || typeof value === "number" ? String(value) : fallback;
const unwrap = (value: unknown): UnknownRecord => {
  const body = asRecord(value);
  const data = body.data;
  return data && !Array.isArray(data) && typeof data === "object" ? data as UnknownRecord : body;
};
function rowsOf(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  const root = asRecord(value);
  const data = asRecord(root.data);
  for (const candidate of [root.data, root.items, root.reports, data.data, data.items, data.reports]) {
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}
function mapReport(value: unknown): ServiceReport {
  const raw = asRecord(value);
  const workOrder = asRecord(raw.workOrder ?? raw.work_order);
  const assignments = Array.isArray(workOrder.assignments) ? workOrder.assignments : [];
  const assignment = asRecord(assignments[0]);
  const employee = asRecord(raw.employee ?? raw.technician ?? assignment.employee ?? { name: raw.employeeName ?? raw.technicianName });
  const media = [raw.photos, raw.attachments, raw.images, raw.photoUrls, raw.workPhotos, raw.reportPhotos].find(Array.isArray) as unknown[] | undefined;
  const photos = (media ?? []).map((photo, index) => {
    if (typeof photo === "string") return { id: String(index), url: photo, caption: "" };
    const item = asRecord(photo);
    return { id: text(item.id, String(index)), url: text(item.url ?? item.imageUrl ?? item.photoUrl, ""), caption: text(item.caption, "") };
  }).filter((photo) => photo.url);
  return {
    id: text(raw.id, ""),
    reportNumber: text(raw.reportNumber ?? raw.reportNo, "Service report"),
    status: text(raw.status, "SUBMITTED").toUpperCase().replaceAll(" ", "_"),
    submittedAt: text(raw.submittedAt ?? raw.createdAt, ""),
    workSummary: text(raw.workSummary, ""),
    workPerformed: text(raw.workPerformed, ""),
    issuesFound: text(raw.issuesFound, ""),
    materialsUsed: text(raw.materialsUsed, ""),
    recommendations: text(raw.recommendations, ""),
    completionRemarks: text(raw.completionRemarks, ""),
    photos,
    employee,
    workOrder,
    raw,
  };
}
function errorMessage(error: unknown, fallback: string): string {
  const response = asRecord(asRecord(error)?.response);
  const data = asRecord(response.data);
  const errors = data.errors;
  const detailValues: unknown[] = [];
  const visit = (value: unknown) => {
    if (typeof value === "string") { detailValues.push(value); return; }
    if (Array.isArray(value)) { value.forEach(visit); return; }
    const item = asRecord(value);
    if (item.property || item.field) {
      const field = text(item.property ?? item.field, "");
      const message = item.message ?? item.messages ?? item.constraints;
      detailValues.push(`${field}: ${Array.isArray(message) ? message.join(", ") : text(message, "Invalid value")}`);
      return;
    }
    if (item.fields || item.details || item.errors) [item.fields, item.details, item.errors].forEach(visit);
  };
  visit(errors ?? data.details ?? data.validationErrors);
  if (detailValues.length) return detailValues.join("; ");
  const message = data.message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : error instanceof Error ? error.message : fallback;
}
function nameOf(value: unknown): string {
  const item = asRecord(value);
  const user = asRecord(item.user);
  const name = [item.firstName ?? user.firstName, item.lastName ?? user.lastName].filter(Boolean).join(" ");
  return name || text(item.name ?? item.fullName ?? item.email);
}
function dateTime(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
const activeReview = (status: string) => ["SUBMITTED", "UNDER_REVIEW"].includes(status.toUpperCase().replaceAll(" ", "_"));
const label = (value: unknown) => text(value).replaceAll("_", " ");
const inputClass = "w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500";
const customerFor = (work: UnknownRecord) => asRecord(work.customer ?? asRecord(work.booking).customer);
const serviceFor = (work: UnknownRecord) => asRecord(work.service ?? asRecord(work.booking).service);
function locationFor(work: UnknownRecord): string {
  const location = asRecord(work.serviceLocation ?? asRecord(work.booking).serviceLocation ?? work.location);
  return [location.locationName, location.address, location.city, location.state, location.pincode]
    .filter((part) => typeof part === "string" && part.trim())
    .join(", ") || text(work.location);
}

export default function ServiceReportReviews() {
  const role = useAppSelector((state) => state.auth.user?.role ?? "");
  const canReview = ["admin", "super_admin", "manager"].includes(role);
  const [items, setItems] = useState<ServiceReport[]>([]);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("SUBMITTED");
  const [pagination, setPagination] = useState<Pager>({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ServiceReport | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/service-reports", { params: { page, limit: 20, status: statusFilter } });
      const root = asRecord(response.data);
      const body = unwrap(response.data);
      const rows = rowsOf(response.data);
      const pageData = asRecord(root.pagination ?? body.pagination);
      const total = Number(pageData.total ?? rows.length);
      const limit = Number(pageData.limit ?? 20);
      const pages = Number(pageData.totalPages ?? Math.max(1, Math.ceil(total / limit)));
      setItems(rows.map(mapReport));
      setPagination({ page: Number(pageData.page ?? page) || page, limit, total, totalPages: pages || 1 });
    } catch (cause) { setError(errorMessage(cause, "Could not load submitted service reports.")); }
    finally { setLoading(false); }
  }, [page, statusFilter]);
  useEffect(() => { void load(); }, [load]);

  const openDetail = async (item: ServiceReport) => {
    setSelected(item); setNote(""); setDetailLoading(true); setDetailError("");
    try {
      const response = await api.get(`/service-reports/${encodeURIComponent(item.id)}`);
      const root = unwrap(response.data);
      setSelected(mapReport(root.serviceReport ?? root.report ?? root));
    } catch (cause) { setDetailError(errorMessage(cause, "Could not load report details.")); }
    finally { setDetailLoading(false); }
  };

  const decide = async (decision: "approve" | "request-correction") => {
    if (!selected || !canReview || !activeReview(selected.status) || acting) return;
    const trimmedNote = note.trim();
    if (decision === "request-correction" && !trimmedNote) { setDetailError("Enter a correction note before requesting changes."); return; }
    setActing(true); setDetailError("");
    try {
      const latestResponse = await api.get(`/service-reports/${encodeURIComponent(selected.id)}`);
      const latestRoot = unwrap(latestResponse.data);
      const latest = mapReport(latestRoot.serviceReport ?? latestRoot.report ?? latestRoot);
      setSelected(latest);
      if (!activeReview(latest.status)) {
        setDetailError("This report has already been reviewed. Refresh the queue before taking another action.");
        await load();
        return;
      }
      await api.post(`/service-reports/${encodeURIComponent(selected.id)}/${decision}`, trimmedNote ? { note: trimmedNote } : {});
      setNotice(decision === "approve" ? "Service report approved." : "Correction requested from the employee.");
      setSelected(null); setNote("");
      await load();
      window.dispatchEvent(new CustomEvent("crm:service-reports-reviewed"));
    } catch (cause) { setDetailError(errorMessage(cause, "Could not save the report review.")); }
    finally { setActing(false); }
  };

  const statusPill = (status: string) => <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{label(status)}</span>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Operations / Reports</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Service Report Review</h1><p className="mt-2 text-sm text-slate-500">Review submitted field reports and approve them or request corrections.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-400 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button></header>
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}<button onClick={() => void load()} className="font-semibold underline">Retry</button></div>}
    {!canReview && <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">You can view reports but do not have permission to approve or request corrections.</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h2 className="text-lg font-bold text-slate-900">Review queue</h2><p className="mt-1 text-sm text-slate-500">{pagination.total} report{pagination.total === 1 ? "" : "s"} in this queue</p></div><label className="flex items-center gap-2 text-sm font-medium text-slate-600">Status<select className={`${inputClass} w-auto`} value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }}><option value="SUBMITTED">Submitted</option><option value="UNDER_REVIEW">Under review</option></select></label></div>
      {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading reports…</p> : items.length === 0 ? <div className="p-12 text-center"><FileCheck2 size={32} className="mx-auto text-slate-300"/><h3 className="mt-3 font-semibold text-slate-800">No reports awaiting review</h3><p className="mt-1 text-sm text-slate-500">Reports submitted by technicians will appear here.</p></div> : <><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3">Report / work order</th><th className="px-4 py-3">Customer / service</th><th className="px-4 py-3">Location</th><th className="px-4 py-3">Technician</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => { const work = item.workOrder; return <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-4 py-4"><p className="font-bold text-slate-900">{item.reportNumber}</p><p className="mt-1 text-xs text-slate-500">{text(work.workOrderNumber ?? work.reference ?? work.id)}</p></td><td className="px-4 py-4"><p className="font-semibold text-slate-800">{nameOf(customerFor(work))}</p><p className="text-xs text-slate-500">{text(serviceFor(work).name ?? work.serviceName)}</p></td><td className="px-4 py-4 text-slate-700">{locationFor(work)}</td><td className="px-4 py-4 text-slate-700">{nameOf(item.employee)}</td><td className="px-4 py-4 text-slate-600">{dateTime(item.submittedAt)}</td><td className="px-4 py-4">{statusPill(item.status)}</td><td className="px-4 py-4"><button onClick={() => void openDetail(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400">Review</button></td></tr>; })}</tbody></table></div><footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500"><span>Page {pagination.page} of {pagination.totalPages}</span><div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button aria-label="Next page" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></footer></>}
    </section>
      {selected && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/50 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget && !acting) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="report-review-title" className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Submitted service report</p><h2 id="report-review-title" className="mt-1 text-xl font-bold text-slate-900">{selected.reportNumber}</h2></div><button aria-label="Close report" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header>
      {detailLoading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading report details…</p> : <div className="space-y-6 p-5"><div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-3"><Info label="Status" value={label(selected.status)}/><Info label="Submitted" value={dateTime(selected.submittedAt)}/><Info label="Technician" value={nameOf(selected.employee)}/><Info label="Employee ID" value={text(selected.employee.employeeNo ?? selected.employee.id)}/><Info label="Employee contact" value={text(asRecord(selected.employee.user).email ?? selected.employee.email)}/><Info label="Work order" value={text(selected.workOrder.workOrderNumber ?? selected.workOrder.reference ?? selected.workOrder.id)}/><Info label="Work order status" value={label(selected.workOrder.status)}/><Info label="Scheduled" value={dateTime(text(selected.workOrder.scheduledDate ?? selected.workOrder.scheduledAt, ""))}/><Info label="Customer" value={nameOf(customerFor(selected.workOrder))}/><Info label="Customer contact" value={text(asRecord(customerFor(selected.workOrder).user).phone ?? customerFor(selected.workOrder).phone)}/><Info label="Service" value={text(serviceFor(selected.workOrder).name ?? selected.workOrder.serviceName)}/><Info label="Location" value={locationFor(selected.workOrder)}/></div>
        <div className="grid gap-4 md:grid-cols-2">{[["Work summary", selected.workSummary], ["Work performed", selected.workPerformed], ["Issues found", selected.issuesFound], ["Materials used", selected.materialsUsed], ["Recommendations", selected.recommendations], ["Completion remarks", selected.completionRemarks]].map(([title, value]) => <article key={title} className="rounded-xl border border-slate-200 p-4"><h3 className="text-sm font-bold text-slate-900">{title}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{value || "No details provided."}</p></article>)}</div>
        <section><h3 className="mb-3 text-sm font-bold text-slate-900">Attached photos</h3>{selected.photos.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{selected.photos.map((photo) => <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-xl border border-slate-200"><img src={photo.url} alt={photo.caption || "Service report attachment"} className="h-48 w-full object-cover"/><div className="flex items-center justify-between gap-2 p-3 text-xs text-slate-600"><span>{photo.caption || "View attachment"}</span><ExternalLink size={14} className="shrink-0"/></div></a>)}</div> : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No photos attached to this report.</p>}</section>
        {detailError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{detailError}</p>}
        {canReview && activeReview(selected.status) && <div className="space-y-3 border-t border-slate-200 pt-4"><label className="block text-sm font-semibold text-slate-700">Reviewer note <span className="font-normal text-slate-400">(optional for approval, required for correction)</span><textarea className={`${inputClass} mt-1.5`} rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add feedback for the technician"/></label><div className="flex flex-wrap justify-end gap-2"><button disabled={acting} onClick={() => void decide("request-correction")} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2.5 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"><RotateCcw size={15}/>Request correction</button><button disabled={acting} onClick={() => void decide("approve")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"><Check size={16}/>{acting ? "Saving…" : "Approve report"}</button></div></div>}
        {canReview && !activeReview(selected.status) && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">This report has already been reviewed. No further decision can be submitted.</p>}
      </div>}
    </section></div>}
  </div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="min-w-0"><p className="text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 break-words text-sm font-medium text-slate-800">{value}</p></div>;
}
