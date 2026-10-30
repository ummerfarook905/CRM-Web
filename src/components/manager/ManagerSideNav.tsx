
import {
  LayoutDashboard,
  ClipboardList,
  Clock,
  Camera,
  FileText,
  LogOut,
  Menu,
  Building2,
  PanelsTopLeft,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import AuthViewModel from "../../viewmodels/auth/AuthViewModel";

interface NavItem {
  name: string;
  path: string;
  icon?: React.ElementType;
}

interface NavSection {
  title: string;
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
  const navigate = useNavigate();

  const navSections: NavSection[] = [
    {
      title: "OPERATIONS OVERVIEW",
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
      ],
    },
    {
      title: "FIELD OPERATIONS MANAGER",
      items: [
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
          name: "Field Photo Verification",
          path: "/manager/WorkVerification",
          icon: Camera,
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
        className={`fixed left-0 top-0 z-50 flex h-screen max-w-[85vw] flex-col border-r border-emerald-950/10 bg-gradient-to-b from-[#11856a] via-[#08735e] to-[#075747] text-white shadow-xl transition-all duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } ${collapsed ? "w-20 lg:w-20" : "w-[280px] lg:w-[280px]"}`}
      >
        {/* Header */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/15 px-4">
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-wide text-white">
                MANAGER
              </h1>
              <p className="text-[11px] font-medium text-emerald-100/80">
                Field operations
              </p>
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
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-3">
              {!collapsed && (
                <h2 className="mb-1.5 px-3 pt-1 text-[10px] font-bold tracking-[0.14em] text-emerald-100/70">
                  {section.title}
                </h2>
              )}

              <div className="space-y-0.5">
                {section.items.map((item) => {
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
                      {Icon && (
                        <Icon
                          size={17}
                          strokeWidth={2.2}
                          className="shrink-0"
                        />
                      )}

                      {!collapsed && <span>{item.name}</span>}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
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
