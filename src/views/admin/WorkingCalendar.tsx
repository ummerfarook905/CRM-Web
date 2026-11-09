import { CalendarDays, ChevronLeft, ChevronRight, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { api } from "../../api/axios";

type EntryType = "HOLIDAY" | "WORKING_DAY" | "EVENT";
interface CalendarException {
  date: string;
  type: EntryType;
  title: string;
  note?: string;
}
interface CalendarPlan {
  year: number;
  startDate: string;
  endDate: string;
  workingWeekdays: number[];
  exceptions: CalendarException[];
}
const weekdayLabels = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;
const entryColors: Record<EntryType, string> = {
  HOLIDAY: "bg-rose-100 text-rose-800 border-rose-200",
  WORKING_DAY: "bg-emerald-100 text-emerald-800 border-emerald-200",
  EVENT: "bg-blue-100 text-blue-800 border-blue-200",
};
const entryLabels: Record<EntryType, string> = {
  HOLIDAY: "Holiday",
  WORKING_DAY: "Special working day",
  EVENT: "Event",
};
const dateString = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};
const asRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
const unwrapPlan = (raw: unknown): CalendarPlan => {
  const root = asRecord(raw) ?? {};
  const first = asRecord(root.data) ?? root;
  const candidate = asRecord(first.calendar) ?? first;
  if (!candidate.year || !Array.isArray(candidate.workingWeekdays) || !Array.isArray(candidate.exceptions)) {
    throw new Error("The calendar API returned an invalid response.");
  }
  return candidate as unknown as CalendarPlan;
};
const getMessage = (error: unknown) => {
  const response = (error as { response?: { data?: { message?: unknown } } })?.response;
  const message = response?.data?.message;
  return Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : error instanceof Error ? error.message : "Could not save the calendar.";
};

