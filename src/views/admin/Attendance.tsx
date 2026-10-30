
import type { ElementType } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock3,
  CalendarDays,
  Search,
  ChevronDown,
  Eye,
  X,
  Timer,
  BriefcaseBusiness,
  MapPin,
} from "lucide-react";
import { useAttendanceViewModel } from "../../viewmodels/admin/UseAttendanceViewModel";
import type { AttendanceStatus } from "../../models/admin/Attendance";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function formatDate(date: string): string {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function Attendance() {
  const vm = useAttendanceViewModel();

  const {
    selectedDate,
    setSelectedDate,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    selectedRecord,
    setSelectedRecord,
    loading,
    error,
    departments,
    dateRecords,
    filteredRecords,
    presentCount,
    lateCount,
    absentCount,
    leaveCount,
    attendanceRate,
    clearFilters,
  } = vm;

  return (
    <div className="min-w-0 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Workforce Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Attendance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Monitor daily attendance, working hours and employee check-ins.
          </p>
        </div>
      </div>

      {loading && (
        <p role="status" className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          Loading attendance records…
        </p>
      )}
      {error && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>Could not load attendance: {error}</span>
          <button type="button" onClick={() => void vm.refreshAttendance()} className="font-semibold underline">
            Retry
          </button>
        </div>
      )}

      {/* DATE FILTER */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <CalendarDays size={20} />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-800">
              Attendance Date
            </p>

            <p className="text-xs text-slate-500">
              Select a date to view employee records.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="date"
            value={selectedDate}
            max={today()}
            onChange={(event) => setSelectedDate(event.target.value)}
            aria-label="Select attendance date"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <button
            type="button"
            onClick={() => setSelectedDate(today())}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Today
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Employees"
          value={dateRecords.length}
          description="Records for selected date"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-700"
          accent="border-t-blue-500"
        />

        <SummaryCard
          title="Present"
          value={presentCount}
          description="Checked in on time"
          icon={UserCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-700"
          accent="border-t-emerald-500"
        />

        <SummaryCard
          title="Late Arrivals"
          value={lateCount}
          description="Checked in after schedule"
          icon={Clock3}
          iconBg="bg-amber-50"
          iconColor="text-amber-700"
          accent="border-t-amber-500"
        />

        <SummaryCard
          title="Absent / On Leave"
          value={absentCount + leaveCount}
          description={`${absentCount} absent · ${leaveCount} on leave`}
          icon={UserX}
          iconBg="bg-rose-50"
          iconColor="text-rose-700"
          accent="border-t-rose-500"
        />
      </div>

      {/* ATTENDANCE RATE */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Attendance Rate
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Present and late employees as a percentage of all recorded
              employees.
            </p>
          </div>

          <p className="text-2xl font-bold text-emerald-700">
            {attendanceRate}%
          </p>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${attendanceRate}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Present: {presentCount}
          </span>

          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-amber-500" />
            Late: {lateCount}
          </span>

          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-rose-500" />
            Absent: {absentCount}
          </span>

          <span>
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-slate-400" />
            On Leave: {leaveCount}
          </span>
        </div>
      </div>

      {/* ATTENDANCE TABLE */}
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER AND FILTERS */}
        <div className="flex min-w-0 flex-col gap-4 border-b border-slate-200 p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900">
              Employee Attendance Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {formatDate(selectedDate)} · {filteredRecords.length} records
            </p>
          </div>

          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-3xl xl:grid-cols-3">
            {/* SEARCH */}
            <div className="relative min-w-0 sm:col-span-2 xl:col-span-1">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search employees..."
                aria-label="Search attendance records"
                className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {/* DEPARTMENT FILTER */}
            <div className="relative min-w-0">
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                aria-label="Filter department"
                className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="All">All Departments</option>
                {departments.map((department) => (
                  <option key={department} value={department}>
                    {department}
                  </option>
                ))}
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            {/* STATUS FILTER */}
            <div className="relative min-w-0">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter attendance status"
                className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
                <option value="Half Day">Half Day</option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* MOBILE AND TABLET CARDS */}
        <div className="grid min-w-0 grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 lg:hidden">
          {filteredRecords.map((record) => (
            <div
              key={record.id}
              className="min-w-0 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-200 sm:p-4"
            >
              {/* EMPLOYEE */}
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                  {getInitials(record.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {record.name}
                  </p>

                  <p className="mt-1 break-all text-xs text-slate-500">
                    {record.employeeId}
                  </p>

                  <p className="mt-1 break-words text-xs text-slate-500">
                    {record.designation}
                  </p>
                </div>

                <div className="shrink-0">
                  <StatusBadge status={record.status} />
                </div>
              </div>

              {/* ATTENDANCE DETAILS */}
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Department
                  </p>
                  <p className="mt-1 break-words text-sm font-medium text-slate-700">
                    {record.department}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Status
                  </p>
                  <div className="mt-1">
                    <StatusBadge status={record.status} />
                  </div>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Check In
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {record.checkIn}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Check Out
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {record.checkOut}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Working Hours
                  </p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-700">
                    {record.workingHours}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Overtime
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {record.overtime}
                  </p>
                </div>
              </div>

              {/* ACTION */}
              <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(record)}
                  title="View attendance details"
                  aria-label={`View attendance for ${record.name}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Eye size={16} />
                  View Details
                </button>
              </div>
            </div>
          ))}

          {/* EMPTY STATE */}
          {filteredRecords.length === 0 && (
            <div className="col-span-full px-3 py-12 text-center">
              <CalendarDays
                size={32}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No attendance records found
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Try another date or adjust your filters.
              </p>

              <button
                type="button"
                onClick={clearFilters}
                className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden min-w-0 w-full lg:block">
          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "Employee",
                    "Department",
                    "Check In",
                    "Check Out",
                    "Working Hours",
                    "Overtime",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 xl:px-5"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-4 xl:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                          {getInitials(record.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="break-words text-sm font-semibold text-slate-800">
                            {record.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {record.employeeId}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 xl:px-5">
                      <p className="text-sm font-medium text-slate-700">
                        {record.department}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {record.designation}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {record.checkIn}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {record.checkOut}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4">
                      <span className="text-sm font-semibold text-slate-700">
                        {record.workingHours}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {record.overtime}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={record.status} />
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => setSelectedRecord(record)}
                          title="View attendance details"
                          aria-label={`View attendance for ${record.name}`}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Eye size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <CalendarDays
                        size={32}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No attendance records found
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Try another date or adjust your filters.
                      </p>

                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Clear filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

  {/* FOOTER */}
  <div className="flex min-w-0 flex-col gap-1 border-t border-slate-200 bg-slate-50/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-5">
    <p className="break-words text-xs text-slate-500">
      Showing {filteredRecords.length} of {dateRecords.length} records
    </p>

    <p className="text-xs text-slate-400">
      Attendance data for {formatDate(selectedDate)}
    </p>
  </div>
</div>


      {/* ATTENDANCE DETAILS MODAL */}
      {selectedRecord && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedRecord(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="attendance-modal-title"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2
                  id="attendance-modal-title"
                  className="text-lg font-bold text-slate-900"
                >
                  Attendance Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedRecord.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRecord(null)}
                aria-label="Close details"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">
                  {getInitials(selectedRecord.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900">
                    {selectedRecord.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedRecord.employeeId}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    {selectedRecord.designation}
                  </p>
                </div>

                <StatusBadge status={selectedRecord.status} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailItem
                  icon={CalendarDays}
                  label="Attendance Date"
                  value={formatDate(selectedRecord.date)}
                />

                <DetailItem
                  icon={BriefcaseBusiness}
                  label="Department"
                  value={selectedRecord.department}
                />

                <DetailItem
                  icon={Clock3}
                  label="Check-in Time"
                  value={selectedRecord.checkIn}
                />

                <DetailItem
                  icon={Clock3}
                  label="Check-out Time"
                  value={selectedRecord.checkOut}
                />

                <DetailItem
                  icon={Timer}
                  label="Working Hours"
                  value={selectedRecord.workingHours}
                />

                <DetailItem
                  icon={Timer}
                  label="Overtime"
                  value={selectedRecord.overtime}
                />

                <div className="col-span-2">
                  <DetailItem
                    icon={MapPin}
                    label="Work Location"
                    value={selectedRecord.location}
                  />
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: number;
  description: string;
  icon: ElementType;
  iconBg: string;
  iconColor: string;
  accent: string;
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
  accent,
}: SummaryCardProps) {
  return (
    <div
      className={`rounded-xl border border-slate-200 border-t-4 ${accent} bg-white p-5 shadow-sm`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

interface StatusBadgeProps {
  status: AttendanceStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<AttendanceStatus, string> = {
    Present: "bg-emerald-50 text-emerald-700",
    Late: "bg-amber-50 text-amber-700",
    Absent: "bg-rose-50 text-rose-700",
    "On Leave": "bg-sky-50 text-sky-700",
    "Half Day": "bg-violet-50 text-violet-700",
    Unknown: "bg-slate-100 text-slate-600",
  };

  const dotStyles: Record<AttendanceStatus, string> = {
    Present: "bg-emerald-500",
    Late: "bg-amber-500",
    Absent: "bg-rose-500",
    "On Leave": "bg-sky-500",
    "Half Day": "bg-violet-500",
    Unknown: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status]}`} />
      {status}
    </span>
  );
}

interface DetailItemProps {
  icon: ElementType;
  label: string;
  value: string;
}

function DetailItem({ icon: Icon, label, value }: DetailItemProps) {
  return (
    <div className="flex min-w-0 gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
        <Icon size={17} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-slate-500">{label}</p>

        <p className="mt-1 break-words text-sm font-semibold text-slate-800">
          {value || "—"}
        </p>
      </div>
    </div>
  );
}
