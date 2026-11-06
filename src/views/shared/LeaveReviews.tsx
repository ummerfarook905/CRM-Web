import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Check, ChevronLeft, ChevronRight, RefreshCw, X } from "lucide-react";
import { api } from "../../api/axios";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
type LeaveApplication = {
  id: string | number;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: LeaveStatus;
  reviewNote?: string | null;
  employee?: Record<string, unknown>;
  createdAt?: string;
};
type RecordValue = Record<string, unknown>;
const asRecord = (value: unknown): RecordValue | null => value && typeof value === "object" ? value as RecordValue : null;
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

function getRows(value: unknown): LeaveApplication[] {
  if (Array.isArray(value)) return value as LeaveApplication[];
  const root = asRecord(value) ?? {};
  const data = asRecord(root.data);
  for (const candidate of [root.items, root.leaves, root.leaveApplications, root.leaveRequests, data?.items, data?.leaves, data?.leaveApplications, data?.leaveRequests, root.data]) {
    if (Array.isArray(candidate)) return candidate as LeaveApplication[];
  }
  return [];
}
function apiMessage(error: unknown, fallback: string): string {
  const data = asRecord(asRecord(asRecord(error)?.response)?.data);
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return error instanceof Error ? error.message : fallback;
}
function personName(value: unknown): string {
  const person = asRecord(value);
  if (!person) return "Staff member";
  const user = asRecord(person.user);
  return [person.firstName ?? user?.firstName, person.lastName ?? user?.lastName].filter(Boolean).join(" ") || String(person.name ?? person.email ?? user?.email ?? "Staff member");
}
function dateLabel(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function LeaveReviews() {
  const [items, setItems] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | number | null>(null);
  const [filter, setFilter] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<LeaveApplication | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filter) params.status = filter;
      const response = await api.get("/leave", { params });
      setItems(getRows(response.data));
      const root = asRecord(response.data) ?? {};
      const data = asRecord(root.data);
      const pagination = asRecord(root.pagination) ?? asRecord(data?.pagination);
      const pages = Number(pagination?.totalPages ?? pagination?.pages ?? 1);
      setTotalPages(Number.isFinite(pages) && pages > 0 ? pages : 1);
    } catch (cause) { setError(apiMessage(cause, "Could not load leave applications.")); }
    finally { setLoading(false); }
  }, [filter, page]);
  useEffect(() => { void load(); }, [load]);

  const decide = async (decision: "APPROVED" | "REJECTED") => {
    if (!selected || actingId !== null) return;
    if (decision === "REJECTED" && !note.trim()) { setError("Add a note explaining why this application is rejected."); return; }
    setActingId(selected.id); setError(""); setSuccess("");
    try {
      await api.post(`/leave/${encodeURIComponent(String(selected.id))}/decision`, { decision, ...(note.trim() ? { note: note.trim() } : {}) });
      setSuccess(`Leave application ${decision === "APPROVED" ? "approved" : "rejected"}.`);
      setSelected(null); setNote(""); await load();
    } catch (cause) { setError(apiMessage(cause, "Could not save the review decision.")); }
    finally { setActingId(null); }
  };

  const badge = (status: string) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{status}</span>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Workforce / Review</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Leave Applications</h1><p className="mt-2 text-sm text-slate-500">Review staff leave requests and record a decision.</p></div><button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-400 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/>Refresh</button></header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h2 className="text-lg font-bold text-slate-900">Staff requests</h2><p className="mt-1 text-sm text-slate-500">Choose a request to review its details.</p></div><select aria-label="Filter by status" className={`${field} w-auto min-w-36`} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1); }}><option value="PENDING">Pending</option><option value="APPROVED">Approved</option><option value="REJECTED">Rejected</option><option value="">All statuses</option></select></div>
      {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading leave applications…</p> : items.length === 0 ? <div className="p-12 text-center"><CalendarDays className="mx-auto text-slate-300" size={30}/><p className="mt-3 font-semibold text-slate-700">No applications found</p><p className="mt-1 text-sm text-slate-500">There are no requests matching this status.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Staff member</th><th className="px-5 py-3">Leave dates</th><th className="px-5 py-3">Type & reason</th><th className="px-5 py-3">Status</th><th className="px-5 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70"><td className="px-5 py-4 font-semibold text-slate-800">{personName(item.employee)}</td><td className="px-5 py-4 text-slate-700">{dateLabel(item.startDate)} – {dateLabel(item.endDate)}</td><td className="max-w-sm px-5 py-4"><p className="font-medium text-slate-800">{String(item.leaveType || "LEAVE").replaceAll("_", " ")}</p><p className="mt-1 line-clamp-2 text-xs text-slate-500">{item.reason}</p></td><td className="px-5 py-4">{badge(item.status || "PENDING")}</td><td className="px-5 py-4"><button onClick={() => { setSelected(item); setNote(item.reviewNote || ""); setError(""); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400">Review</button></td></tr>)}</tbody></table><footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></footer></div>}
    </section>
    {selected && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="leave-review-title" className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Leave request</p><h2 id="leave-review-title" className="mt-1 text-xl font-bold text-slate-900">{personName(selected.employee)}</h2></div><button aria-label="Close review" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header><div className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold text-slate-500">Dates</p><p className="mt-1 text-sm text-slate-800">{dateLabel(selected.startDate)} – {dateLabel(selected.endDate)}</p></div><div><p className="text-xs font-semibold text-slate-500">Leave type / status</p><p className="mt-1 text-sm text-slate-800">{String(selected.leaveType || "LEAVE").replaceAll("_", " ")} · {selected.status}</p></div></div><div><p className="text-xs font-semibold text-slate-500">Reason</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{selected.reason}</p></div>{selected.reviewNote && selected.status !== "PENDING" && <div><p className="text-xs font-semibold text-slate-500">Review note</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{selected.reviewNote}</p></div>}{selected.status === "PENDING" && <><label className="block text-sm font-semibold text-slate-700">Review note <span className="font-normal text-slate-400">(required for rejection)</span><textarea className={`${field} mt-1.5`} rows={3} maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add a note for the employee"/></label><div className="flex flex-wrap justify-end gap-2"><button disabled={actingId !== null} onClick={() => void decide("REJECTED")} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X size={16}/>Reject</button><button disabled={actingId !== null} onClick={() => void decide("APPROVED")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"><Check size={16}/>{actingId === selected.id ? "Saving…" : "Approve"}</button></div></>}</div></section></div>}
  </div>;
}
