
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  FileImage,
  MapPin,
  MessageSquare,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type VerificationStatus =
  | "Awaiting Review"
  | "Approved"
  | "Correction Requested";

interface VerificationWork {
  id: number;
  reference: string;
  customer: string;
  company: string;
  service: string;
  location: string;
  employees: string[];
  completionDate: string;
  photos: string[];
  remarks: string;
  verificationStatus: VerificationStatus;
  correctionNote: string;
}

const initialWorks: VerificationWork[] = [
  {
    id: 1,
    reference: "WO-2026-104",
    customer: "Suresh Nair",
    company: "Sri Hospitals",
    service: "Annual Maintenance",
    location: "Palakkad, Kerala",
    employees: ["Fathima Ali", "Sanjay Kumar"],
    completionDate: "2026-10-08",
    photos: [
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=800&q=80",
    ],
    remarks:
      "Preventive maintenance completed. Equipment inspected, filters cleaned and system performance tested. All units are operating normally.",
    verificationStatus: "Awaiting Review",
    correctionNote: "",
  },
  {
    id: 2,
    reference: "WO-2026-108",
    customer: "Rajesh Kumar",
    company: "ABC Industries",
    service: "RO System Maintenance",
    location: "Thrissur, Kerala",
    employees: ["John Mathew"],
    completionDate: "2026-10-07",
    photos: [
      "https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=800&q=80",
    ],
    remarks:
      "RO membrane inspected and replaced. System restarted and water quality checked.",
    verificationStatus: "Awaiting Review",
    correctionNote: "",
  },
  {
    id: 3,
    reference: "WO-2026-099",
    customer: "Anil Thomas",
    company: "GreenTech Pvt Ltd",
    service: "Water Plant Inspection",
    location: "Kochi, Kerala",
    employees: ["Arun Mathew", "Meera Joseph"],
    completionDate: "2026-10-06",
    photos: [
      "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
    ],
    remarks:
      "Inspection completed. Need to recheck the pressure gauge reading during the next visit.",
    verificationStatus: "Correction Requested",
    correctionNote:
      "Please upload a clear photo of the final pressure gauge reading.",
  },
  {
    id: 4,
    reference: "WO-2026-095",
    customer: "Priya Menon",
    company: "Sunrise Apartments",
    service: "Filter Replacement",
    location: "Kozhikode, Kerala",
    employees: ["Rahul Nair"],
    completionDate: "2026-10-05",
    photos: [
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    ],
    remarks:
      "Filter replaced and leakage test completed successfully.",
    verificationStatus: "Approved",
    correctionNote: "",
  },
];

const verificationStyles: Record<VerificationStatus, string> = {
  "Awaiting Review": "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  "Correction Requested": "bg-red-50 text-red-700",
};