export default function WorkingCalendar() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [plan, setPlan] = useState<CalendarPlan | null>(null);
  const [month, setMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState("");
  const [entryFormOpen, setEntryFormOpen] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>("HOLIDAY");
  const [entryTitle, setEntryTitle] = useState("");
  const [entryNote, setEntryNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/working-calendar/${year}`);
      const next = unwrapPlan(response.data);
      setPlan(next);
      const firstMonth = parseLocalDate(next.startDate);
      setMonth(new Date(firstMonth.getFullYear(), firstMonth.getMonth(), 1));
    } catch (loadError) {
      setError(getMessage(loadError));
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { void load(); }, [load]);

  const entriesByDate = useMemo(
    () => new Map((plan?.exceptions ?? []).map((entry) => [entry.date, entry])),
    [plan],
  );

  const visibleDates = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const mondayOffset = (first.getDay() + 6) % 7;
    const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    return Array.from({ length: Math.ceil((mondayOffset + count) / 7) * 7 }, (_, index) => {
      const date = new Date(month.getFullYear(), month.getMonth(), index - mondayOffset + 1);
      return { date, key: dateString(date), inMonth: date.getMonth() === month.getMonth() };
    });
  }, [month]);

  const previousMonth = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  const nextMonth = () => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  const toggleWeekday = (weekday: number) => {
    if (!plan) return;
    setPlan({
      ...plan,
      workingWeekdays: plan.workingWeekdays.includes(weekday)
        ? plan.workingWeekdays.filter((day) => day !== weekday)
        : [...plan.workingWeekdays, weekday].sort((a, b) => a - b),
    });
  };
  const openEntryForm = (date: string) => {
    setSelectedDate(date);
    const existing = entriesByDate.get(date);
    setEntryType(existing?.type ?? "HOLIDAY");
    setEntryTitle(existing?.title ?? "");
    setEntryNote(existing?.note ?? "");
    setEntryFormOpen(true);
    setError("");
  };
  const saveEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plan || !entryTitle.trim()) return;
    const entry: CalendarException = {
      date: selectedDate,
      type: entryType,
      title: entryTitle.trim(),
      ...(entryNote.trim() ? { note: entryNote.trim() } : {}),
    };
    setPlan({
      ...plan,
      exceptions: [...plan.exceptions.filter((item) => item.date !== selectedDate), entry].sort((a, b) => a.date.localeCompare(b.date)),
    });
    setEntryFormOpen(false);
  };
  const removeEntry = (date: string) => {
    if (plan) setPlan({ ...plan, exceptions: plan.exceptions.filter((item) => item.date !== date) });
  };

  const save = async () => {
    if (!plan) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await api.put(`/working-calendar/${year}`, plan);
      setPlan(unwrapPlan(response.data));
      setNotice("Academic working calendar saved.");
    } catch (saveError) {
      setError(getMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  const startDate = plan ? parseLocalDate(plan.startDate) : new Date(year, 0, 1);
  const endDate = plan ? parseLocalDate(plan.endDate) : new Date(year, 11, 31);
  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) : undefined;
  const inPlan = (key: string) => Boolean(plan && key >= plan.startDate && key <= plan.endDate);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-emerald-700"><CalendarDays size={19}/><span className="text-xs font-bold uppercase tracking-wider">Workforce planning</span></div>
          <h1 className="mt-2 text-2xl font-bold text-slate-900">Academic working calendar</h1>
          <p className="mt-1 text-sm text-slate-500">Set the working week and mark holidays, special work days, and events.</p>
        </div>
        <div className="flex gap-2">
          <label className="sr-only" htmlFor="calendar-year">Academic year starts in</label>
          <select id="calendar-year" value={year} onChange={(event) => setYear(Number(event.target.value))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            {Array.from({ length: 11 }, (_, index) => new Date().getFullYear() - 2 + index).map((value) => <option key={value} value={value}>{value}–{String(value + 1).slice(-2)}</option>)}
          </select>
          <button type="button" onClick={() => void save()} disabled={!plan || loading || saving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">
            <Save size={16}/>{saving ? "Saving…" : "Save calendar"}
          </button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      {loading || !plan ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-16 text-center text-sm text-slate-500">{loading ? "Loading working calendar…" : "Calendar could not be loaded."}</div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-900">Academic year dates</h2>
              <p className="mt-1 text-xs text-slate-500">Choose a year range of up to 400 days.</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">Starts<input type="date" value={plan.startDate} onChange={(event) => setPlan({ ...plan, startDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"/></label>
                <label className="text-xs font-semibold text-slate-600">Ends<input type="date" value={plan.endDate} onChange={(event) => setPlan({ ...plan, endDate: event.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800"/></label>
              </div>
              <h2 className="mt-6 font-bold text-slate-900">Regular working days</h2>
              <p className="mt-1 text-xs text-slate-500">Date entries can override the weekly pattern.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {weekdayLabels.map((day) => {
                  const active = plan.workingWeekdays.includes(day.value);
                  return <button key={day.value} type="button" aria-pressed={active} onClick={() => toggleWeekday(day.value)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${active ? "border-emerald-700 bg-emerald-700 text-white" : "border-slate-200 bg-white text-slate-600"}`}>{day.label}</button>;
                })}
              </div>
              <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-semibold">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{plan.workingWeekdays.length} weekly work days</span>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 text-rose-700">{plan.exceptions.filter((item) => item.type === "HOLIDAY").length} holidays</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800">{plan.exceptions.filter((item) => item.type === "WORKING_DAY").length} special work days</span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div><h2 className="font-bold text-slate-900">Calendar dates</h2><p className="mt-1 text-xs text-slate-500">{startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – {endDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                <div className="flex items-center gap-2"><button type="button" onClick={previousMonth} aria-label="Previous month" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronLeft size={17}/></button><strong className="min-w-32 text-center text-sm text-slate-800">{month.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</strong><button type="button" onClick={nextMonth} aria-label="Next month" className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"><ChevronRight size={17}/></button></div>
              </div>
              <div className="mt-5 grid grid-cols-7 gap-1.5 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => <div key={day} className="py-2 text-[10px] font-bold uppercase tracking-wide text-slate-400">{day}</div>)}
                {visibleDates.map(({ date, key, inMonth }) => {
                  const event = entriesByDate.get(key);
                  const active = inPlan(key);
                  const isRegular = plan.workingWeekdays.includes(date.getDay() || 7);
                  const working = event?.type === "HOLIDAY" ? false : event?.type === "WORKING_DAY" ? true : isRegular;
                  const chosen = selectedDate === key;
                  return <button key={key} type="button" disabled={!active} onClick={() => setSelectedDate(key)} title={event ? `${eventLabels(event.type)}: ${event.title}` : working ? "Working day" : "Non-working day"} className={`min-h-[58px] rounded-lg border p-1 text-left transition disabled:cursor-not-allowed disabled:opacity-25 ${!inMonth ? "opacity-40" : ""} ${chosen ? "ring-2 ring-emerald-600" : ""} ${event ? entryColors[event.type] : working ? "border-emerald-100 bg-emerald-50/60 text-slate-800 hover:bg-emerald-100" : "border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
                    <span className="block text-xs font-bold">{date.getDate()}</span>
                    {event && <span className="mt-1 block truncate text-[9px] font-semibold">{event.title}</span>}
                  </button>;
                })}
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-[10px] font-semibold text-slate-500"><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-200"/>Working day</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-rose-200"/>Holiday</span><span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-blue-200"/>Event</span></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><h2 className="font-bold text-slate-900">Date entries</h2><p className="mt-1 text-xs text-slate-500">Add holidays, one-off working days, and academic events.</p></div>
              <button type="button" disabled={!selectedDate || !inPlan(selectedDate)} onClick={() => openEntryForm(selectedDate)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-50 disabled:opacity-40"><Plus size={15}/>{selectedEntry ? "Edit selected date" : "Add to selected date"}</button>
            </div>
            <div className="divide-y divide-slate-100">
              {plan.exceptions.length === 0 ? <p className="p-8 text-center text-sm text-slate-500">No holidays or special dates added for this academic year.</p> : plan.exceptions.map((entry) => <div key={entry.date} className="flex items-center gap-3 p-4 sm:px-5"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${entryColors[entry.type]}`}>{entryLabels[entry.type]}</span><div className="min-w-0 flex-1"><p className="text-sm font-semibold text-slate-800">{entry.title}</p><p className="text-xs text-slate-500">{parseLocalDate(entry.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}{entry.note ? ` · ${entry.note}` : ""}</p></div><button type="button" onClick={() => removeEntry(entry.date)} aria-label={`Remove ${entry.title}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16}/></button></div>)}
            </div>
          </section>
        </>
      )}

      {entryFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setEntryFormOpen(false); }}>
          <form onSubmit={saveEntry} role="dialog" aria-modal="true" aria-labelledby="calendar-entry-title" className="w-full max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-2xl">
            <div><h2 id="calendar-entry-title" className="text-lg font-bold text-slate-900">{selectedEntry ? "Edit date entry" : "Add date entry"}</h2><p className="mt-1 text-sm text-slate-500">{parseLocalDate(selectedDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p></div>
            <label className="block text-sm font-semibold text-slate-700">Entry type<select value={entryType} onChange={(event) => setEntryType(event.target.value as EntryType)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"><option value="HOLIDAY">Holiday</option><option value="WORKING_DAY">Special working day</option><option value="EVENT">Event / note</option></select></label>
            <label className="block text-sm font-semibold text-slate-700">Title<input autoFocus required maxLength={120} value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} placeholder="e.g. Diwali holiday" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"/></label>
            <label className="block text-sm font-semibold text-slate-700">Notes <span className="font-normal text-slate-400">(optional)</span><textarea maxLength={500} rows={3} value={entryNote} onChange={(event) => setEntryNote(event.target.value)} placeholder="Add details for staff" className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5"/></label>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setEntryFormOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Cancel</button><button type="submit" className="rounded-lg bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Save date</button></div>
          </form>
        </div>
      )}
    </div>
  );
}

function eventLabels(type: EntryType) {
  return entryLabels[type];
}
