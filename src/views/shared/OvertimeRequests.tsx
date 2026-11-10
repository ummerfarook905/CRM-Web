import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, Check, ChevronLeft, ChevronRight, Clock3, RefreshCw, X } from "lucide-react";
import { api } from "../../api/axios";

type OvertimeStatus = "PENDING" | "APPROVED" | "REJECTED";
type OvertimeRequest = {
  id: string;
  employeeId?: string;
  employeeNo?: string;
  date?: string;
  startTime?: string;
  endTime?: string;
  requestedMinutes?: number;
  durationMinutes?: number;
  breakMinutes?: number;
  reason?: string;
  status?: OvertimeStatus;
  createdAt?: string;
  employee?: {
    id?: string;
    employeeNo?: string;
    user?: { firstName?: string; lastName?: string };
  };
};
type ListResponse = { items: OvertimeRequest[]; total: number; page: number; limit: number; totalPages: number };
const statusOptions: Array<{ label: string; value: "" | OvertimeStatus }> = [
  { label: "Pending", value: "PENDING" }, { label: "Approved", value: "APPROVED" },
  { label: "Rejected", value: "REJECTED" }, { label: "All statuses", value: "" },
];
const messageOf = (error: unknown) => {
  const response = (error as { response?: { status?: number; data?: { message?: unknown } } })?.response;
  if (response?.status === 403) return "You are not authorized to view or decide this request. Managers can review their team only; admins are restricted to their company.";
  const message = response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : error instanceof Error ? error.message : "The overtime request failed.";
};
const displayDate = (value?: string) => {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
const displayTime = (value?: string) => value ? value.slice(0, 5) : "—";
const displayDuration = (minutes?: number) => {
  if (minutes == null) return "—";
  const hours = Math.floor(minutes / 60); const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
};
const employeeName = (request: OvertimeRequest) => [request.employee?.user?.firstName, request.employee?.user?.lastName].filter(Boolean).join(" ") || "Employee";
const employeeNumber = (request: OvertimeRequest) => request.employeeNo ?? request.employee?.employeeNo ?? request.employeeId ?? request.employee?.id ?? "—";
const unwrapList = (response: unknown): ListResponse => {
  const root = response as { data?: unknown };
  const data = root?.data as { data?: unknown; meta?: Record<string, unknown> } | undefined;
  const records = Array.isArray(data?.data) ? data.data as OvertimeRequest[] : Array.isArray(data) ? data as OvertimeRequest[] : [];
  const meta = data?.meta ?? {};
  return {
    items: records,
    total: Number(meta.total ?? records.length),
    page: Number(meta.page ?? 1),
    limit: Number(meta.limit ?? 20),
    totalPages: Number(meta.totalPages ?? 1),
  };
};

export default function OvertimeRequests() {
  const [requests, setRequests] = useState<OvertimeRequest[]>([]);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | OvertimeStatus>("PENDING");
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState<OvertimeRequest | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await api.get("/overtime", { params: { ...(status ? { status } : {}), page, limit: 20 } });
      const result = unwrapList(response.data);
      setRequests(result.items); setPagination({ total: result.total, totalPages: Math.max(1, result.totalPages) });
    } catch (cause) { setError(messageOf(cause)); }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { void loadRequests(); }, [loadRequests]);

  const decide = async (request: OvertimeRequest, decision: "APPROVED" | "REJECTED") => {
    const verb = decision === "APPROVED" ? "approve" : "reject";
    if (!window.confirm(`Are you sure you want to ${verb} this overtime request?`)) return;
    setBusyId(request.id); setError(""); setNotice("");
    try {
      await api.post(`/overtime/${encodeURIComponent(request.id)}/decision`, { decision });
      setNotice(`Overtime request ${decision.toLowerCase()}. The employee will be notified.`);
      setSelected(null);
      await loadRequests();
    } catch (cause) { setError(messageOf(cause)); }
    finally { setBusyId(null); }
  };

  const statusClass: Record<OvertimeStatus, string> = {
    PENDING: "bg-amber-50 text-amber-800", APPROVED: "bg-emerald-50 text-emerald-800", REJECTED: "bg-rose-50 text-rose-800",
  };

  return <div className="space-y-6 text-slate-900">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Workforce Management</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Overtime Requests</h1><p className="mt-1 text-sm text-slate-500">Review overtime requests from your authorized company or team.</p></div><button type="button" onClick={() => void loadRequests()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={16} className={loading ? "animate-spin" : ""}/>Refresh</button></header>
    {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
    {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"><AlertCircle size={17} className="mt-0.5 shrink-0"/>{error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div><h2 className="font-bold">Requests</h2><p className="mt-1 text-xs text-slate-500">{pagination.total} total · page {page} of {pagination.totalPages}</p></div><label className="text-xs font-semibold text-slate-600">Status<select value={status} onChange={(event) => { setStatus(event.target.value as "" | OvertimeStatus); setPage(1); }} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{statusOptions.map((option) => <option key={option.label} value={option.value}>{option.label}</option>)}</select></label></header>
      {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading overtime requests…</p> : requests.length === 0 ? <div className="p-10 text-center"><Clock3 size={28} className="mx-auto text-slate-300"/><p className="mt-3 text-sm font-semibold text-slate-700">No overtime requests found</p><p className="mt-1 text-xs text-slate-500">Try another status or refresh the list.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Requested time</th><th className="px-5 py-3">Planned duration</th><th className="px-5 py-3">Reason</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{requests.map((request) => <tr key={request.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-semibold">{employeeName(request)}</p><p className="mt-1 text-xs text-slate-500">ID {employeeNumber(request)}</p></td><td className="px-5 py-4">{displayDate(request.date)}</td><td className="px-5 py-4">{displayTime(request.startTime)}–{displayTime(request.endTime)}</td><td className="px-5 py-4">{displayDuration(request.requestedMinutes ?? request.durationMinutes)}</td><td className="max-w-xs truncate px-5 py-4" title={request.reason}>{request.reason || "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[request.status ?? "PENDING"]}`}>{request.status ?? "PENDING"}</span></td><td className="px-5 py-4"><button type="button" onClick={() => setSelected(request)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-emerald-400">Details</button></td></tr>)}</tbody></table></div>}
      <footer className="flex items-center justify-between border-t border-slate-100 px-4 py-3"><span className="text-xs text-slate-500">Showing {requests.length} of {pagination.total}</span><div className="flex gap-2"><button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} aria-label="Previous page" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button type="button" disabled={loading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)} aria-label="Next page" className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></footer>
    </section>
    {selected && createPortal(<div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-slate-950/50 p-3 backdrop-blur-sm sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !busyId) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="overtime-detail-title" className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white/95 px-5 py-4 backdrop-blur"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Overtime review</p><h2 id="overtime-detail-title" className="mt-1 text-lg font-bold">{employeeName(selected)}</h2></div><button type="button" aria-label="Close details" onClick={() => setSelected(null)} disabled={Boolean(busyId)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={19}/></button></header><div className="space-y-5 p-5">{error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}<div className="grid gap-3 sm:grid-cols-2">{[["Employee ID", employeeNumber(selected)], ["Date", displayDate(selected.date)], ["Start time", displayTime(selected.startTime)], ["End time", displayTime(selected.endTime)], ["Planned duration", displayDuration(selected.requestedMinutes ?? selected.durationMinutes)], ["Break", selected.breakMinutes == null ? "—" : `${selected.breakMinutes} min`], ["Status", selected.status ?? "PENDING"], ["Submitted", selected.createdAt ? new Date(selected.createdAt).toLocaleString("en-IN") : "—"]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>)}</div><div><h3 className="text-sm font-bold">Reason</h3><p className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-100 p-3 text-sm text-slate-700">{selected.reason || "No reason provided."}</p></div>{(selected.status ?? "PENDING") === "PENDING" && <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={busyId === selected.id} onClick={() => void decide(selected, "REJECTED")} className="rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 disabled:opacity-50">{busyId === selected.id ? "Saving…" : "Reject"}</button><button type="button" disabled={busyId === selected.id} onClick={() => void decide(selected, "APPROVED")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Check size={16}/>{busyId === selected.id ? "Saving…" : "Approve"}</button></div>}</div></section></div>, document.body)}
  </div>;
}
