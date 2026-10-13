
import {
  LayoutDashboard,
  PanelsTopLeft,
  ClipboardList,
  UsersRound,
  MapPin,
  Clock,
  Building2,
  Factory,
  ShieldCheck,
  Camera,
  FileText,
  ReceiptText,
  Settings2,
  LogOut,
  Menu,
  X,
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

export default function AdminSideNav() {
  const [mobileOpen, setMobileOpen] = useState(false);
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
        className={`fixed left-0 top-0 z-50 flex h-screen w-[250px] max-w-[85vw] flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-100 px-5">
          <div>
            <h1 className="text-lg font-extrabold tracking-wide text-slate-900">
              ADMIN
            </h1>
            <p className="text-[11px] font-medium text-slate-500">
              Operations Management
            </p>
          </div>

          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navSections.map((section) => (
            <div key={section.title} className="mb-3">
              <h2 className="mb-1.5 px-3 pt-1 text-[11px] font-extrabold tracking-wide text-[#78817d]">
                {section.title}
              </h2>

              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={({ isActive }) =>
                        `flex min-h-[38px] items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-bold leading-5 transition-colors duration-150 ${
                          isActive
                            ? "bg-[#103f31] text-white"
                            : "text-[#414945] hover:bg-slate-100 hover:text-slate-900"
                        }`
                      }
                    >
                      <Icon
                        size={17}
                        strokeWidth={2.2}
                        className="shrink-0"
                      />

                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="shrink-0 border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-50"
          >
            <LogOut size={17} strokeWidth={2} />
            <span>Logout</span>
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
