
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassmorphismSummary from "../../components/common/GlassmorphismSummary";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Download,
  FileText,
  Search,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";

type WorkStatus =
  | "New"
  | "Pending"
  | "Assigned"
  | "In Progress"
  | "Completed";

type WorkPriority = "High" | "Medium" | "Low";

interface StatCard {
  title: string;
  value: string;
  percentage: string;
  description: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent: string;
}

interface WorkItem {
  id: number;
  customer: string;
  service: string;
  location: string;
  priority: WorkPriority;
  status: WorkStatus;
  date: string;
}

const stats: StatCard[] = [
  {
    title: "NEW WORKS",
    value: "48",
    percentage: "+12.5%",
    description: "12 New Today",
    icon: Download,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-800",
    accent: "border-t-slate-900",
  },
  {
    title: "ASSIGNED WORKS",
    value: "126",
    percentage: "+8.4%",
    description: "Total Assigned Works",
    icon: ClipboardList,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-700",
    accent: "border-t-blue-500",
  },
  {
    title: "IN PROGRESS",
    value: "92",
    percentage: "+6.2%",
    description: "Works In Progress",
    icon: Wrench,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    accent: "border-t-violet-500",
  },
  {
    title: "COMPLETED WORKS",
    value: "64",
    percentage: "+10.1%",
    description: "Works Completed",
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-700",
    accent: "border-t-lime-500",
  },
];

// Sample UI records. Replace these with your API/database records.
const recentWorks: WorkItem[] = [
  {
    id: 1,
    customer: "ABC Industries",
    service: "RO Maintenance",
    location: "Chennai",
    priority: "High",
    status: "New",
    date: "2026-10-10",
  },
  {
    id: 2,
    customer: "GreenTech Pvt Ltd",
    service: "AMC Service",
    location: "Coimbatore",
    priority: "Medium",
    status: "Pending",
    date: "2026-10-10",
  },
  {
    id: 3,
    customer: "Sunrise Apartments",
    service: "Filter Replacement",
    location: "Madurai",
    priority: "High",
    status: "Assigned",
    date: "2026-10-09",
  },
  {
    id: 4,
    customer: "Global Foods",
    service: "System Checkup",
    location: "Trichy",
    priority: "Medium",
    status: "New",
    date: "2026-10-09",
  },
  {
    id: 5,
    customer: "Sri Hospitals",
    service: "AMC Visit",
    location: "Salem",
    priority: "Low",
    status: "Pending",
    date: "2026-10-08",
  },
  {
    id: 6,
    customer: "Metro Solutions",
    service: "RO Installation",
    location: "Kochi",
    priority: "High",
    status: "New",
    date: "2026-10-08",
  },
  {
    id: 7,
    customer: "BlueSky Hotels",
    service: "AMC Service",
    location: "Thrissur",
    priority: "Medium",
    status: "Assigned",
    date: "2026-10-07",
  },
  {
    id: 8,
    customer: "City Care Hospital",
    service: "Filter Replacement",
    location: "Calicut",
    priority: "Low",
    status: "In Progress",
    date: "2026-10-07",
  },
  {
    id: 9,
    customer: "Green Valley",
    service: "System Checkup",
    location: "Palakkad",
    priority: "Medium",
    status: "Completed",
    date: "2026-10-06",
  },
  {
    id: 10,
    customer: "Prime Industries",
    service: "Water Plant Maintenance",
    location: "Kannur",
    priority: "High",
    status: "Pending",
    date: "2026-10-06",
  },
];

const destinationPaths: Record<string, string> = {
  "NEW WORKS": "/manager/WorkAssignment",
  "ASSIGNED WORKS": "/manager/WorkAssignment",
  "IN PROGRESS": "/manager/WorkMonitoring",
  "COMPLETED WORKS": "/manager/WorkVerification",
};

const destinationLabels: Record<string, string> = {
  "NEW WORKS": "VIEW INCOMING WORKS",
  "ASSIGNED WORKS": "VIEW ASSIGNED WORKS",
  "IN PROGRESS": "VIEW IN-PROGRESS WORKS",
  "COMPLETED WORKS": "VIEW COMPLETED WORKS",
};

