import {
  BarChart3,
  ClipboardList,
  FileCheck,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
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

export default function AdminSideNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigate = useNavigate();

  // =====================================================
  // NAVIGATION ITEMS
  // =====================================================

  const navItems: NavItem[] = [
    {
      name: "Dashboard (Overview)",
      path: "/admin/dashboard",
      icon: LayoutDashboard,
    },

    {
      name: "Customers",
      path: "/admin/customers",
      icon: ClipboardList,
    },

    {
      name: "Work Orders & Field Work",
      path: "/admin/work-orders",
      icon: FileCheck,
    },

    {
      name: "Technician Roster",
      path: "/admin/technicians",
      icon: Users,
    },

    {
      name: "Attendance & GPS",
      path: "/admin/attendance",
      icon: BarChart3,
    },

    {
      name: "Overtime Management",
      path: "/admin/overtime",
      icon: FileText,
    },

    {
      name: "Client Directory",
      path: "/admin/clients",
      icon: Users,
    },

    {
      name: "Water Treatment Plants",
      path: "/admin/plants",
      icon: FileText,
    },

    {
      name: "Contracts & AMC",
      path: "/admin/contracts",
      icon: FileCheck,
    },

    {
      name: "Field Photo Verification",
      path: "/admin/photo-verification",
      icon: FileCheck,
    },

    {
      name: "Service Reports & QA",
      path: "/admin/service-reports",
      icon: FileText,
    },

    {
      name: "Invoicing & Financials",
      path: "/admin/invoices",
      icon: BarChart3,
    },

    {
      name: "System Settings",
      path: "/admin/settings",
      icon: Settings,
    },
  ];

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    AuthViewModel.logout();

    navigate("/login", {
      replace: true,
    });
  };

  // =====================================================
  // CLOSE MOBILE MENU
  // =====================================================

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  return (
    <>
      {/* ================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================================= */}

      {mobileOpen && (
        <div
          onClick={closeMobileMenu}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          w-64
          flex-col
          border-r
          border-slate-200
          bg-white
          transition-transform
          duration-300
          ease-in-out
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* ================================================= */}
        {/* LOGO */}
        {/* ================================================= */}

        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-5">

          <div>
            <h1 className="text-lg font-bold tracking-wide text-slate-900">
              ADMIN
            </h1>

            <p className="text-[10px] text-slate-500">
              Operations Management
            </p>
          </div>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={closeMobileMenu}
            className="rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 lg:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>

        </div>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <nav className="flex-1 overflow-y-auto px-3 py-4">

          <div className="space-y-0.5">

            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `
                    flex
                    items-center
                    gap-2.5
                    rounded-md
                    px-2.5
                    py-2
                    text-[11px]
                    font-medium
                    transition-all
                    duration-150
                    ${
                      isActive
                        ? "bg-emerald-800 text-white shadow-sm"
                        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }
                    `
                  }
                >
                  <Icon
                    size={14}
                    strokeWidth={1.8}
                    className="shrink-0"
                  />

                  <span className="truncate">
                    {item.name}
                  </span>
                </NavLink>
              );
            })}

          </div>

        </nav>

        {/* ================================================= */}
        {/* LOGOUT */}
        {/* ================================================= */}

        <div className="shrink-0 border-t border-slate-200 p-3">

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-xs font-medium text-red-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut
              size={15}
              strokeWidth={1.8}
            />

            <span>
              Logout
            </span>
          </button>

        </div>

      </aside>

      {/* ================================================= */}
      {/* MOBILE MENU BUTTON */}
      {/* ================================================= */}

      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="
            fixed
            left-3
            top-3
            z-[60]
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-md
            border
            border-slate-200
            bg-white
            text-slate-700
            shadow-md
            transition
            hover:bg-slate-50
            lg:hidden
          "
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      )}
    </>
  );
}