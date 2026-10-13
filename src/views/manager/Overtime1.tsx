

import { useEffect, useMemo, useState } from "react";

import type { ElementType } from "react";

import {

  Clock3,

  CheckCircle2,

  XCircle,

  Hourglass,

  Search,

  CalendarDays,

  Eye,

  Check,

  X,

  Timer,

  BriefcaseBusiness,

  FileText,

  ChevronDown,

  AlertCircle,

} from "lucide-react";



type OvertimeStatus = "Pending" | "Approved" | "Rejected";



interface OvertimeRequest {

  id: string;

  employeeId: string;

  employeeName: string;

  department: string;

  designation: string;

  date: string;

  regularHours: number;

  overtimeHours: number;

  overtimeSalary?: number;

  reason: string;

  submittedAt: string;

  status: OvertimeStatus;

  reviewedAt?: string;

  rejectionReason?: string;

}



const STORAGE_KEY = "admin_overtime_requests";



const today = () => new Date().toISOString().slice(0, 10);



const daysAgo = (days: number) => {

  const date = new Date();

  date.setDate(date.getDate() - days);

  return date.toISOString().slice(0, 10);

};



const initialRequests: OvertimeRequest[] = [

  {

    id: "OT-1001",

    employeeId: "EMP-1001",

    employeeName: "Arun Kumar",

    department: "Operations",

    designation: "Operations Manager",

    date: today(),

    regularHours: 8,

    overtimeHours: 2,

    reason: "Urgent service coordination and completion of pending reports.",

    submittedAt: `${today()}T09:15:00`,

    status: "Pending",

  },

  {

    id: "OT-1002",

    employeeId: "EMP-1002",

    employeeName: "Rahul Nair",

    department: "Technical",

    designation: "Senior Technician",

    date: today(),

    regularHours: 8,

    overtimeHours: 3,

    reason: "Emergency maintenance work at the customer site.",

    submittedAt: `${today()}T10:20:00`,

    status: "Pending",

  },

  {

    id: "OT-1003",

    employeeId: "EMP-1003",

    employeeName: "Anjali Menon",

    department: "Administration",

    designation: "HR Executive",

    date: daysAgo(1),

    regularHours: 8,

    overtimeHours: 1.5,

    reason: "Monthly employee records and payroll documentation.",

    submittedAt: `${daysAgo(1)}T16:30:00`,

    status: "Approved",
    overtimeSalary: 1000,

    reviewedAt: `${daysAgo(1)}T17:00:00`,

  },

  {

    id: "OT-1004",

    employeeId: "EMP-1004",

    employeeName: "Vishnu Raj",

    department: "Technical",

    designation: "Field Technician",

    date: daysAgo(1),

    regularHours: 8,

    overtimeHours: 2.5,

    reason: "Additional time required to complete an installation.",

    submittedAt: `${daysAgo(1)}T17:15:00`,

    status: "Rejected",

    reviewedAt: `${daysAgo(1)}T18:00:00`,

    rejectionReason: "Please attach the work completion report.",

  },

  {

    id: "OT-1005",

    employeeId: "EMP-1005",

    employeeName: "Sneha Thomas",

    department: "Finance",

    designation: "Accountant",

    date: daysAgo(2),

    regularHours: 8,

    overtimeHours: 1,

    reason: "Month-end financial reconciliation.",

    submittedAt: `${daysAgo(2)}T15:40:00`,

    status: "Pending",

  },

  {

    id: "OT-1006",

    employeeId: "EMP-1006",

    employeeName: "Nithin Das",

    department: "Operations",

    designation: "Service Coordinator",

    date: daysAgo(3),

    regularHours: 8,

    overtimeHours: 2,

    reason: "Coordination of delayed service requests.",

    submittedAt: `${daysAgo(3)}T18:10:00`,

    status: "Approved",
    overtimeSalary: 750,

    reviewedAt: `${daysAgo(3)}T18:30:00`,

  },

  {

    id: "OT-1007",

    employeeId: "EMP-1007",

    employeeName: "Fahad Ali",

    department: "Technical",

    designation: "Field Technician",

    date: daysAgo(4),

    regularHours: 8,

    overtimeHours: 4,

    reason: "Emergency repair and additional equipment testing.",

    submittedAt: `${daysAgo(4)}T19:00:00`,

    status: "Pending",

  },

  {

    id: "OT-1008",

    employeeId: "EMP-1008",

    employeeName: "Meera Joseph",

    department: "Customer Support",

    designation: "Support Executive",

    date: daysAgo(5),

    regularHours: 8,

    overtimeHours: 1.5,

    reason: "Customer support calls extending beyond working hours.",

    submittedAt: `${daysAgo(5)}T17:45:00`,

    status: "Rejected",

    reviewedAt: `${daysAgo(5)}T18:20:00`,

    rejectionReason: "The requested hours exceed the approved schedule.",

  },

];