function matchesCategory(work: WorkItem, title: string): boolean {
  switch (title) {
    case "NEW WORKS":
      return work.status === "New";
    case "ASSIGNED WORKS":
      return work.status === "Assigned";
    case "IN PROGRESS":
      return work.status === "In Progress";
    case "COMPLETED WORKS":
      return work.status === "Completed";
    default:
      return true;
  }
}

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [selectedStat, setSelectedStat] =
    useState<StatCard | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

  const filteredRecords = useMemo(() => {
    if (!selectedStat) return [];

    const query = searchTerm.trim().toLowerCase();

    return recentWorks.filter((work) => {
      const categoryMatches = matchesCategory(
        work,
        selectedStat.title
      );

      const searchableValues = [
        work.customer,
        work.service,
        work.location,
        work.status,
        work.priority,
        String(work.id),
        `WRK-${String(work.id).padStart(4, "0")}`,
      ];

      const searchMatches = searchableValues.some((value) =>
        value.toLowerCase().includes(query)
      );

      return categoryMatches && searchMatches;
    });
  }, [selectedStat, searchTerm]);

  useEffect(() => {
    if (!selectedStat) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedStat(null);
        setSearchTerm("");
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedStat]);

  function closePopup() {
    setSelectedStat(null);
    setSearchTerm("");
  }

  function goToAllocatedPage() {
    if (!selectedStat) return;

    const path = destinationPaths[selectedStat.title];

    closePopup();

    if (path) {
      navigate(path);
    }
  }

  return (
    <div className="space-y-6">
      {/* Dashboard header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Manager Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage service works, assign employees and track progress.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Clock size={15} />
          Last updated: Just now
        </div>
      </div>

{/* Glassmorphism summary (left side) */}
      <div className="flex justify-start">
        <div className="w-full max-w-3xl">
          <GlassmorphismSummary
            title="Works Summary"
            subtitle="Overall work status overview"
            variant="light"
            items={[
              {
                label: "New Works",
                value: stats[0]?.value ?? "0",
                icon: Download,
              },
              {
                label: "Assigned",
                value: stats[1]?.value ?? "0",
                icon: ClipboardList,
              },
              {
                label: "In Progress",
                value: stats[2]?.value ?? "0",
                icon: Wrench,
              },
            ]}
          />
        </div>
      </div>

      {/* Statistics cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <button
              key={stat.title}
              type="button"
              onClick={() => {
                setSearchTerm("");
                setSelectedStat(stat);
              }}
              className={`
                group relative overflow-hidden rounded-xl border
                border-slate-200 border-t-4 ${stat.accent}
                bg-white p-5 text-left shadow-sm transition duration-200
                hover:-translate-y-0.5 hover:shadow-md
                focus:outline-none focus:ring-2 focus:ring-emerald-500
              `}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="max-w-[180px] text-[11px] font-bold leading-5 tracking-wide text-slate-500">
                    {stat.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconBg} ${stat.iconColor}`}
                >
                  <Icon size={21} strokeWidth={2} />
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ArrowUpRight
                    size={17}
                    className="text-emerald-600"
                  />
                  <span className="text-sm font-bold text-emerald-700">
                    {stat.percentage}
                  </span>
                </div>

                <p className="max-w-[130px] text-right text-xs leading-4 text-slate-500">
                  {stat.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-400 transition group-hover:text-emerald-700">
                <span>View records</span>
                <ArrowRight size={15} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Recent incoming works */}
      <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        {/* HEADER */}
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
              <FileText size={20} />
            </div>

            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                Recent Incoming Works
              </h2>
              <p className="mt-0.5 text-xs leading-5 text-slate-500">
                Latest service requests and work assignments.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => navigate("/manager/WorkAssignment")}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 sm:w-auto"
          >
            View All
            <ArrowUpRight size={15} />
          </button>
        </div>

        {/* MOBILE AND TABLET CARDS */}
        <div className="mt-5 divide-y divide-slate-100 lg:hidden">
          {recentWorks.slice(0, 5).map((work) => (
            <div
              key={work.id}
              className="min-w-0 space-y-3 py-4 first:pt-0 last:pb-0"
            >
              {/* CUSTOMER AND ID */}
              <div className="flex min-w-0 items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold text-slate-800">
                    {work.customer}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    Request #{work.id}
                  </p>
                </div>

                <div className="shrink-0">
                  <PriorityBadge priority={work.priority} />
                </div>
              </div>

              {/* DETAILS */}
              <div className="grid min-w-0 grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Service Type
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-700">
                    {work.service}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Location
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-700">
                    {work.location}
                  </p>
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                    Received On
                  </p>
                  <p className="mt-1 break-words text-xs leading-5 text-slate-700">
                    {work.date}
                  </p>
                </div>
              </div>

              {/* STATUS */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-slate-500">
                  Status
                </span>
                <StatusBadge status={work.status} />
              </div>
            </div>
          ))}

          {recentWorks.length === 0 && (
            <div className="py-10 text-center">
              <FileText
                size={30}
                className="mx-auto text-slate-300"
              />
              <p className="mt-3 text-sm font-semibold text-slate-700">
                No incoming works found
              </p>
              <p className="mt-1 text-xs text-slate-500">
                New service requests will appear here.
              </p>
            </div>
          )}
        </div>

        {/* DESKTOP TABLE */}
        <div className="mt-5 hidden w-full overflow-x-auto lg:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "#",
                  "Customer",
                  "Service Type",
                  "Location",
                  "Priority",
                  "Status",
                  "Received On",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-3 py-3 text-left text-[11px] font-bold text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {recentWorks.slice(0, 5).map((work) => (
                <tr
                  key={work.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50"
                >
                  <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">
                    {work.id}
                  </td>

                  <td className="px-3 py-4 text-xs font-semibold text-slate-800">
                    {work.customer}
                  </td>

                  <td className="px-3 py-4 text-xs text-slate-600">
                    {work.service}
                  </td>

                  <td className="px-3 py-4 text-xs text-slate-600">
                    {work.location}
                  </td>

                  <td className="whitespace-nowrap px-3 py-4">
                    <PriorityBadge priority={work.priority} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-4">
                    <StatusBadge status={work.status} />
                  </td>

                  <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">
                    {work.date}
                  </td>
                </tr>
              ))}

              {recentWorks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-12 text-center">
                    <FileText
                      size={30}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No incoming works found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      New service requests will appear here.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Statistics popup */}
      {selectedStat && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closePopup();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="stats-modal-title"
            className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Popup header */}
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  {(() => {
                    const Icon = selectedStat.icon;
                    return <Icon size={22} />;
                  })()}
                </div>

                <div className="min-w-0">
                  <h2
                    id="stats-modal-title"
                    className="truncate text-lg font-bold text-slate-900 sm:text-xl"
                  >
                    {selectedStat.title}
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    Showing {Math.min(10, filteredRecords.length)} preview
                    records · Total: {selectedStat.value}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closePopup}
                aria-label="Close popup"
                className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-800"
              >
                <X size={21} />
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-3 bg-slate-50 p-4 sm:grid-cols-3 sm:p-5">
              <SummaryCard label="Total" value={selectedStat.value} />

              <SummaryCard
                label="Preview records"
                value={String(Math.min(10, filteredRecords.length))}
              />

              <SummaryCard
                label="Category"
                value={selectedStat.title}
                highlighted
              />
            </div>

            {/* Search */}
            <div className="border-b border-slate-100 p-4 sm:px-6">
              <div className="flex max-w-md items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 focus-within:border-emerald-500">
                <Search size={17} className="shrink-0 text-slate-400" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search these records..."
                  aria-label="Search preview records"
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
            </div>

            {/* Preview records table */}
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="text-[11px] font-bold uppercase text-slate-500">
                    <th className="px-5 py-3">Record ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Details</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecords.slice(0, 10).map((work) => (
                    <tr
                      key={work.id}
                      className="border-b border-slate-100 text-sm transition hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-emerald-700">
                        WRK-{String(work.id).padStart(4, "0")}
                      </td>
                      <td className="px-5 py-4 font-medium text-slate-800">
                        {work.customer}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <div>{work.service}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {work.location}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={work.status} />
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                        {work.date}
                      </td>
                    </tr>
                  ))}

                  {filteredRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-5 py-12 text-center text-sm text-slate-500"
                      >
                        No matching records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex flex-col justify-between gap-3 border-t border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:px-6">
              <p className="text-xs text-slate-500">
                Showing {Math.min(10, filteredRecords.length)} of{" "}
                {filteredRecords.length} preview records
              </p>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closePopup}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={goToAllocatedPage}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-900"
                >
                  {destinationLabels[selectedStat.title]}
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlighted = false,
}: {
  label: string;
  value: string;
  highlighted?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 break-words ${
          highlighted
            ? "text-sm font-bold text-emerald-700"
            : "text-xl font-bold text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: WorkPriority }) {
  const styles: Record<WorkPriority, string> = {
    High: "bg-red-100 text-red-700",
    Medium: "bg-amber-100 text-amber-700",
    Low: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${styles[priority]}`}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }: { status: WorkStatus }) {
  const styles: Record<WorkStatus, string> = {
    New: "bg-blue-100 text-blue-700",
    Pending: "bg-amber-100 text-amber-700",
    Assigned: "bg-emerald-100 text-emerald-700",
    "In Progress": "bg-violet-100 text-violet-700",
    Completed: "bg-emerald-100 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
