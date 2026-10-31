import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, ChevronLeft, ChevronRight, ExternalLink, ReceiptText, X } from "lucide-react";
import { api } from "../../api/axios";
import { useAppSelector } from "../../app/Hooks";

type ExpenseStatus = "PENDING" | "APPROVED" | "REJECTED";
type Expense = {
  id: string | number;
  amount: number;
  category: string;
  expenseDate: string;
  description: string;
  receiptUrl?: string | null;
  status: ExpenseStatus;
  reviewNote?: string | null;
  note?: string | null;
  employee?: Record<string, unknown>;
  reviewer?: Record<string, unknown>;
  createdAt?: string;
};
type ExpenseForm = { amount: string; category: string; expenseDate: string; description: string; receiptUrl: string };
const initialForm: ExpenseForm = { amount: "", category: "", expenseDate: new Date().toISOString().slice(0, 10), description: "", receiptUrl: "" };
const statuses: ExpenseStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}
function unwrap(value: unknown): Record<string, unknown> {
  const body = asRecord(value) ?? {};
  const data = asRecord(body.data);
  const root = data ?? body;
  return asRecord(root.expense) ?? root;
}
function getRows(value: unknown): Expense[] {
  if (Array.isArray(value)) return value as Expense[];
  const body = asRecord(value) ?? {};
  const data = asRecord(body.data);
  const candidates = [body.data, body.items, body.expenses, data?.data, data?.items, data?.expenses];
  return (candidates.find(Array.isArray) as Expense[] | undefined) ?? [];
}
function apiMessage(error: unknown, fallback: string): string {
  const response = asRecord(asRecord(error)?.response);
  const data = asRecord(response?.data);
  const message = data?.message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join(", ");
  return error instanceof Error ? error.message : fallback;
}
function personName(value: unknown): string {
  const person = asRecord(value);
  if (!person) return "—";
  const user = asRecord(person.user);
  const fullName = [person.firstName ?? user?.firstName, person.lastName ?? user?.lastName].filter(Boolean).join(" ");
  return fullName || String(person.name ?? person.email ?? user?.email ?? "—");
}
function dateLabel(value: string): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
const money = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
const field = "w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";