function loadRequests(): OvertimeRequest[] {

  try {

    const stored = localStorage.getItem(STORAGE_KEY);



    if (stored) {

      const parsed: unknown = JSON.parse(stored);



      if (Array.isArray(parsed)) {

        return parsed as OvertimeRequest[];

      }

    }

  } catch {

    // Fall back to demonstration records.

  }



  return initialRequests;

}



function formatDate(date: string): string {

  if (!date) return "—";



  return new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

  });

}



function formatDateTime(dateTime?: string): string {

  if (!dateTime) return "—";



  return new Date(dateTime).toLocaleString("en-IN", {

    day: "2-digit",

    month: "short",

    year: "numeric",

    hour: "2-digit",

    minute: "2-digit",

  });

}



function formatHours(hours: number): string {

  const wholeHours = Math.floor(hours);

  const minutes = Math.round((hours - wholeHours) * 60);



  return minutes

    ? `${wholeHours}h ${minutes}m`

    : `${wholeHours}h`;

}



function getInitials(name: string): string {

  return name

    .trim()

    .split(/\s+/)

    .slice(0, 2)

    .map((part) => part[0])

    .join("")

    .toUpperCase();

}



export default function Overtime() {

  const [requests, setRequests] =

    useState<OvertimeRequest[]>(loadRequests);



  const [overtimeSalaryInput, setOvertimeSalaryInput] = useState("");



  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [departmentFilter, setDepartmentFilter] = useState("All");

  const [dateFilter, setDateFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =

    useState<OvertimeRequest | null>(null);



  const [rejectionTarget, setRejectionTarget] =

    useState<OvertimeRequest | null>(null);



  const [rejectionReason, setRejectionReason] = useState("");

  const [actionError, setActionError] = useState("");



  useEffect(() => {

    localStorage.setItem(STORAGE_KEY, JSON.stringify(requests));

  }, [requests]);



  const departments = useMemo(

    () =>

      [...new Set(requests.map((request) => request.department))].sort(),

    [requests],

  );



  const pendingRequests = requests.filter(

    (request) => request.status === "Pending",

  );



  const approvedRequests = requests.filter(

    (request) => request.status === "Approved",

  );



  const rejectedRequests = requests.filter(

    (request) => request.status === "Rejected",

  );



  const totalOvertimeHours = requests

    .filter((request) => request.status === "Approved")

    .reduce((total, request) => total + request.overtimeHours, 0);



  const filteredRequests = useMemo(() => {

    const query = search.trim().toLowerCase();



    return requests.filter((request) => {

      const matchesSearch = [

        request.id,

        request.employeeId,

        request.employeeName,

        request.department,

        request.designation,

        request.reason,

      ].some((value) => value.toLowerCase().includes(query));



      const matchesStatus =

        statusFilter === "All" || request.status === statusFilter;



      const matchesDepartment =

        departmentFilter === "All" ||

        request.department === departmentFilter;



      const matchesDate =

        dateFilter === "All" ||

        (dateFilter === "Today" && request.date === today()) ||

        (dateFilter === "Last 7 Days" &&

          request.date >= daysAgo(6) &&

          request.date <= today());



      return (

        matchesSearch &&

        matchesStatus &&

        matchesDepartment &&

        matchesDate

      );

    });

  }, [requests, search, statusFilter, departmentFilter, dateFilter]);



  function updateRequestStatus(

  requestId: string,

  status: "Approved" | "Rejected",

  reason?: string,

  overtimeSalary?: number

) {

  const reviewedAt = new Date().toISOString();



  const updatedRequest = (request: OvertimeRequest) =>

    request.id === requestId

      ? {

          ...request,

          status,

          reviewedAt,

          overtimeSalary:

            status === "Approved" ? overtimeSalary : undefined,

          rejectionReason:

            status === "Rejected" ? reason : undefined,

        }

      : request;



  setRequests((current) => current.map(updatedRequest));



  setSelectedRequest((current) =>

    current ? updatedRequest(current) : current

  );



  setRejectionTarget(null);

  setRejectionReason("");

  setActionError("");

}



function approveRequest(request: OvertimeRequest) {

  const salary = Number(overtimeSalaryInput);



  if (!Number.isFinite(salary) || salary <= 0) {

    setActionError("Please enter a valid overtime salary greater than ₹0.");

    return;

  }



  if (request.status !== "Pending") return;



  updateRequestStatus(request.id, "Approved", undefined, salary);

}



  function openRejectDialog(request: OvertimeRequest) {

    if (request.status !== "Pending") return;



    setSelectedRequest(null);

    setRejectionTarget(request);

    setRejectionReason("");

    setActionError("");

  }



  function confirmRejection(event: React.FormEvent<HTMLFormElement>) {

    event.preventDefault();



    if (!rejectionTarget) return;



    const reason = rejectionReason.trim();



    if (!reason) {

      setActionError("Please provide a reason for rejection.");

      return;

    }



    updateRequestStatus(rejectionTarget.id, "Rejected", reason);

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

            Overtime Management

          </h1>



          <p className="mt-1 text-sm text-slate-500">

            Review employee overtime requests and manage approvals.

          </p>

        </div>

      </div>



      {/* SUMMARY CARDS */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard

          title="Total Requests"

          value={requests.length}

          description="All overtime submissions"

          icon={Clock3}

          iconBg="bg-blue-50"

          iconColor="text-blue-700"

          accent="border-t-blue-500"

        />



        <SummaryCard

          title="Pending Approval"

          value={pendingRequests.length}

          description="Awaiting admin decision"

          icon={Hourglass}

          iconBg="bg-amber-50"

          iconColor="text-amber-700"

          accent="border-t-amber-500"

        />



        <SummaryCard

          title="Approved Requests"

          value={approvedRequests.length}

          description="Approved overtime submissions"

          icon={CheckCircle2}

          iconBg="bg-emerald-50"

          iconColor="text-emerald-700"

          accent="border-t-emerald-500"

        />



        <SummaryCard

          title="Approved Overtime"

          value={formatHours(totalOvertimeHours)}

          description="Total approved hours"

          icon={Timer}

          iconBg="bg-violet-50"

          iconColor="text-violet-700"

          accent="border-t-violet-500"

        />

      </div>



      {/* PENDING ALERT */}

      {pendingRequests.length > 0 && (

        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-amber-700">

            <AlertCircle size={19} />

          </div>



          <div>

            <p className="text-sm font-semibold text-amber-900">

              {pendingRequests.length} request

              {pendingRequests.length === 1 ? "" : "s"} waiting for approval

            </p>



            <p className="mt-1 text-xs leading-5 text-amber-800">

              Review the employee's reason and requested hours before making

              an approval decision.

            </p>

          </div>

        </div>

      )}



      {/* REQUEST TABLE */}

<div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

  {/* HEADER AND FILTERS */}

  <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:p-5 xl:flex-row xl:items-center xl:justify-between">

    <div className="min-w-0">

      <h2 className="text-base font-bold text-slate-900">

        Overtime Requests

      </h2>



      <p className="mt-1 text-xs text-slate-500">

        {filteredRequests.length} of {requests.length} requests

      </p>

    </div>



    {/* RESPONSIVE FILTERS */}

    <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:w-auto xl:flex xl:flex-wrap">

      <div className="relative min-w-0 xl:w-52">

        <Search

          size={17}

          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"

        />



        <input

          type="search"

          value={search}

          onChange={(event) => setSearch(event.target.value)}

          placeholder="Search requests..."

          aria-label="Search overtime requests"

          className="w-full min-w-0 rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"

        />

      </div>



      <div className="min-w-0 xl:w-44">

        <SelectFilter

          label="Department"

          value={departmentFilter}

          onChange={setDepartmentFilter}

          options={[

            { label: "All Departments", value: "All" },

            ...departments.map((department) => ({

              label: department,

              value: department,

            })),

          ]}

        />

      </div>



      <div className="min-w-0 xl:w-40">

        <SelectFilter

          label="Status"

          value={statusFilter}

          onChange={setStatusFilter}

          options={[

            { label: "All Statuses", value: "All" },

            { label: "Pending", value: "Pending" },

            { label: "Approved", value: "Approved" },

            { label: "Rejected", value: "Rejected" },

          ]}

        />

      </div>



      <div className="min-w-0 xl:w-40">

        <SelectFilter

          label="Date range"

          value={dateFilter}

          onChange={setDateFilter}

          options={[

            { label: "All Dates", value: "All" },

            { label: "Today", value: "Today" },

            { label: "Last 7 Days", value: "Last 7 Days" },

          ]}

        />

      </div>

    </div>

  </div>



  {/* MOBILE AND TABLET CARDS */}

  <div className="divide-y divide-slate-100 lg:hidden">

    {filteredRequests.map((request) => (

      <div

        key={request.id}

        className="min-w-0 space-y-4 p-4 transition hover:bg-slate-50/70 sm:p-5"

      >

        {/* EMPLOYEE */}

        <div className="flex min-w-0 items-start gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">

            {getInitials(request.employeeName)}

          </div>



          <div className="min-w-0 flex-1">

            <p className="break-words text-sm font-semibold text-slate-800">

              {request.employeeName}

            </p>



            <p className="mt-1 break-words text-xs text-slate-500">

              {request.employeeId} · {request.id}

            </p>



            <p className="mt-1 break-words text-xs text-slate-500">

              {request.department}

            </p>

          </div>



          <div className="shrink-0">

            <StatusBadge status={request.status} />

          </div>

        </div>



        {/* REQUEST DETAILS */}

        <div className="grid grid-cols-2 gap-x-3 gap-y-4 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">

          <div className="min-w-0">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">

              Request Date

            </p>

            <p className="mt-1 flex items-start gap-1.5 break-words text-xs text-slate-600">

              <CalendarDays

                size={14}

                className="mt-0.5 shrink-0 text-slate-400"

              />

              {formatDate(request.date)}

            </p>

          </div>



          <div className="min-w-0">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">

              Regular Hours

            </p>

            <p className="mt-1 break-words text-sm font-medium text-slate-700">

              {formatHours(request.regularHours)}

            </p>

          </div>



          <div className="min-w-0">

            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">

              Overtime

            </p>

            <span className="mt-1 inline-flex max-w-full items-center gap-1 rounded-md bg-violet-50 px-2 py-1.5 text-xs font-bold text-violet-700">

              <Timer size={13} className="shrink-0" />

              {formatHours(request.overtimeHours)}

            </span>

          </div>

        </div>



        <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3">

  <span className="text-xs font-semibold text-slate-500">

    Overtime Salary

  </span>



  {request.status === "Approved" &&

  request.overtimeSalary != null ? (

    <span className="text-sm font-bold text-emerald-700">

      ₹

      {request.overtimeSalary.toLocaleString("en-IN", {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2,

      })}

    </span>

  ) : (

    <span className="text-sm text-slate-400">—</span>

  )}

</div>



        {/* REASON */}

        <div className="min-w-0">

          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">

            Reason

          </p>

          <p className="mt-1 break-words text-sm leading-5 text-slate-600">

            {request.reason}

          </p>

        </div>



        {/* ACTIONS */}

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">

<IconButton

  label="View request"

  icon={Eye}

  onClick={() => {

    setSelectedRequest(request);

    setOvertimeSalaryInput(

      request.overtimeSalary != null

        ? String(request.overtimeSalary)

        : ""

    );

    setActionError("");

  }}

/>





          {request.status === "Pending" && (

            <>

              <IconButton

                label="Approve request"

                icon={Check}

                success

                onClick={() => {
                  setSelectedRequest(request);
                  setOvertimeSalaryInput("");
                  setActionError("");
                }}

              />



              <IconButton

                label="Reject request"

                icon={X}

                danger

                onClick={() => openRejectDialog(request)}

              />

            </>

          )}

        </div>

      </div>

    ))}



    {/* MOBILE EMPTY STATE */}

    {filteredRequests.length === 0 && (

      <div className="px-4 py-12 text-center">

        <Clock3 size={32} className="mx-auto text-slate-300" />



        <p className="mt-3 text-sm font-semibold text-slate-700">

          No overtime requests found

        </p>



        <p className="mt-1 text-xs text-slate-500">

          Try changing your search or filters.

        </p>



        <button

          type="button"

          onClick={() => {

            setSearch("");

            setStatusFilter("All");

            setDepartmentFilter("All");

            setDateFilter("All");

          }}

          className="mt-3 text-xs font-semibold text-emerald-700 hover:text-emerald-800"

        >

          Clear filters

        </button>

      </div>

    )}

  </div>



  {/* DESKTOP TABLE */}

  <div className="hidden w-full overflow-x-auto lg:block">

    <table className="w-full border-collapse text-left">

      <thead>

        <tr className="bg-slate-50">

          {[

            "Employee",

            "Request Date",

            "Regular Hours",

            "Overtime",

            "Reason",

            "Overtime Salary",

            "Status",

            "Actions",

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

        {filteredRequests.map((request) => (

          <tr

            key={request.id}

            className="transition hover:bg-slate-50/80"

          >

            <td className="px-4 py-4 xl:px-5">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-800">

                  {getInitials(request.employeeName)}

                </div>



                <div className="min-w-0">

                  <p className="text-sm font-semibold text-slate-800">

                    {request.employeeName}

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    {request.employeeId} · {request.id}

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    {request.department}

                  </p>

                </div>

              </div>

            </td>



            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 xl:px-5">

              <div className="flex items-center gap-2">

                <CalendarDays

                  size={15}

                  className="shrink-0 text-slate-400"

                />

                {formatDate(request.date)}

              </div>

            </td>



            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600 xl:px-5">

              {formatHours(request.regularHours)}

            </td>



            <td className="whitespace-nowrap px-4 py-4 xl:px-5">

              <span className="inline-flex items-center gap-1.5 rounded-md bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700">

                <Timer size={14} />

                {formatHours(request.overtimeHours)}

              </span>

            </td>



            <td className="max-w-[220px] px-4 py-4 xl:px-5">

              <p className="line-clamp-2 break-words text-sm leading-5 text-slate-600">

                {request.reason}

              </p>

            </td>



            <td className="whitespace-nowrap px-4 py-4 xl:px-5">

  {request.status === "Approved" &&

  request.overtimeSalary != null ? (

    <span className="font-semibold text-emerald-700">

      ₹

      {request.overtimeSalary.toLocaleString("en-IN", {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2,

      })}

    </span>

  ) : (

    <span className="text-slate-400">—</span>

  )}

</td>



            <td className="whitespace-nowrap px-4 py-4 xl:px-5">

              <StatusBadge status={request.status} />

            </td>



            <td className="px-4 py-4 xl:px-5">

              <div className="flex items-center gap-1">

                <IconButton

                  label="View request"

                  icon={Eye}

                  onClick={() => {

                    setSelectedRequest(request);

                    setOvertimeSalaryInput(

                      request.overtimeSalary != null

                        ? String(request.overtimeSalary)

                        : ""

                    );

                    setActionError("");

                  }}

                />



                {request.status === "Pending" && (

                  <>

                    <IconButton

                      label="Approve request"

                      icon={Check}

                      success

                      onClick={() => {
                  setSelectedRequest(request);
                  setOvertimeSalaryInput("");
                  setActionError("");
                }}

                    />



                    <IconButton

                      label="Reject request"

                      icon={X}

                      danger

                      onClick={() => openRejectDialog(request)}

                    />

                  </>

                )}

              </div>

            </td>

          </tr>

        ))}



        {filteredRequests.length === 0 && (

          <tr>

            <td colSpan={8} className="px-5 py-16 text-center">

              <Clock3

                size={32}

                className="mx-auto text-slate-300"

              />



              <p className="mt-3 text-sm font-semibold text-slate-700">

                No overtime requests found

              </p>



              <p className="mt-1 text-xs text-slate-500">

                Try changing your search or filters.

              </p>



              <button

                type="button"

                onClick={() => {

                  setSearch("");

                  setStatusFilter("All");

                  setDepartmentFilter("All");

                  setDateFilter("All");

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

  <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">

    <p className="text-xs text-slate-500">

      Showing {filteredRequests.length} request

      {filteredRequests.length === 1 ? "" : "s"}

    </p>



    <p className="break-words text-xs text-slate-400">

      Approved: {approvedRequests.length} · Rejected:{" "}

      {rejectedRequests.length}

    </p>

  </div>

</div>





      {/* VIEW REQUEST MODAL */}

      {selectedRequest && (

        <div

          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              setSelectedRequest(null);

            }

          }}

        >

          <div

            role="dialog"

            aria-modal="true"

            aria-labelledby="overtime-details-title"

            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"

          >

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2

                  id="overtime-details-title"

                  className="text-lg font-bold text-slate-900"

                >

                  Overtime Request Details

                </h2>



                <p className="mt-1 text-xs text-slate-500">

                  Request ID: {selectedRequest.id}

                </p>

              </div>



              <button

                type="button"

                onClick={() => setSelectedRequest(null)}

                aria-label="Close details"

                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"

              >

                <X size={20} />

              </button>

            </div>



            <div className="space-y-5 p-5">

              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800">

                  {getInitials(selectedRequest.employeeName)}

                </div>



                <div className="min-w-0 flex-1">

                  <h3 className="font-bold text-slate-900">

                    {selectedRequest.employeeName}

                  </h3>



                  <p className="mt-1 text-xs text-slate-500">

                    {selectedRequest.employeeId}

                  </p>



                  <p className="mt-1 text-xs text-slate-500">

                    {selectedRequest.designation}

                  </p>

                </div>



                <StatusBadge status={selectedRequest.status} />

              </div>



              <div className="grid grid-cols-2 gap-4">

                <DetailItem

                  icon={BriefcaseBusiness}

                  label="Department"

                  value={selectedRequest.department}

                />



                <DetailItem

                  icon={CalendarDays}

                  label="Overtime Date"

                  value={formatDate(selectedRequest.date)}

                />



                <DetailItem

                  icon={Clock3}

                  label="Regular Hours"

                  value={formatHours(selectedRequest.regularHours)}

                />



                <DetailItem

                  icon={Timer}

                  label="Requested Overtime"

                  value={formatHours(selectedRequest.overtimeHours)}

                />



                <DetailItem

                  icon={CalendarDays}

                  label="Submitted At"

                  value={formatDateTime(selectedRequest.submittedAt)}

                />



                <DetailItem

                  icon={CheckCircle2}

                  label="Reviewed At"

                  value={formatDateTime(selectedRequest.reviewedAt)}

                />

              </div>



              {selectedRequest.status === "Pending" && (

  <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">

    <label

      htmlFor="overtimeSalary"

      className="mb-2 block text-sm font-semibold text-slate-800"

    >

      Overtime Salary (₹)

      <span className="ml-1 text-rose-500">*</span>

    </label>



    <div className="relative">

      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-slate-500">

        ₹

      </span>



      <input

        id="overtimeSalary"

        type="number"

        min="0.01"

        step="0.01"

        required

        value={overtimeSalaryInput}

        onChange={(event) => {

          setOvertimeSalaryInput(event.target.value);

          setActionError("");

        }}

        placeholder="Enter overtime salary"

        className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-8 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"

      />

    </div>



    <p className="mt-2 text-xs text-slate-500">

      Enter the total overtime payment for this request.

    </p>



    {actionError && (

      <p role="alert" className="mt-2 text-sm text-rose-600">

        {actionError}

      </p>

    )}

  </div>

)}



{selectedRequest.status === "Approved" &&

  selectedRequest.overtimeSalary != null && (

    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">

      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">

        Approved Overtime Salary

      </p>



      <p className="mt-2 text-2xl font-bold text-emerald-800">

        ₹

        {selectedRequest.overtimeSalary.toLocaleString("en-IN", {

          minimumFractionDigits: 2,

          maximumFractionDigits: 2,

        })}

      </p>

    </div>

  )}





              <div className="rounded-xl border border-slate-200 p-4">

                <div className="flex items-center gap-2">

                  <FileText size={17} className="text-emerald-700" />



                  <h3 className="text-sm font-bold text-slate-800">

                    Reason for Overtime

                  </h3>

                </div>



                <p className="mt-2 text-sm leading-6 text-slate-600">

                  {selectedRequest.reason}

                </p>

              </div>



              {selectedRequest.status === "Rejected" &&

                selectedRequest.rejectionReason && (

                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">

                    <p className="text-sm font-semibold text-rose-800">

                      Rejection Reason

                    </p>



                    <p className="mt-2 text-sm leading-5 text-rose-700">

                      {selectedRequest.rejectionReason}

                    </p>

                  </div>

                )}



              {selectedRequest.status === "Pending" && (

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">

                  <button

                    type="button"

                    onClick={() => openRejectDialog(selectedRequest)}

                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"

                  >

                    <XCircle size={16} />

                    Reject

                  </button>



                  <button

                    type="button"

                    onClick={() => approveRequest(selectedRequest)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"

                  >

                    <CheckCircle2 size={16} />

                    Approve Overtime

                  </button>

                </div>

              )}



              {selectedRequest.status !== "Pending" && (

                <button

                  type="button"

                  onClick={() => setSelectedRequest(null)}

                  className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"

                >

                  Close Details

                </button>

              )}

            </div>

          </div>

        </div>

      )}



      {/* REJECTION REASON MODAL */}

      {rejectionTarget && (

        <div

          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"

          onMouseDown={(event) => {

            if (event.target === event.currentTarget) {

              setRejectionTarget(null);

              setActionError("");

            }

          }}

        >

          <div

            role="dialog"

            aria-modal="true"

            aria-labelledby="reject-overtime-title"

            className="w-full max-w-md rounded-2xl bg-white shadow-2xl"

          >

            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

              <div>

                <h2

                  id="reject-overtime-title"

                  className="text-lg font-bold text-slate-900"

                >

                  Reject Overtime

                </h2>



                <p className="mt-1 text-xs text-slate-500">

                  {rejectionTarget.employeeName} · {rejectionTarget.id}

                </p>

              </div>



              <button

                type="button"

                onClick={() => {

                  setRejectionTarget(null);

                  setActionError("");

                }}

                aria-label="Close rejection dialog"

                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"

              >

                <X size={19} />

              </button>

            </div>



            <form onSubmit={confirmRejection} className="space-y-4 p-5">

              <div className="rounded-lg bg-rose-50 p-3 text-sm leading-5 text-rose-800">

                Rejecting this request will record the decision. Provide a

                reason so the employee understands why it was rejected.

              </div>



              <label className="block">

                <span className="mb-1.5 block text-xs font-semibold text-slate-700">

                  Rejection Reason <span className="text-rose-500">*</span>

                </span>



                <textarea

                  autoFocus

                  required

                  minLength={3}

                  rows={4}

                  value={rejectionReason}

                  onChange={(event) => {

                    setRejectionReason(event.target.value);

                    setActionError("");

                  }}

                  placeholder="Explain why this overtime request is rejected..."

                  className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-rose-400 focus:ring-2 focus:ring-rose-100"

                />

              </label>



              {actionError && (

                <p role="alert" className="text-xs text-rose-600">

                  {actionError}

                </p>

              )}



              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">

                <button

                  type="button"

                  onClick={() => {

                    setRejectionTarget(null);

                    setActionError("");

                  }}

                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"

                >

                  Cancel

                </button>



                <button

                  type="submit"

                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700"

                >

                  <XCircle size={16} />

                  Confirm Rejection

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}



/* SUMMARY CARD */



interface SummaryCardProps {

  title: string;

  value: string | number;

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



/* STATUS BADGE */



function StatusBadge({ status }: { status: OvertimeStatus }) {

  const styles: Record<OvertimeStatus, string> = {

    Pending: "bg-amber-50 text-amber-700",

    Approved: "bg-emerald-50 text-emerald-700",

    Rejected: "bg-rose-50 text-rose-700",

  };



  const dots: Record<OvertimeStatus, string> = {

    Pending: "bg-amber-500",

    Approved: "bg-emerald-500",

    Rejected: "bg-rose-500",

  };



  return (

    <span

      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}

    >

      <span className={`h-1.5 w-1.5 rounded-full ${dots[status]}`} />

      {status}

    </span>

  );

}



/* TABLE FILTER */



interface SelectFilterProps {

  label: string;

  value: string;

  onChange: (value: string) => void;

  options: { label: string; value: string }[];

}



function SelectFilter({

  label,

  value,

  onChange,

  options,

}: SelectFilterProps) {

  return (

    <div className="relative">

      <select

        aria-label={label}

        value={value}

        onChange={(event) => onChange(event.target.value)}

        className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-3 pr-9 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"

      >

        {options.map((option) => (

          <option key={option.value} value={option.value}>

            {option.label}

          </option>

        ))}

      </select>



      <ChevronDown

        size={15}

        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"

      />

    </div>

  );

}



/* ACTION BUTTON */



interface IconButtonProps {

  label: string;

  icon: ElementType;

  onClick: () => void;

  success?: boolean;

  danger?: boolean;

}



function IconButton({

  label,

  icon: Icon,

  onClick,

  success = false,

  danger = false,

}: IconButtonProps) {

  const styles = danger

    ? "text-slate-400 hover:bg-rose-50 hover:text-rose-600"

    : success

      ? "text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"

      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800";



  return (

    <button

      type="button"

      title={label}

      aria-label={label}

      onClick={onClick}

      className={`rounded-lg p-2 transition ${styles}`}

    >

      <Icon size={16} />

    </button>

  );

}



/* DETAIL ITEM */



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
