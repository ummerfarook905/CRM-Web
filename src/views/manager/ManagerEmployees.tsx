import { useEffect, useMemo, useState } from "react";
import { Search, UsersRound } from "lucide-react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchEmployees } from "../../services/EmployeesSlice";

export default function ManagerEmployees() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.employees);
  const [query, setQuery] = useState("");
  useEffect(() => { void dispatch(fetchEmployees()); }, [dispatch]);
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return items;
    return items.filter((item) => [item.name, item.employeeNo, item.email, item.designation].some((value) => value.toLowerCase().includes(search)));
  }, [items, query]);

  return <div className="space-y-5">
    <header><p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Workforce / Team</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Assigned employees</h1><p className="mt-2 text-sm text-slate-500">Employee records available to your manager account.</p></header>
    {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Could not load assigned employees: {error}</p>}
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4"><div className="flex items-center gap-2"><UsersRound size={18} className="text-emerald-700"/><h2 className="font-bold text-slate-900">Team directory</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{visible.length}</span></div><label className="relative block w-full sm:max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search employees…" aria-label="Search assigned employees" className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"/></label></div>
      {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading employees…</p> : visible.length === 0 ? <div className="p-10 text-center"><p className="font-semibold text-slate-700">No employees found</p><p className="mt-1 text-sm text-slate-500">No assigned employees match this search.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Designation</th><th className="px-5 py-3">Contact</th><th className="px-5 py-3">Joined</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((employee) => <tr key={employee.id}><td className="px-5 py-4"><p className="font-semibold text-slate-800">{employee.name || "Employee"}</p><p className="mt-1 text-xs text-slate-500">{employee.employeeNo || employee.id}</p></td><td className="px-5 py-4 text-slate-700">{employee.designation || "—"}</td><td className="px-5 py-4"><p className="text-slate-700">{employee.email || "—"}</p><p className="mt-1 text-xs text-slate-500">{employee.phone || ""}</p></td><td className="px-5 py-4 text-slate-600">{employee.joiningDate || "—"}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${employee.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{employee.status}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}
