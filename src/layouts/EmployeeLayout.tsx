import { LogOut, ReceiptText } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import AuthViewModel from "../viewmodels/auth/AuthViewModel";

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const logout = () => { AuthViewModel.logout(); navigate("/login", { replace: true }); };
  return <div className="min-h-screen bg-[#f1f4f8]"><header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 shadow-sm"><div className="flex items-center gap-2 font-bold text-slate-900"><ReceiptText className="text-emerald-700" size={20}/>Employee Portal</div><button onClick={logout} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"><LogOut size={16}/>Sign out</button></header><main className="mx-auto max-w-6xl px-4 py-8 sm:px-6"><Outlet/></main></div>;
}