export default function Expenses({ review = false }: { review?: boolean }) {
  const { user } = useAppSelector((state) => state.auth);
  const [items, setItems] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<ExpenseForm>(initialForm);
  const [statusFilter, setStatusFilter] = useState(review ? "PENDING" : "");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Expense | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const isReviewer = ["manager", "admin", "super_admin"].includes(user?.role ?? "");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (statusFilter) params.status = statusFilter;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;
      const response = await api.get("/expenses", { params });
      setItems(getRows(response.data));
      const root = asRecord(response.data) ?? {};
      const data = asRecord(root.data);
      const pagination = asRecord(root.pagination) ?? asRecord(data?.pagination);
      const pages = Number(pagination?.totalPages ?? pagination?.pages ?? 1);
      setTotalPages(Number.isFinite(pages) && pages > 0 ? pages : 1);
    } catch (cause) {
      setError(apiMessage(cause, "Could not load expense claims."));
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, page, statusFilter]);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setSuccess("");
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) { setError("Enter an amount greater than zero."); return; }
    if (!form.category.trim() || !form.expenseDate || !form.description.trim()) { setError("Complete the category, date, and description."); return; }
    if (form.receiptUrl.trim()) {
      try { const url = new URL(form.receiptUrl.trim()); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); }
      catch { setError("Enter a valid receipt URL starting with http:// or https://."); return; }
    }
    setSaving(true);
    try {
      await api.post("/expenses", { amount, category: form.category.trim(), expenseDate: form.expenseDate, description: form.description.trim(), ...(form.receiptUrl.trim() ? { receiptUrl: form.receiptUrl.trim() } : {}) });
      setForm(initialForm); setSuccess("Expense claim submitted."); setPage(1); await load();
    } catch (cause) { setError(apiMessage(cause, "Could not submit the expense claim.")); }
    finally { setSaving(false); }
  };

  const inspect = async (item: Expense) => {
    setSelected(item); setDecisionNote(""); setError("");
    try {
      const response = await api.get(`/expenses/${encodeURIComponent(String(item.id))}`);
      setSelected(unwrap(response.data) as unknown as Expense);
    } catch (cause) { setError(apiMessage(cause, "Could not load expense details.")); }
  };
  const decide = async (decision: "APPROVED" | "REJECTED") => {
    if (!selected || selected.status !== "PENDING" || acting) return;
    setActing(true); setError("");
    try {
      await api.post(`/expenses/${encodeURIComponent(String(selected.id))}/decision`, { decision, ...(decisionNote.trim() ? { note: decisionNote.trim() } : {}) });
      setSelected(null); setDecisionNote(""); await load();
    } catch (cause) { setError(apiMessage(cause, "Could not save the review decision.")); }
    finally { setActing(false); }
  };

  const statusBadge = (status: string) => <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status === "APPROVED" ? "bg-emerald-50 text-emerald-800" : status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800"}`}>{status}</span>;

  return <div className="space-y-6">
    <header><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">{review ? "Finance / Review" : "My account"}</p><h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{review ? "Expense Claims" : "My Expenses"}</h1><p className="mt-2 text-sm text-slate-500">{review ? "Review employee expense claims and record a decision." : "Submit a claim and track its review status."}</p></header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {success && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</p>}
    {!review && <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="mb-4 text-lg font-bold text-slate-900">Submit an expense</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <label className="text-sm font-semibold text-slate-700">Amount (₹)<input className={`${field} mt-1.5`} type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="1250.50" /></label>
      <label className="text-sm font-semibold text-slate-700">Category<input className={`${field} mt-1.5`} required maxLength={80} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Travel" /></label>
      <label className="text-sm font-semibold text-slate-700">Expense date<input className={`${field} mt-1.5`} type="date" required value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-3">Description<textarea className={`${field} mt-1.5`} required rows={2} maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the expense" /></label>
      <label className="text-sm font-semibold text-slate-700 sm:col-span-2 lg:col-span-3">Receipt URL <span className="font-normal text-slate-400">(optional)</span><input className={`${field} mt-1.5`} type="url" value={form.receiptUrl} onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })} placeholder="https://…" /></label>
    </div><button disabled={saving} className="mt-4 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{saving ? "Submitting…" : "Submit claim"}</button></form>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-100 p-4 sm:p-5"><div><h2 className="text-lg font-bold text-slate-900">{review ? "Claims for review" : "Claim history"}</h2><p className="mt-1 text-sm text-slate-500">{review ? "Select a claim to see its details." : "Your submitted expense claims."}</p></div><div className="flex flex-wrap gap-2"><select aria-label="Filter by status" className={`${field} w-auto min-w-36`} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}><option value="">All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><input aria-label="From date" className={`${field} w-auto`} type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} /><input aria-label="To date" className={`${field} w-auto`} type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} /></div></div>
      {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading expense claims…</p> : items.length === 0 ? <div className="p-12 text-center"><ReceiptText className="mx-auto text-slate-300" size={30}/><p className="mt-3 font-semibold text-slate-700">No expense claims found</p><p className="mt-1 text-sm text-slate-500">{review ? "There are no claims matching these filters." : "Your submitted claims will appear here."}</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{review && <th className="px-5 py-3">Employee</th>}<th className="px-5 py-3">Expense</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Description</th><th className="px-5 py-3">Receipt</th><th className="px-5 py-3">Status / review</th>{review && <th className="px-5 py-3"/>}</tr></thead><tbody className="divide-y divide-slate-100">{items.map((item) => <tr key={item.id} className="hover:bg-slate-50/70">{review && <td className="px-5 py-4 font-semibold text-slate-800">{personName(item.employee)}</td>}<td className="px-5 py-4"><p className="font-bold text-slate-900">{money(Number(item.amount))}</p><p className="mt-1 text-xs text-slate-500">{item.category}</p></td><td className="px-5 py-4 text-slate-700">{dateLabel(item.expenseDate)}</td><td className="max-w-xs whitespace-normal px-5 py-4 text-slate-700">{item.description}</td><td className="px-5 py-4">{item.receiptUrl ? <a className="inline-flex items-center gap-1 text-emerald-800 underline" href={item.receiptUrl} target="_blank" rel="noreferrer">View <ExternalLink size={13}/></a> : <span className="text-slate-400">—</span>}</td><td className="px-5 py-4">{statusBadge(item.status)}{(item.reviewNote || item.note) && <p className="mt-2 max-w-48 text-xs text-slate-500">{item.reviewNote || item.note}</p>}</td>{review && <td className="px-5 py-4"><button onClick={() => void inspect(item)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-400">Details</button></td>}</tr>)}</tbody></table><footer className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button aria-label="Previous page" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronLeft size={16}/></button><button aria-label="Next page" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"><ChevronRight size={16}/></button></div></footer></div>}
    </section>
    {review && isReviewer && selected && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null); }}><section role="dialog" aria-modal="true" aria-labelledby="expense-detail-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><header className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Expense details</p><h2 id="expense-detail-title" className="mt-1 text-xl font-bold text-slate-900">{money(Number(selected.amount))} · {selected.category}</h2></div><button aria-label="Close details" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20}/></button></header><div className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold text-slate-500">Employee</p><p className="mt-1 text-sm text-slate-800">{personName(selected.employee)}</p><p className="text-xs text-slate-500">{String(asRecord(selected.employee)?.email ?? "")}</p></div><div><p className="text-xs font-semibold text-slate-500">Reviewer</p><p className="mt-1 text-sm text-slate-800">{personName(selected.reviewer)}</p></div><div><p className="text-xs font-semibold text-slate-500">Expense date</p><p className="mt-1 text-sm text-slate-800">{dateLabel(selected.expenseDate)}</p></div><div><p className="text-xs font-semibold text-slate-500">Status</p><div className="mt-1">{statusBadge(selected.status)}</div></div></div><div><p className="text-xs font-semibold text-slate-500">Description</p><p className="mt-1 whitespace-pre-wrap text-sm text-slate-800">{selected.description}</p></div>{selected.receiptUrl && <a className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-800 underline" href={selected.receiptUrl} target="_blank" rel="noreferrer">Open receipt <ExternalLink size={14}/></a>}{(selected.reviewNote || selected.note) && <div><p className="text-xs font-semibold text-slate-500">Review note</p><p className="mt-1 text-sm text-slate-800">{selected.reviewNote || selected.note}</p></div>}{selected.status === "PENDING" && <><label className="block text-sm font-semibold text-slate-700">Review note <span className="font-normal text-slate-400">(optional)</span><textarea className={`${field} mt-1.5`} rows={3} value={decisionNote} onChange={(e) => setDecisionNote(e.target.value)} placeholder="Add a note for the employee"/></label><div className="flex flex-wrap justify-end gap-2"><button disabled={acting} onClick={() => void decide("REJECTED")} className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><X size={16}/>Reject</button><button disabled={acting} onClick={() => void decide("APPROVED")} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"><Check size={16}/>{acting ? "Saving…" : "Approve"}</button></div></>}</div></section></div>}
  </div>;
}
