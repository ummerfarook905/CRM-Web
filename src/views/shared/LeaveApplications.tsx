import { useCallback, useEffect, useState, type FormEvent } from "react";
import { CalendarDays, Clock3, Send } from "lucide-react";
import { api } from "../../api/axios";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | string;
// ANNUAL is the LeaveType enum value confirmed by the leave API contract.
const leaveTypes = [{ value: "ANNUAL", label: "Annual leave" }] as const;
type LeaveApplication = {
  id: string | number;
  startDate: string;
  endDate: string;
  leaveType: string;
  reason: string;
  status: LeaveStatus;
  reviewNote?: string | null;
  createdAt?: string;
};

type RecordValue = Record<string, unknown>;
const asRecord = (value: unknown): RecordValue | null =>
  value && typeof value === "object" ? value as RecordValue : null;

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

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100";

export default function LeaveApplications() {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [leaveType, setLeaveType] = useState<string>(leaveTypes[0].value);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadApplications = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/leave", { params: { page: 1, limit: 20 } });
      setApplications(getRows(response.data));
    } catch (cause) {
      setError(apiMessage(cause, "Could not load your leave applications."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadApplications(); }, [loadApplications]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!startDate || !endDate || !reason.trim()) {
      setError("Enter a start date, end date, and reason for your leave.");
      return;
    }
    if (endDate < startDate) {
      setError("The end date must be on or after the start date.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/leave", { leaveType, startDate, endDate, reason: reason.trim() });
      setStartDate("");
      setEndDate("");
      setLeaveType(leaveTypes[0].value);
      setReason("");
      setSuccess("Your leave application was submitted.");
      await loadApplications();
    } catch (cause) {
      setError(apiMessage(cause, "Could not submit your leave application."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">Employee self service</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Leave applications</h1>
        <p className="mt-2 text-sm text-slate-600">Request time off and track the status of your applications.</p>
      </div>

      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
      {success && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><CalendarDays size={21} /></span>
          <div><h2 className="font-bold text-slate-900">New leave request</h2><p className="text-sm text-slate-500">Your request will be sent to your manager for review.</p></div>
        </div>
        <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-sm font-medium text-slate-700">Start date<input className={inputClass} type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">End date<input className={inputClass} type="date" min={startDate || undefined} value={endDate} onChange={(event) => setEndDate(event.target.value)} required /></label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700">Leave type<select className={inputClass} value={leaveType} onChange={(event) => setLeaveType(event.target.value)} required>{leaveTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
          <label className="space-y-1.5 text-sm font-medium text-slate-700 sm:col-span-2">Reason<textarea className={`${inputClass} min-h-28 resize-y`} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Add a short explanation" maxLength={1000} required /></label>
          <div className="sm:col-span-2"><button disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"><Send size={16} />{submitting ? "Submitting…" : "Submit application"}</button></div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6"><Clock3 size={19} className="text-emerald-700" /><div><h2 className="font-bold text-slate-900">My applications</h2><p className="text-xs text-slate-500">Application history and review status</p></div></div>
        {loading ? <p className="px-6 py-10 text-center text-sm text-slate-500">Loading your applications…</p> : applications.length === 0 ? <p className="px-6 py-10 text-center text-sm text-slate-500">No leave applications yet.</p> : (
          <div className="divide-y divide-slate-100">
            {applications.map((application) => {
              const status = String(application.status || "PENDING").toUpperCase();
              const badge = status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : status === "REJECTED" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-800";
              return <article key={application.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-6"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-slate-900">{application.startDate} – {application.endDate}</p><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{String(application.leaveType || "LEAVE").replaceAll("_", " ")}</span></div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{application.reason}</p>{application.reviewNote && <p className="mt-2 text-sm text-slate-500">Reviewer note: {application.reviewNote}</p>}</div><span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${badge}`}>{status.replaceAll("_", " ")}</span></article>;
            })}
          </div>
        )}
      </section>
    </div>
  );
}
