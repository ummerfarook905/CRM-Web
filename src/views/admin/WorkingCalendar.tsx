import { CalendarDays, ChevronLeft, ChevronRight, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { getWorkingCalendar, putWorkingCalendar } from "../../api/workingCalendar";
import type { CalendarException, CalendarExceptionType, WorkingCalendar } from "../../api/workingCalendar";
import type { RootState } from "../../app/Store";

const weekdayLabels = [
  { value: 1, label: "Mon" }, { value: 2, label: "Tue" }, { value: 3, label: "Wed" },
  { value: 4, label: "Thu" }, { value: 5, label: "Fri" }, { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;
const exceptionTypes: { value: CalendarExceptionType; label: string; tone: string }[] = [
  { value: "HOLIDAY", label: "Holiday", tone: "border-rose-200 bg-rose-100 text-rose-800" },
  { value: "WORKING_DAY", label: "Special working day", tone: "border-emerald-200 bg-emerald-100 text-emerald-800" },
  { value: "EVENT", label: "Event", tone: "border-blue-200 bg-blue-100 text-blue-800" },
];
const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};
const asRecord = (value: unknown): Record<string, unknown> | undefined => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
const unwrapCalendar = (raw: unknown, year: number): WorkingCalendar => {
  const root = asRecord(raw) ?? {};
  const data = asRecord(root.data) ?? root;
  if (typeof data.startDate !== "string" || typeof data.endDate !== "string" || !Array.isArray(data.workingWeekdays) || !Array.isArray(data.exceptions)) {
    throw new Error("The calendar API returned an invalid response.");
  }
  const exceptions = data.exceptions.flatMap((value): CalendarException[] => {
    const item = asRecord(value);
    if (!item || typeof item.date !== "string" || typeof item.title !== "string" || !["HOLIDAY", "WORKING_DAY", "EVENT"].includes(String(item.type))) return [];
    return [{ date: item.date.slice(0, 10), type: item.type as CalendarExceptionType, title: item.title, ...(typeof item.note === "string" && item.note ? { note: item.note } : {}) }];
  }).sort((a, b) => a.date.localeCompare(b.date));
  return {
    year: Number(data.year) || year,
    startDate: data.startDate.slice(0, 10),
    endDate: data.endDate.slice(0, 10),
    workingWeekdays: data.workingWeekdays.map(Number).filter((day) => Number.isInteger(day) && day >= 1 && day <= 7).sort((a, b) => a - b),
    exceptions,
  };
};
const payloadOf = (plan: WorkingCalendar) => ({
  startDate: plan.startDate,
  endDate: plan.endDate,
  workingWeekdays: [...plan.workingWeekdays].sort((a, b) => a - b),
  exceptions: [...plan.exceptions].sort((a, b) => a.date.localeCompare(b.date)).map(({ date, type, title, note }) => ({ date, type, title, ...(note ? { note } : {}) })),
});
const snapshot = (plan: WorkingCalendar) => JSON.stringify(payloadOf(plan));
const errorMessage = (error: unknown) => {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : error instanceof Error ? error.message : "Could not save the calendar.";
};
const dateLabel = (value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" }) => parseDate(value).toLocaleDateString("en-IN", options);
const typeInfo = (type: CalendarExceptionType) => exceptionTypes.find((item) => item.value === type) ?? exceptionTypes[0];

export default function WorkingCalendar() {
  const user = useSelector((state: RootState) => state.auth.user);
  const canEdit = user?.role === "admin" || user?.role === "super_admin";
  const [year, setYear] = useState(new Date().getFullYear());
  const [plan, setPlan] = useState<WorkingCalendar | null>(null);
  const [savedSnapshot, setSavedSnapshot] = useState("");
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [entryType, setEntryType] = useState<CalendarExceptionType>("HOLIDAY");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const isDirty = Boolean(plan && savedSnapshot && snapshot(plan) !== savedSnapshot);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await getWorkingCalendar(year);
      const next = unwrapCalendar(response.data, year);
      setPlan(next); setSavedSnapshot(snapshot(next));
      const firstMonth = parseDate(next.startDate);
      setMonth(new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1));
      setSelectedDate(""); setDialogOpen(false); setNotice("");
    } catch (cause) {
      setError(errorMessage(cause)); setPlan(null); setSavedSnapshot("");
    } finally { setLoading(false); }
  }, [year]);
  useEffect(() => { void load(); }, [load]);

  const exceptionsByDate = useMemo(() => new Map((plan?.exceptions ?? []).map((item) => [item.date, item])), [plan]);
  const visibleDates = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((offset + count) / 7) * 7 }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index - offset + 1);
      return { date, key: dateString(date), inMonth: date.getMonth() === month.getMonth() };
    });
  }, [month]);

  const openDate = (date: string) => {
    const entry = exceptionsByDate.get(date);
    setSelectedDate(date);
    setEntryType(entry?.type ?? "HOLIDAY");
    setEntryTitle(entry?.title ?? "");
    setEntryNote(entry?.note ?? "");
    setDialogOpen(true); setError("");
  };
  const saveEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan || !entryTitle.trim()) return;
    const entry: CalendarException = { date: selectedDate, type: entryType, title: entryTitle.trim(), ...(entryNote.trim() ? { note: entryNote.trim() } : {}) };
    setPlan({ ...plan, exceptions: [...plan.exceptions.filter((item) => item.date !== selectedDate), entry].sort((a, b) => a.date.localeCompare(b.date)) });
    setDialogOpen(false);
  };
  const removeEntry = () => {
    if (plan) setPlan({ ...plan, exceptions: plan.exceptions.filter((item) => item.date !== selectedDate) });
    setDialogOpen(false);
  };
  const toggleWeekday = (weekday: number) => {
    if (!plan || !canEdit) return;
    setPlan({ ...plan, workingWeekdays: plan.workingWeekdays.includes(weekday) ? plan.workingWeekdays.filter((day) => day !== weekday) : [...plan.workingWeekdays, weekday].sort((a, b) => a - b) });
  };
  const changeYear = (nextYear: number) => {
    if (isDirty && !window.confirm("You have unsaved calendar changes. Discard them and load another year?")) return;
    setYear(nextYear);
  };
  const reload = () => {
    if (isDirty && !window.confirm("Discard unsaved calendar changes and reload the saved calendar?")) return;
    void load();
  };
  const save = async () => {
    if (!plan || !canEdit || !isDirty) return;
    const payload = payloadOf(plan);
    const start = parseDate(payload.startDate);
    const end = parseDate(payload.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      setError("The calendar end date must be on or after its start date."); return;
    }
    if (payload.exceptions.some((item) => item.date < payload.startDate || item.date > payload.endDate)) {
      setError("All calendar entries must fall within the calendar date range."); return;
    }
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await putWorkingCalendar(year, payload);
      const saved = unwrapCalendar(response.data, year);
      setPlan(saved); setSavedSnapshot(snapshot(saved)); setNotice("Working calendar saved.");
      try {
        const refreshed = await getWorkingCalendar(year);
        const freshPlan = unwrapCalendar(refreshed.data, year);
        setPlan(freshPlan); setSavedSnapshot(snapshot(freshPlan));
      } catch (refreshError) {
        setError(`Calendar saved, but refresh failed: ${errorMessage(refreshError)}`);
      }
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setSaving(false); }
  };

  const startDate = plan?.startDate ?? `${year}-01-01`;
  const endDate = plan?.endDate ?? `${year}-12-31`;
  const isInRange = (key: string) => key >= startDate && key <= endDate;
  const selectedEntry = selectedDate ? exceptionsByDate.get(selectedDate) : undefined;

  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><div className="flex items-center gap-2 text-emerald-700"><CalendarDays size={19}/><span className="text-xs font-bold uppercase tracking-wider">Workforce planning</span></div><h1 className="mt-2 text-2xl font-bold text-slate-900">Company working calendar</h1><p className="mt-1 text-sm text-slate-500">Company working days, public holidays, overrides, and events.</p><p className="mt-1 text-xs text-slate-500">{canEdit ? "Changes are shared with staff and managers after saving." : "Read-only calendar for your company."}</p></div>
      <div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="calendar-year">Calendar year</label><select id="calendar-year" value={year} onChange={(event) => changeYear(Number(event.target.value))} disabled={loading || saving} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60">{Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 2 + index).map((value) => <option key={value} value={value}>{value}</option>)}</select>
        {canEdit && <><button type="button" onClick={reload} disabled={loading || saving} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RotateCcw size={15}/>Reload saved</button><button type="button" onClick={() => void save()} disabled={!plan || loading || saving || !isDirty} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"><Save size={16}/>{saving ? "Saving…" : isDirty ? "Save changes" : "Calendar saved"}</button></>}</div>
    </header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
    {canEdit && (isDirty ? <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">You have unsaved calendar changes.</p> : notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>)}
    {loading || !plan ? <div role={loading ? "status" : undefined} className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">{loading ? "Loading working calendar…" : <><p>Calendar could not be loaded.</p><button type="button" onClick={() => void load()} className="mt-3 font-semibold text-emerald-800 underline">Retry</button></>}</div> : <>
      <section className="grid gap-4 lg:grid-cols-[1fr_2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-bold text-slate-900">Calendar year dates</h2><p className="mt-1 text-xs text-slate-500">Choose the range when this calendar applies.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Starts<input type="date" value={plan.startDate} disabled={!canEdit || saving} onChange={(event) => setPlan({ ...plan, startDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50"/></label><label className="text-xs font-semibold text-slate-600">Ends<input type="date" value={plan.endDate} disabled={!canEdit || saving} onChange={(event) => setPlan({ ...plan, endDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50"/></label></div>
          <h2 className="mt-6 font-bold text-slate-900">Regular working days</h2><p className="mt-1 text-xs text-slate-500">ISO weekdays, Monday 1 through Sunday 7.</p><div className="mt-3 flex flex-wrap gap-2">{weekdayLabels.map((day) => { const active = plan.workingWeekdays.includes(day.value); return <button key={day.value} type="button" aria-pressed={active} disabled={!canEdit || saving} onClick={() => toggleWeekday(day.value)} className={`rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-default ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{day.label}</button>; })}</div>
          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{plan.workingWeekdays.length} weekly work days</span><span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">{plan.exceptions.filter((item) => item.type === "HOLIDAY").length} holidays</span><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{plan.exceptions.filter((item) => item.type === "WORKING_DAY").length} working overrides</span><span className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-700">{plan.exceptions.filter((item) => item.type === "EVENT").length} events</span></div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><h2 className="font-bold text-slate-900">Calendar dates</h2><p className="mt-1 text-xs text-slate-500">{dateLabel(plan.startDate, { day: "numeric", month: "short", year: "numeric" })} – {dateLabel(plan.endDate, { day: "numeric", month: "short", year: "numeric" })}</p></div><div className="flex items-center gap-2"><button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))} aria-label="Previous month" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronLeft size={17}/></button><strong className="min-w-32 text-center text-sm text-slate-800">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong><button type="button" onClick={() => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))} aria-label="Next month" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronRight size={17}/></button></div></div>
          <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">{weekdayLabels.map((day) => <div key={day.value} className="py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{day.label}</div>)}{visibleDates.map(({ date, key, inMonth }) => {
            const exception = exceptionsByDate.get(key); const regular = plan.workingWeekdays.includes(date.getDay() || 7);
            const working = exception?.type === "WORKING_DAY" ? true : exception?.type === "HOLIDAY" ? false : regular;
            const tone = exception ? typeInfo(exception.type).tone : working ? "border-emerald-100 bg-emerald-50/60 text-slate-800" : "border-slate-100 bg-slate-50 text-slate-500";
            const status = exception?.type === "HOLIDAY" ? "Holiday · non-working" : exception?.type === "WORKING_DAY" ? "Special working day" : exception?.type === "EVENT" ? `Event · ${working ? "working day" : "non-working day"}` : working ? "Working day" : "Non-working day";
            const disabled = !isInRange(key) || saving;
            return <button key={key} type="button" disabled={disabled} onClick={() => openDate(key)} title={`${status}${exception ? `: ${exception.title}` : ""}`} className={`min-h-[58px] rounded-lg border p-1 text-left transition disabled:cursor-not-allowed disabled:opacity-25 ${!inMonth ? "opacity-40" : ""} ${tone}`}><span className="block text-xs font-bold">{date.getDate()}</span>{exception && <span className="mt-1 block truncate text-[9px] font-semibold">{exception.title}</span>}</button>;
          })}</div>
          <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200"/>Regular working day</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-slate-200"/>Non-working day</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-rose-200"/>Holiday</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-600"/>Special working day</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-blue-200"/>Event</span></div>
        </div>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white"><div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-bold text-slate-900">Calendar exceptions</h2><p className="mt-1 text-xs text-slate-500">Select an entry to view or edit its title, type, and notes.</p></div>{canEdit && <button type="button" disabled={!selectedDate || !isInRange(selectedDate) || saving} onClick={() => openDate(selectedDate)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"><Plus size={15}/>{selectedEntry ? "Edit selected date" : "Add to selected date"}</button>}</div><div className="divide-y divide-slate-100">{plan.exceptions.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No holidays or events are configured for this year.</p> : plan.exceptions.map((entry) => <div key={entry.date} className="flex items-center gap-3 p-4 sm:px-5"><button type="button" onClick={() => openDate(entry.date)} className="min-w-0 flex-1 text-left"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${typeInfo(entry.type).tone}`}>{typeInfo(entry.type).label}</span><p className="mt-2 text-sm font-semibold text-slate-800">{entry.title}</p><p className="text-xs text-slate-500">{dateLabel(entry.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}{entry.note ? ` · ${entry.note}` : ""}</p></button>{canEdit && <button type="button" onClick={() => setPlan({ ...plan, exceptions: plan.exceptions.filter((item) => item.date !== entry.date) })} aria-label={`Remove ${entry.title}`} title="Remove calendar exception" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16}/></button>}</div>)}</div></section>
    </>}
    {dialogOpen && createPortal(<div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialogOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="calendar-entry-title" className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl"><header className="mb-4 flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{selectedEntry ? typeInfo(selectedEntry.type).label : "Calendar date"}</p><h2 id="calendar-entry-title" className="mt-1 text-lg font-bold text-slate-900">{dateLabel(selectedDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2></div><button type="button" aria-label="Close" onClick={() => setDialogOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={19}/></button></header>
      {canEdit ? <form onSubmit={saveEntry} className="space-y-4"><label className="block text-sm font-semibold text-slate-700">Type<select value={entryType} onChange={(event) => setEntryType(event.target.value as CalendarExceptionType)} disabled={saving} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="HOLIDAY">Holiday</option><option value="WORKING_DAY">Special working day</option><option value="EVENT">Event</option></select></label><label className="block text-sm font-semibold text-slate-700">Title<input autoFocus required maxLength={120} value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} disabled={saving} placeholder="e.g. Republic Day" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"/></label><label className="block text-sm font-semibold text-slate-700">Note <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={500} rows={3} value={entryNote} onChange={(event) => setEntryNote(event.target.value)} disabled={saving} placeholder="Add details for staff" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"/></label><div className="flex justify-between gap-2 border-t border-slate-100 pt-4"><button type="button" disabled={!selectedEntry || saving} onClick={removeEntry} className="rounded-lg border border-rose-200 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-40">Remove</button><div className="flex gap-2"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" disabled={saving} className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">{selectedEntry ? "Save entry" : "Add entry"}</button></div></div></form> : <div className="space-y-3">{selectedEntry ? <><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${typeInfo(selectedEntry.type).tone}`}>{typeInfo(selectedEntry.type).label}</span><p className="text-base font-semibold text-slate-800">{selectedEntry.title}</p>{selectedEntry.note && <p className="whitespace-pre-wrap text-sm text-slate-600">{selectedEntry.note}</p>}</> : <p className="text-sm text-slate-600">{plan?.workingWeekdays.includes(parseDate(selectedDate).getDay() || 7) ? "Regular working day" : "Non-working day"}</p>}<div className="flex justify-end border-t border-slate-100 pt-4"><button type="button" onClick={() => setDialogOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Close</button></div></div>}
    </section></div>, document.body)}
  </div>;
}
