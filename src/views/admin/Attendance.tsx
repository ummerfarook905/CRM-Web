
import { useEffect, useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  Users,
  UserCheck,
  UserX,
  Clock3,
  CalendarDays,
  Search,
  Download,
  ChevronDown,
  Eye,
  X,
  Timer,
  BriefcaseBusiness,
  MapPin,
} from "lucide-react";

type AttendanceStatus = "Present" | "Absent" | "Late" | "On Leave";

interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  overtime: string;
  status: AttendanceStatus;
  location: string;
}

const today = () => new Date().toISOString().slice(0, 10);

const STORAGE_KEY = "admin_attendance_records";

const initialAttendance: AttendanceRecord[] = [
  {
    id: "ATT-1001",
    employeeId: "EMP-1001",
    name: "Arun Kumar",
    department: "Operations",
    designation: "Operations Manager",
    date: today(),
    checkIn: "08:55",
    checkOut: "17:45",
    workingHours: "8h 50m",
    overtime: "50m",
    status: "Present",
    location: "Head Office",
  },
  {
    id: "ATT-1002",
    employeeId: "EMP-1002",
    name: "Rahul Nair",
    department: "Technical",
    designation: "Senior Technician",
    date: today(),
    checkIn: "09:18",
    checkOut: "18:10",
    workingHours: "8h 52m",
    overtime: "52m",
    status: "Late",
    location: "Client Site A",
  },
  {
    id: "ATT-1003",
    employeeId: "EMP-1003",
    name: "Anjali Menon",
    department: "Administration",
    designation: "HR Executive",
    date: today(),
    checkIn: "08:48",
    checkOut: "17:30",
    workingHours: "8h 42m",
    overtime: "42m",
    status: "Present",
    location: "Head Office",
  },
  {
    id: "ATT-1004",
    employeeId: "EMP-1004",
    name: "Vishnu Raj",
    department: "Technical",
    designation: "Field Technician",
    date: today(),
    checkIn: "—",
    checkOut: "—",
    workingHours: "0h 00m",
    overtime: "0m",
    status: "Absent",
    location: "—",
  },
  {
    id: "ATT-1005",
    employeeId: "EMP-1005",
    name: "Sneha Thomas",
    department: "Finance",
    designation: "Accountant",
    date: today(),
    checkIn: "08:58",
    checkOut: "17:35",
    workingHours: "8h 37m",
    overtime: "37m",
    status: "Present",
    location: "Head Office",
  },
  {
    id: "ATT-1006",
    employeeId: "EMP-1006",
    name: "Nithin Das",
    department: "Operations",
    designation: "Service Coordinator",
    date: today(),
    checkIn: "—",
    checkOut: "—",
    workingHours: "0h 00m",
    overtime: "0m",
    status: "On Leave",
    location: "—",
  },
  {
    id: "ATT-1007",
    employeeId: "EMP-1007",
    name: "Fahad Ali",
    department: "Technical",
    designation: "Field Technician",
    date: today(),
    checkIn: "09:05",
    checkOut: "17:40",
    workingHours: "8h 35m",
    overtime: "35m",
    status: "Present",
    location: "Client Site B",
  },
  {
    id: "ATT-1008",
    employeeId: "EMP-1008",
    name: "Meera Joseph",
    department: "Customer Support",
    designation: "Support Executive",
    date: today(),
    checkIn: "09:22",
    checkOut: "17:50",
    workingHours: "8h 28m",
    overtime: "28m",
    status: "Late",
    location: "Head Office",
  },
];

function loadAttendance(): AttendanceRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (stored) {
      const parsed: unknown = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        return parsed as AttendanceRecord[];
      }
    }
  } catch {
    // Fall back to demo attendance.
  }

  return initialAttendance;
}

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

function escapeCsv(value: string | number): string {
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export default function Attendance() {
  const [records] =
    useState<AttendanceRecord[]>(loadAttendance);

  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] =
    useState<AttendanceRecord | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records]);

  const departments = useMemo(
    () => [...new Set(records.map((record) => record.department))].sort(),
    [records],
  );

  const dateRecords = useMemo(
    () => records.filter((record) => record.date === selectedDate),
    [records, selectedDate],
  );

  const presentCount = dateRecords.filter(
    (record) => record.status === "Present",
  ).length;

  const lateCount = dateRecords.filter(
    (record) => record.status === "Late",
  ).length;

  const absentCount = dateRecords.filter(
    (record) => record.status === "Absent",
  ).length;

  const leaveCount = dateRecords.filter(
    (record) => record.status === "On Leave",
  ).length;

  const attendanceRate =
    dateRecords.length > 0
      ? Math.round(((presentCount + lateCount) / dateRecords.length) * 1000) /
        10
      : 0;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dateRecords.filter((record) => {
      const matchesSearch = [
        record.employeeId,
        record.name,
        record.department,
        record.designation,
        record.location,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesDepartment =
        departmentFilter === "All" ||
        record.department === departmentFilter;

      const matchesStatus =
        statusFilter === "All" || record.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [dateRecords, search, departmentFilter, statusFilter]);

  function exportCsv() {
    const headers = [
      "Employee ID",
      "Employee Name",
      "Department",
      "Designation",
      "Date",
      "Check In",
      "Check Out",
      "Working Hours",
      "Overtime",
      "Status",
      "Location",
    ];

    const rows = filteredRecords.map((record) => [
      record.employeeId,
      record.name,
      record.department,
      record.designation,
      record.date,
      record.checkIn,
      record.checkOut,
      record.workingHours,
      record.overtime,
      record.status,
      record.location,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `attendance-${selectedDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

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

        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
        >
          <Download size={17} />
          Export CSV
        </button>
      </div>

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
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER AND FILTERS */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Employee Attendance Records
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {formatDate(selectedDate)} · {filteredRecords.length} records
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative">
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
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(event) => setDepartmentFilter(event.target.value)}
                aria-label="Filter department"
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
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

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter attendance status"
                className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="All">All Statuses</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
                <option value="On Leave">On Leave</option>
              </select>

              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
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
                    className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500"
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
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">
                        {getInitials(record.name)}
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {record.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {record.employeeId}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-700">
                      {record.department}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {record.designation}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {record.checkIn}
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {record.checkOut}
                  </td>

                  <td className="px-5 py-4">
                    <span className="text-sm font-semibold text-slate-700">
                      {record.workingHours}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-sm text-slate-600">
                    {record.overtime}
                  </td>

                  <td className="px-5 py-4">
                    <StatusBadge status={record.status} />
                  </td>

                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => setSelectedRecord(record)}
                      title="View attendance details"
                      aria-label={`View attendance for ${record.name}`}
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                    >
                      <Eye size={17} />
                    </button>
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
                      onClick={() => {
                        setSearch("");
                        setDepartmentFilter("All");
                        setStatusFilter("All");
                      }}
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

        {/* FOOTER */}
        <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
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
  };

  const dotStyles: Record<AttendanceStatus, string> = {
    Present: "bg-emerald-500",
    Late: "bg-amber-500",
    Absent: "bg-rose-500",
    "On Leave": "bg-sky-500",
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
