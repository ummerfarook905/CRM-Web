
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  FileCheck2,
  FileText,
  ReceiptText,
  LogOut,
  Menu,
  Building2,
  PanelsTopLeft,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  ChevronRight,
  ChevronDown,
  UsersRound,
  UserRoundPlus,
} from "lucide-react";

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthViewModel from "../../viewmodels/auth/AuthViewModel";
import BrandLogo from "../BrandLogo";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  icon: React.ElementType;
  items: NavItem[];
}

interface ManagerSideNavProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function ManagerSideNav({
  collapsed = false,
  onToggle,
}: ManagerSideNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const navigate = useNavigate();

  const navSections: NavSection[] = [
    {
      title: "OPERATIONS OVERVIEW",
      icon: LayoutDashboard,
      items: [
        {
          name: "Dashboard (Overview)",
          path: "/manager/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Work Orders & Enquiries",
          path: "/manager/Enquiries1",
          icon: ClipboardList,
        },
        {
          name: "Client Directory",
          path: "/manager/Client Directory",
          icon: Building2,
        },
        {
          name: "Service Requests & Bookings",
          path: "/manager/ServiceManagement",
          icon: PanelsTopLeft,
        },
        {
          name: "Expense Claims",
          path: "/manager/Expenses",
          icon: ReceiptText,
        },
      ],
    },
    {
      title: "FIELD OPERATIONS MANAGER",
      icon: UsersRound,
      items: [
        {
          name: "Employee Management",
          path: "/manager/Employees",
          icon: UserRoundPlus,
        },
        {
          name: "Technician Work Assignment",
          path: "/manager/WorkAssignment",
          icon: ClipboardList,
        },
        {
          name: "Overtime Management",
          path: "/manager/Overtime1",
          icon: Clock,
        },
        
        {
          name: "Work Monitoring",
          path: "/manager/WorkMonitoring",
          icon: FileText,
        },

        {
          name: "Service Report Review",
          path: "/manager/WorkVerification",
          icon: FileCheck2,
        },
      ],
    },
  ];

  const handleLogout = () => {
    AuthViewModel.logout();
    navigate("/login", { replace: true });
  };

  const closeMobileMenu = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen max-w-[85vw] flex-col border-l-4 border-l-emerald-600 border-r border-white/80 bg-white/90 text-slate-900 shadow-[0_20px_60px_rgba(15,23,42,0.14)] backdrop-blur-2xl transition-all duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20 lg:w-20" : "w-[280px] lg:w-[280px]"}`}
      >
        {/* Header */}
        <div className="flex h-[88px] shrink-0 items-center justify-between border-b border-slate-200/80 px-4">
          <BrandLogo collapsed={collapsed} />

          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-xl border border-slate-200 bg-white/70 p-2.5 text-slate-500 shadow-sm transition hover:bg-white lg:inline-flex"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand" : "Collapse"}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} />
            ) : (
              <PanelLeftClose size={18} />
            )}
          </button>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        <div className={`px-4 pt-4 ${collapsed ? "hidden" : ""}`}>
          <label className="relative block">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search menu…" aria-label="Search navigation menu" className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/80 pl-11 pr-16 text-sm text-slate-800 placeholder:text-slate-400 outline-none focus:border-emerald-400 focus:bg-white" />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-500">⌘ K</span>
          </label>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 py-5">
          {navSections.map((section) => {
            const items = section.items.filter((item) => item.name.toLowerCase().includes(menuSearch.trim().toLowerCase()));
            if (items.length === 0) return null;
            const SectionIcon = section.icon;
            return (
              <div key={section.title} className="mb-5">
                {!collapsed && <div className="mb-2 flex items-center justify-between px-2 pt-1">
                  <h2 className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.14em] text-slate-500"><SectionIcon size={17} strokeWidth={2.5} />{section.title}</h2>
                  <ChevronDown size={16} className="text-slate-500" />
                </div>}
                <div className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink key={item.path} to={item.path} onClick={closeMobileMenu} title={collapsed ? item.name : undefined}
                        style={({ isActive }) => isActive ? { background: "linear-gradient(100deg, #11856a 0%, #08735e 100%)", color: "#fff", borderColor: "rgba(16, 185, 129, 0.45)" } : undefined}
                        className={({ isActive }) => `book-menu-link flex min-h-[54px] items-center gap-3 rounded-2xl border px-2.5 py-2 text-[13px] font-semibold leading-5 transition-all duration-150 ${collapsed ? "justify-center px-2" : ""} ${isActive ? "border-emerald-500/30 text-white shadow-lg shadow-emerald-800/20" : "border-transparent text-slate-800 hover:border-slate-200 hover:bg-white/80"}`}>
                        {({ isActive }) => <>
                          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${isActive ? "bg-white/15 text-white" : "bg-emerald-50 text-emerald-700"}`}><Icon size={19} strokeWidth={2.2} /></span>
                          {!collapsed && <span>{item.name}</span>}
                          {!collapsed && <ChevronRight size={18} className={`ml-auto shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />}
                        </>}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-slate-200/80 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            <LogOut size={19} strokeWidth={2} className="text-slate-500" />
            {!collapsed && <span>Logout</span>}
            {!collapsed && <ChevronRight size={18} className="ml-auto text-slate-500" />}
          </button>
        </div>
      </aside>

      {/* Mobile menu button */}
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="fixed left-3 top-3 z-[60] flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-md lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}
