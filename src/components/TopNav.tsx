import {
  Bell,
  ChevronDown,
  HelpCircle,
  Menu,
  Plus,
  Search,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TopNavProps {
  role: "admin" | "manager";
  onMenuClick?: () => void;
}

export default function TopNav({
  role,
  onMenuClick,
}: TopNavProps) {
  const navigate = useNavigate();

  const user =
    role === "admin"
      ? {
          name: "Admin User",
          email: "admin@example.com",
          role: "Administrator",
        }
      : {
          name: "Manager User",
          email: "manager@example.com",
          role: "Manager",
        };

  return (
    <header className="fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-200 bg-white lg:left-64">
      <div className="flex h-full items-center gap-3 px-3 sm:px-5">

        {/* Mobile Menu */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={21} />
        </button>

        {/* Search */}
        <div className="relative hidden flex-1 md:block md:max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            type="text"
            placeholder="Search person, ticket, technician, parts..."
            className="h-9 w-full rounded-md border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white"
          />
        </div>

        {/* Mobile Search */}
        <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden">
          <Search size={19} />
        </button>

        {/* Location */}
        <button className="hidden items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 lg:flex">
          <span className="text-slate-400">
            ◉
          </span>

          Kottayam HO Operations

          <ChevronDown size={14} />
        </button>

        {/* New Work Order */}
        <button
          onClick={() => navigate(
            role === "admin"
              ? "/admin/work-orders"
              : "/manager/work-orders"
          )}
          className="hidden items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:flex"
        >
          <Plus size={15} />
          New Work Order
        </button>

        {/* Notification */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={18} />

          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Help */}
        <button className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 sm:block">
          <HelpCircle size={18} />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-3">

          <div className="hidden text-right sm:block">
            <p className="text-xs font-semibold text-slate-800">
              {user.name}
            </p>

            <p className="text-[10px] text-slate-500">
              {user.role}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
            {user.name.charAt(0)}
          </div>

          <ChevronDown
            size={14}
            className="hidden text-slate-400 sm:block"
          />

        </div>

      </div>
    </header>
  );
}