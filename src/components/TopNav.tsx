
import { useState } from "react";
import {
  Bell,
  HelpCircle,
  Menu,
  Plus,
  Search,
  UserRound,
  Pencil,
  X,
  Mail,
  ShieldCheck,
  Save,
  ChevronDown,
  Clock3,
  LogIn,
  LogOut,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthViewModel from "../viewmodels/auth/AuthViewModel";

interface TopNavProps {
  role: "admin" | "manager";
  onMenuClick?: () => void;
  collapsed?: boolean;
}

type ProfileMode = "view" | "edit" | null;

export default function TopNav({
  role,
  onMenuClick,
  collapsed = false,
}: TopNavProps) {
  const navigate = useNavigate();

  const user = AuthViewModel.getCurrentUser();

  const initialName =
    (user as any)?.name ??
    (user as any)?.fullName ??
    (user as any)?.username ??
    (role === "admin" ? "Admin User" : "Manager User");

  const initialEmail =
    (user as any)?.email ??
    (role === "admin"
      ? "admin@example.com"
      : "manager@example.com");

  const userRole =
    role === "admin" ? "Administrator" : "Manager";

  const [profileMode, setProfileMode] =
    useState<ProfileMode>(null);

  const [name, setName] = useState<string>(initialName);
  const [email, setEmail] = useState<string>(initialEmail);

  const [editName, setEditName] = useState<string>(initialName);
  const [editEmail, setEditEmail] = useState<string>(initialEmail);

  // Manager dropdown
  const [managerMenuOpen, setManagerMenuOpen] = useState(false);

  // Demo attendance state: resets on page refresh
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  const openProfile = (mode: "view" | "edit") => {
    setEditName(name);
    setEditEmail(email);
    setProfileMode(mode);
    setManagerMenuOpen(false);
  };

  const closeProfile = () => {
    setProfileMode(null);
  };

  const handleCheckIn = () => {
    if (checkInTime) return;

    setCheckInTime(new Date().toLocaleTimeString());
    setCheckOutTime(null);
    setManagerMenuOpen(false);
  };

  const handleCheckOut = () => {
    if (!checkInTime || checkOutTime) return;

    setCheckOutTime(new Date().toLocaleTimeString());
    setManagerMenuOpen(false);
  };

  const saveProfile = (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim();

    if (!trimmedName || !trimmedEmail) return;

    setName(trimmedName);
    setEmail(trimmedEmail);
    setProfileMode("view");

    // Connect your authentication service or backend API
    // here to save profile changes permanently.
  };

  return (
    <>
      {/* ================= TOP NAVIGATION ================= */}
      <header className={`fixed left-0 right-0 top-0 z-40 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xl transition-all duration-300 ${collapsed ? "lg:left-20" : "lg:left-[280px]"}`}>
        <div className="flex h-full min-w-0 items-center gap-2 px-3 sm:gap-3 sm:px-5">
          {/* Mobile Menu */}
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open navigation menu"
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 lg:hidden"
          >
            <Menu size={21} />
          </button>

          {/* Desktop Search */}
          <div className="relative hidden min-w-0 flex-1 md:block md:max-w-md">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search person, ticket, technician, parts..."
              aria-label="Search"
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white"
            />
          </div>

          {/* Mobile Search */}
          <button
            type="button"
            aria-label="Search"
            className="shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 md:hidden"
          >
            <Search size={19} />
          </button>

          {/* New Work Order */}
          <button
            type="button"
            onClick={() =>
              navigate(
                role === "admin"
                  ? "/admin/Enquiries"
                  : "/manager/WorkAssignment",
              )
            }
            className="hidden shrink-0 items-center gap-1.5 rounded-md bg-emerald-800 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-800 sm:flex"
          >
            <Plus size={15} />
            New Work Order
          </button>

          {/* Notifications */}
          <button
            type="button"
            aria-label="Notifications"
            className="relative shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
          >
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
          </button>

          {/* Help */}
          <button
            type="button"
            aria-label="Help"
            className="hidden shrink-0 rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 sm:block"
          >
            <HelpCircle size={18} />
          </button>

          {/* Profile / Manager Dropdown */}
          <div className="relative ml-auto shrink-0">
            <button
              type="button"
              onClick={() => {
                if (role === "manager") {
                  setManagerMenuOpen((open) => !open);
                } else {
                  openProfile("view");
                }
              }}
              aria-label="Open user menu"
              aria-expanded={
                role === "manager" ? managerMenuOpen : undefined
              }
              className="flex max-w-full items-center gap-2 rounded-xl border border-transparent py-1 pl-1.5 pr-1 transition hover:border-slate-200 hover:bg-slate-50 sm:pl-2"
            >
              <div className="hidden max-w-36 text-right sm:block">
                <p className="truncate text-xs font-semibold text-slate-800">
                  {name}
                </p>
                <p className="text-[10px] text-slate-500">
                  {userRole}
                </p>
              </div>

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                {name.charAt(0).toUpperCase()}
              </div>

              {role === "manager" && (
                <ChevronDown
                  size={15}
                  className={`hidden text-slate-500 transition-transform sm:block ${
                    managerMenuOpen ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* MANAGER DROPDOWN */}
            {role === "manager" && managerMenuOpen && (
              <>
                {/* Click outside to close */}
                <button
                  type="button"
                  aria-label="Close manager menu"
                  onClick={() => setManagerMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />

                <div className="absolute right-0 top-full z-50 mt-3 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                  {/* Dropdown Header */}
                  <div className="border-b border-slate-100 bg-slate-50 p-4">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {name}
                    </p>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {email}
                    </p>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          checkInTime && !checkOutTime
                            ? "bg-emerald-500"
                            : "bg-slate-300"
                        }`}
                      />

                      <span className="text-xs font-medium text-slate-700">
                        {checkInTime && !checkOutTime
                          ? "Currently Checked In"
                          : checkOutTime
                            ? "Shift Checked Out"
                            : "Not Checked In"}
                      </span>
                    </div>
                  </div>

                  {/* Check-in time */}
                  {checkInTime && (
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-[11px] text-slate-500">
                        Check In Time
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Clock3
                          size={15}
                          className="shrink-0 text-emerald-700"
                        />
                        {checkInTime}
                      </p>
                    </div>
                  )}

                  {/* Check-out time */}
                  {checkOutTime && (
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-[11px] text-slate-500">
                        Check Out Time
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Clock3
                          size={15}
                          className="shrink-0 text-slate-500"
                        />
                        {checkOutTime}
                      </p>
                    </div>
                  )}

                  {/* Attendance Actions */}
                  <div className="space-y-2 p-3">
                    <button
                      type="button"
                      disabled={!!checkInTime}
                      onClick={handleCheckIn}
                      className="flex w-full items-center gap-3 rounded-lg bg-emerald-50 px-3 py-3 text-left text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                        <LogIn size={18} />
                      </span>

                      <span>
                        <span className="block">Check In</span>
                        <span className="mt-0.5 block text-[11px] font-normal">
                          {checkInTime
                            ? "Already checked in"
                            : "Start your shift"}
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={!checkInTime || !!checkOutTime}
                      onClick={handleCheckOut}
                      className="flex w-full items-center gap-3 rounded-lg bg-rose-50 px-3 py-3 text-left text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white">
                        <LogOut size={18} />
                      </span>

                      <span>
                        <span className="block">Check Out</span>
                        <span className="mt-0.5 block text-[11px] font-normal">
                          {checkOutTime
                            ? "Already checked out"
                            : "End your shift"}
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Profile Option */}
                  <div className="border-t border-slate-100 p-2">
                    <button
                      type="button"
                      onClick={() => openProfile("view")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                    >
                      <UserRound size={16} />
                      My Profile
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ================= PROFILE POPUP ================= */}
      {profileMode && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeProfile();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <h2
                  id="profile-modal-title"
                  className="text-xl font-bold text-slate-900"
                >
                  {profileMode === "view"
                    ? "My Profile"
                    : "Edit Profile"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {profileMode === "view"
                    ? "View your account information"
                    : "Update your personal information"}
                </p>
              </div>

              <button
                type="button"
                onClick={closeProfile}
                aria-label="Close profile popup"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* VIEW PROFILE */}
            {profileMode === "view" && (
              <>
                <div className="p-5 sm:p-6">
                  {/* Profile Banner */}
                  <div className="mb-6 flex items-center gap-4 rounded-xl bg-emerald-50 p-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-bold text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-bold text-slate-900">
                        {name}
                      </h3>

                      <p className="mt-1 text-sm text-emerald-700">
                        {userRole}
                      </p>

                      <span className="mt-2 inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-medium text-emerald-700">
                        Account Active
                      </span>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-700">
                        <UserRound size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                          Full Name
                        </p>
                        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
                          {name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-700">
                        <Mail size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                          Email Address
                        </p>
                        <p className="mt-1 break-all text-sm font-semibold text-slate-800">
                          {email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-emerald-700">
                        <ShieldCheck size={19} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                          Account Role
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-800">
                          {userRole}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* View Profile Actions */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={closeProfile}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    onClick={() => openProfile("edit")}
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    <Pencil size={15} />
                    Edit Profile
                  </button>
                </div>
              </>
            )}

            {/* EDIT PROFILE */}
            {profileMode === "edit" && (
              <form onSubmit={saveProfile}>
                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <label
                      htmlFor="profile-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Full Name
                    </label>

                    <input
                      id="profile-name"
                      type="text"
                      value={editName}
                      onChange={(event) =>
                        setEditName(event.target.value)
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="profile-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email Address
                    </label>

                    <input
                      id="profile-email"
                      type="email"
                      value={editEmail}
                      onChange={(event) =>
                        setEditEmail(event.target.value)
                      }
                      required
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Enter your email address"
                    />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">
                    Changes currently update this screen only.
                    Connect your authentication service or backend
                    API to save them permanently.
                  </div>
                </div>

                {/* Edit Profile Actions */}
                <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-4 sm:p-5">
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(name);
                      setEditEmail(email);
                      setProfileMode("view");
                    }}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    <Save size={16} />
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