export default function WorkVerification() {
  const [works, setWorks] =
    useState<VerificationWork[]>(initialWorks);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [selectedWork, setSelectedWork] =
    useState<VerificationWork | null>(null);

  const [correctionNote, setCorrectionNote] = useState("");
  const [notice, setNotice] = useState("");

  const [photoPreview, setPhotoPreview] = useState<string | null>(
    null
  );

  const counts = [
    {
      title: "Awaiting Review",
      value: works.filter(
        (work) => work.verificationStatus === "Awaiting Review"
      ).length,
      icon: Clock,
      color: "border-t-amber-500",
      iconStyle: "bg-amber-50 text-amber-700",
    },
    {
      title: "Approved",
      value: works.filter(
        (work) => work.verificationStatus === "Approved"
      ).length,
      icon: CheckCircle2,
      color: "border-t-emerald-500",
      iconStyle: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "Correction Requested",
      value: works.filter(
        (work) =>
          work.verificationStatus === "Correction Requested"
      ).length,
      icon: AlertCircle,
      color: "border-t-red-500",
      iconStyle: "bg-red-50 text-red-700",
    },
    {
      title: "Total Submissions",
      value: works.length,
      icon: FileCheck,
      color: "border-t-blue-500",
      iconStyle: "bg-blue-50 text-blue-700",
    },
  ];

  const filteredWorks = useMemo(() => {
    const query = search.toLowerCase().trim();

    return works.filter((work) => {
      const matchesSearch =
        !query ||
        [
          work.reference,
          work.customer,
          work.company,
          work.service,
          work.location,
          ...work.employees,
        ].some((value) =>
          value.toLowerCase().includes(query)
        );

      const matchesStatus =
        statusFilter === "All" ||
        work.verificationStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [works, search, statusFilter]);

  const openReview = (work: VerificationWork) => {
    setSelectedWork(work);
    setCorrectionNote(work.correctionNote);
  };

  const updateVerification = (
    id: number,
    verificationStatus: VerificationStatus,
    note = ""
  ) => {
    setWorks((current) =>
      current.map((work) =>
        work.id === id
          ? {
              ...work,
              verificationStatus,
              correctionNote: note,
            }
          : work
      )
    );
  };

  const approveWork = () => {
    if (!selectedWork) return;

    const reference = selectedWork.reference;

    updateVerification(selectedWork.id, "Approved");
    setSelectedWork(null);
    setNotice(`${reference} has been approved successfully.`);
  };

  const requestCorrection = () => {
    if (!selectedWork) return;

    if (!correctionNote.trim()) {
      setNotice(
        "Please explain what needs to be corrected before submitting."
      );
      return;
    }

    const reference = selectedWork.reference;

    updateVerification(
      selectedWork.id,
      "Correction Requested",
      correctionNote.trim()
    );

    setSelectedWork(null);
    setNotice(`Corrections requested for ${reference}.`);
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">
          Operations / Quality Control
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Work Verification
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Review completed jobs, verify photo evidence and employee
          remarks, and approve work or request corrections.
        </p>
      </div>

      {/* Notification */}
      {notice && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span>{notice}</span>
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {counts.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.title}
              className={`rounded-xl border border-slate-100 ${item.color} border-t-4 bg-white p-4 shadow-sm`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    {item.title}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {item.value}
                  </p>
                </div>

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.iconStyle}`}
                >
                  <Icon size={20} />
                </div>
              </div>

              <p className="mt-4 text-[11px] text-slate-500">
                Work verification records
              </p>
            </div>
          );
        })}
      </div>

      {/* Verification table */}
      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5">
          <h2 className="font-bold text-slate-900">
            Completed Work Submissions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Inspect employee evidence before making a verification decision.
          </p>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search work, customer or employee..."
                className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
              className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600"
            >
              <option value="All">All verification statuses</option>
              <option value="Awaiting Review">Awaiting Review</option>
              <option value="Approved">Approved</option>
              <option value="Correction Requested">
                Correction Requested
              </option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Work Order",
                  "Customer / Service",
                  "Employees",
                  "Completed On",
                  "Photos",
                  "Verification",
                  "Action",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredWorks.map((work) => (
                <tr
                  key={work.id}
                  className="border-t border-slate-100 hover:bg-slate-50"
                >
                  <td className="px-4 py-4">
                    <p className="text-xs font-bold text-slate-900">
                      {work.reference}
                    </p>

                    <p className="mt-1 whitespace-nowrap text-[10px] text-slate-500">
                      <MapPin
                        size={11}
                        className="mr-1 inline"
                      />
                      {work.location}
                    </p>
                  </td>

                  <td className="max-w-48 px-4 py-4">
                    <p className="text-xs font-semibold text-slate-800">
                      {work.customer}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {work.service}
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {work.company}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      {work.employees.map((employee) => (
                        <p
                          key={employee}
                          className="whitespace-nowrap text-[11px] text-slate-600"
                        >
                          <User
                            size={12}
                            className="mr-1 inline text-emerald-700"
                          />
                          {employee}
                        </p>
                      ))}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-4 py-4 text-xs text-slate-600">
                    {work.completionDate}
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() =>
                        setPhotoPreview(work.photos[0] ?? null)
                      }
                      disabled={work.photos.length === 0}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 disabled:text-slate-400"
                    >
                      <FileImage size={15} />
                      {work.photos.length} photo(s)
                    </button>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${verificationStyles[work.verificationStatus]}`}
                    >
                      {work.verificationStatus}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <button
                      onClick={() => openReview(work)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-800"
                    >
                      <Eye size={14} />
                      Review
                    </button>
                  </td>
                </tr>
              ))}

              {filteredWorks.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-14 text-center"
                  >
                    <Search
                      size={28}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No submissions found
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Try another search or verification status.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          Showing {filteredWorks.length} of {works.length} submissions
        </div>
      </section>

      {/* Review modal */}
      {selectedWork && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close review dialog"
            onClick={() => setSelectedWork(null)}
            className="absolute inset-0 h-full w-full cursor-default"
          />

          <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  {selectedWork.reference}
                </p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">
                  Verify Completed Work
                </h2>
              </div>

              <button
                onClick={() => setSelectedWork(null)}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {/* Job details */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-900">
                      {selectedWork.service}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {selectedWork.customer} · {selectedWork.company}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      <MapPin
                        size={13}
                        className="mr-1 inline"
                      />
                      {selectedWork.location}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${verificationStyles[selectedWork.verificationStatus]}`}
                  >
                    {selectedWork.verificationStatus}
                  </span>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Assigned employees
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedWork.employees.map((employee) => (
                      <span
                        key={employee}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                      >
                        <User
                          size={12}
                          className="mr-1 inline"
                        />
                        {employee}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <FileImage
                    size={17}
                    className="text-emerald-700"
                  />
                  Uploaded Completion Photos
                </h3>

                {selectedWork.photos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {selectedWork.photos.map((photo, index) => (
                      <button
                        key={`${photo}-${index}`}
                        onClick={() => setPhotoPreview(photo)}
                        className="group relative overflow-hidden rounded-xl border border-slate-200 text-left"
                      >
                        <img
                          src={photo}
                          alt={`Work completion ${index + 1}`}
                          className="h-32 w-full object-cover transition duration-200 group-hover:scale-105"
                        />
                        <span className="block bg-white px-2 py-2 text-[10px] font-medium text-slate-600">
                          Completion photo {index + 1}
                        </span>
                        <span className="absolute right-2 top-2 rounded-md bg-slate-950/70 p-1.5 text-white">
                          <Eye size={14} />
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                    No completion photos have been uploaded.
                  </p>
                )}
              </div>

              {/* Employee remarks */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <MessageSquare
                    size={17}
                    className="text-emerald-700"
                  />
                  Employee Completion Remarks
                </h3>

                <div className="mt-3 rounded-xl border border-slate-200 p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
                    {selectedWork.remarks || "No employee remarks provided."}
                  </p>
                </div>
              </div>

              {/* Previous correction note */}
              {selectedWork.correctionNote && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-xs font-bold text-red-800">
                    Previous correction request
                  </p>
                  <p className="mt-2 text-sm text-red-700">
                    {selectedWork.correctionNote}
                  </p>
                </div>
              )}

              {/* Correction request */}
              {selectedWork.verificationStatus !== "Approved" && (
                <div>
                  <label className="mb-2 block text-xs font-bold text-slate-800">
                    Request Corrections
                  </label>

                  <textarea
                    rows={3}
                    value={correctionNote}
                    onChange={(event) =>
                      setCorrectionNote(event.target.value)
                    }
                    placeholder="Explain what needs to be corrected, such as missing photos, unclear evidence or incomplete work..."
                    className="w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-red-400"
                  />

                  <p className="mt-1 text-[10px] text-slate-400">
                    Provide specific instructions so the employee knows what to fix.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  onClick={() => setSelectedWork(null)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
                >
                  Close
                </button>

                {selectedWork.verificationStatus !== "Approved" && (
                  <button
                    onClick={requestCorrection}
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                  >
                    <XCircle size={15} />
                    Request Corrections
                  </button>
                )}

                {selectedWork.verificationStatus !== "Approved" && (
                  <button
                    onClick={approveWork}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
                  >
                    <ShieldCheck size={15} />
                    Approve Work
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full-size photo preview */}
      {photoPreview && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/90 p-4">
          <button
            onClick={() => setPhotoPreview(null)}
            aria-label="Close photo preview"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={22} />
          </button>

          <img
            src={photoPreview}
            alt="Full-size work verification evidence"
            className="max-h-[85vh] max-w-full rounded-lg object-contain"
          />
        </div>
      )}
    </div>
  );
}
