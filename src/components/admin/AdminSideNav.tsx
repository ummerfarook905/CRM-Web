
import {
  LayoutDashboard,
  PanelsTopLeft,
  ClipboardList,
  UsersRound,
  MapPin,
  Clock,
  Building2,
  Camera,
  ReceiptText,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Wrench,
} from "lucide-react";

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthViewModel from "../../viewmodels/auth/AuthViewModel";

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface AdminSideNavProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function AdminSideNav({
  collapsed = false,
  onToggle,
}: AdminSideNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuSearch, setMenuSearch] = useState("");
  const navigate = useNavigate();

  const navSections: NavSection[] = [
    {
      title: "MAIN OPERATIONS",
      items: [
        {
          name: "Dashboard (Overview)",
          path: "/admin/dashboard",
          icon: LayoutDashboard,
        },
        {
          name: "Service Requests & Bookings",
          path: "/admin/Services",
          icon: PanelsTopLeft,
        },
        {
          name: "Work Orders & Enquiries",
          path: "/admin/Enquiries",
          icon: ClipboardList,
        },
      ],
    },
    {
      title: "WORKFORCE",
      items: [
        {
          name: "Technician Roster",
          path: "/admin/Employees",
          icon: UsersRound,
        },
        {
          name: "Attendance",
          path: "/admin/Attendance",
          icon: MapPin,
        },
        {
          name: "Overtime Management",
          path: "/admin/Overtime",
          icon: Clock,
        },
      ],
    },
    {
      title: "CLIENTS & SITES",
      items: [
        {
          name: "Client Directory",
          path: "/admin/customers",
          icon: Building2,
        },
      ],
    },
    {
      title: "REPORTS & OPS",
      items: [
        {
          name: "Field Photo Verification",
          path: "/admin/WorkVerification",
          icon: Camera,
        },
        {
          name: "Work Monitoring",
          path: "/admin/WorkMonitoring",
          icon: ReceiptText,
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
      {mobileOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen max-w-[85vw] flex-col border-r border-emerald-950/10 bg-gradient-to-b from-[#11856a] via-[#08735e] to-[#075747] text-white shadow-xl transition-all duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20 lg:w-20" : "w-[280px] lg:w-[280px]"}`}
      >
        {/* Logo */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/15 px-4">
          {!collapsed && (
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 text-white shadow-inner">
                <Wrench size={20} />
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-[17px] font-bold tracking-wide text-white">Service CRM</h1>
                <p className="text-[11px] font-medium text-emerald-100/80">Operations suite</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            className="hidden rounded-lg p-2 text-emerald-50 transition hover:bg-white/15 lg:inline-flex"
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
            className="rounded-md p-1.5 text-white hover:bg-white/15 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <div className={`px-3 pt-4 ${collapsed ? "hidden" : ""}`}>
          <label className="relative block">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-100/70" />
            <input
              value={menuSearch}
              onChange={(event) => setMenuSearch(event.target.value)}
              placeholder="Search menu…"
              aria-label="Search navigation menu"
              className="h-9 w-full rounded-xl border border-white/20 bg-white/10 pl-9 pr-3 text-xs text-white placeholder:text-emerald-100/65 outline-none focus:border-white/50 focus:bg-white/15"
            />
          </label>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section) => {
            const items = section.items.filter((item) => item.name.toLowerCase().includes(menuSearch.trim().toLowerCase()));
            if (items.length === 0) return null;
            return (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <h2 className="mb-1.5 px-3 pt-1 text-[10px] font-bold tracking-[0.14em] text-emerald-100/70">
                  {section.title}
                </h2>
              )}

              <div className="space-y-0.5">
                {items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      title={collapsed ? item.name : undefined}
                      className={({ isActive }) =>
                        `book-menu-link flex min-h-[42px] items-center gap-3 rounded-xl border px-3 py-2 text-[13px] font-medium leading-5 transition-all duration-150 ${
                          collapsed ? "justify-center px-2" : ""
                        } ${
                          isActive
                            ? "border-white/35 bg-white text-emerald-900 shadow-lg shadow-emerald-950/10"
                            : "border-transparent text-emerald-50/90 hover:border-white/15 hover:bg-white/10 hover:text-white"
                        }`
                      }
                    >
                      <Icon
                        size={17}
                        strokeWidth={2.2}
                        className="shrink-0"
                      />

                      {!collapsed && <span>{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-white/15 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-2.5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            <LogOut size={17} strokeWidth={2} />
            {!collapsed && <span>Logout</span>}
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
