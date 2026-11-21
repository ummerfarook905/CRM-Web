import { api } from "../api/axios";

export type OvertimeStatus = "PENDING" | "APPROVED" | "REJECTED";
type RecordValue = Record<string, unknown>;

export interface ManagerAttendanceRecord {
  id: string;
  employeeId: string;
  staffName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  elapsedMinutes: number | null;
  elapsedTime: string;
  breakMinutes: number | null;
  status: string;
  raw: RecordValue;
}

export interface OvertimeDashboardRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number | null;
  breakMinutes: number | null;
  reason: string;
  status: OvertimeStatus;
  submittedAt: string;
  canReview?: boolean;
  isOwn?: boolean;
  raw: RecordValue;
}

export interface OvertimePagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const record = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value) ? value as RecordValue : {};
const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : fallback;
const numberOrNull = (value: unknown): number | null => {
  const parsed = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : NaN;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
};
const errorMessage = (cause: unknown, fallback: string): string => {
  const response = record(record(cause).response);
  const data = record(response.data);
  if (Number(response.status) === 403) return "You are not authorized to view this attendance or overtime data.";
  const message = data.message;
  if (Array.isArray(message)) return message.join(", ");
  return typeof message === "string" ? message : cause instanceof Error ? cause.message : fallback;
};

export function unwrapApiData(value: unknown): unknown {
  const envelope = record(value);
  if (envelope.success === false) {
    throw new Error(text(envelope.message, "The API rejected the request."));
  }
  return envelope.data ?? value;
}

function rowsOf(value: unknown, names: string[]): RecordValue[] {
  const root = record(value);
  const data = record(root.data);
  const nested = record(data.data);
  const rows = [
    Array.isArray(value) ? value : undefined,
    Array.isArray(root.data) ? root.data : undefined,
    ...names.map((name) => root[name]),
    ...names.map((name) => data[name]),
    ...names.map((name) => nested[name]),
    Array.isArray(data.data) ? data.data : undefined,
  ].find(Array.isArray);
  return Array.isArray(rows) ? rows.map(record) : [];
}

function displayName(value: unknown): string {
  const employee = record(value);
  const user = record(employee.user);
  const name = [user.firstName ?? employee.firstName, user.lastName ?? employee.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ");
  return text(employee.name ?? employee.fullName ?? employee.staffName ?? employee.employeeName, name || text(user.email ?? employee.email, "Staff member"));
}

export function mapAttendance(value: unknown): ManagerAttendanceRecord {
  const raw = record(value);
  const employee = record(raw.employee);
  const manager = record(raw.manager);
  const staff = Object.keys(employee).length ? employee : Object.keys(manager).length ? manager : raw;
  const date = text(raw.date ?? raw.attendanceDate);
  const status = text(raw.status, "UNKNOWN").toUpperCase().replaceAll(" ", "_");
  return {
    id: text(raw.id ?? raw.attendanceId),
    employeeId: text(raw.employeeId ?? employee.employeeNo ?? manager.id ?? employee.id ?? raw.managerId),
    staffName: text(raw.staffName ?? raw.employeeName, displayName(staff)),
    date: date.slice(0, 10),
    checkIn: text(raw.checkInTime ?? raw.checkIn ?? raw.startTime),
    checkOut: text(raw.checkOutTime ?? raw.checkOut ?? raw.endTime),
    elapsedMinutes: numberOrNull(raw.elapsedWorkingMinutes ?? raw.elapsedMinutes ?? raw.workingMinutes ?? raw.durationMinutes),
    elapsedTime: text(raw.elapsedWorkingTime ?? raw.elapsedTime ?? raw.workingHours),
    breakMinutes: numberOrNull(raw.breakMinutes),
    status,
    raw,
  };
}

export function mapOvertimeRequest(value: unknown): OvertimeDashboardRequest {
  const raw = record(value);
  const employee = record(raw.employee);
  const manager = record(raw.manager);
  const staff = Object.keys(employee).length ? employee : Object.keys(manager).length ? manager : raw;
  const user = record(staff.user);
  const rawStatus = text(raw.status, "PENDING").toUpperCase();
  const status: OvertimeStatus = rawStatus === "APPROVED" || rawStatus === "REJECTED" ? rawStatus : "PENDING";
  const date = text(raw.date ?? raw.overtimeDate ?? raw.createdAt);
  const duration = numberOrNull(raw.requestedMinutes ?? raw.durationMinutes ?? raw.overtimeMinutes);
  const canReviewValue = raw.canReview ?? raw.canDecide ?? raw.isReviewable;
  return {
    id: text(raw.id),
    employeeId: text(raw.employeeId ?? employee.id ?? manager.id),
    employeeName: text(raw.employeeName ?? raw.staffName ?? employee.name ?? manager.name, displayName(staff)),
    userId: text(raw.userId ?? raw.employeeUserId ?? user.id),
    date: date.slice(0, 10),
    startTime: text(raw.startTime ?? raw.checkInTime),
    endTime: text(raw.endTime ?? raw.checkOutTime),
    durationMinutes: duration,
    breakMinutes: numberOrNull(raw.breakMinutes),
    reason: text(raw.reason),
    status,
    submittedAt: text(raw.submittedAt ?? raw.createdAt),
    canReview: typeof canReviewValue === "boolean" ? canReviewValue : undefined,
    isOwn: typeof raw.isOwn === "boolean" ? raw.isOwn : typeof raw.requestedByMe === "boolean" ? raw.requestedByMe : undefined,
    raw,
  };
}

const identifiersFor = (request: OvertimeDashboardRequest): Set<string> => {
  const employee = record(request.raw.employee);
  const user = record(employee.user);
  return new Set([
    request.employeeId,
    request.userId,
    text(request.raw.userId),
    text(request.raw.employeeUserId),
    text(employee.id),
    text(user.id),
  ].filter(Boolean));
};

export function isOwnOvertimeRequest(request: OvertimeDashboardRequest, currentUserId: string | number): boolean {
  return request.isOwn === true || identifiersFor(request).has(String(currentUserId));
}

export function canManagerReviewOvertimeRequest(request: OvertimeDashboardRequest, currentUserId: string | number): boolean {
  return request.status === "PENDING"
    && !isOwnOvertimeRequest(request, currentUserId)
    && request.canReview !== false;
}

export function splitOwnAndTeamOvertime(
  requests: OvertimeDashboardRequest[],
  currentUserId: string | number,
): { own: OvertimeDashboardRequest[]; team: OvertimeDashboardRequest[] } {
  return requests.reduce<{ own: OvertimeDashboardRequest[]; team: OvertimeDashboardRequest[] }>((groups, request) => {
    groups[isOwnOvertimeRequest(request, currentUserId) ? "own" : "team"].push(request);
    return groups;
  }, { own: [], team: [] });
}

export async function fetchMyAttendance(): Promise<ManagerAttendanceRecord | null> {
  try {
    const response = await api.get("/attendance/today");
    const value = unwrapApiData(response.data);
    const root = record(value);
    const attendance = root.attendance ?? root.record ?? value;
    return attendance && Object.keys(record(attendance)).length ? mapAttendance(attendance) : null;
  } catch (cause) {
    throw new Error(errorMessage(cause, "Could not load your attendance."));
  }
}

export async function fetchTeamAttendance(date: string, page = 1, limit = 20): Promise<{ items: ManagerAttendanceRecord[]; pagination: OvertimePagination }> {
  try {
    const response = await api.get("/attendance", { params: { dateFrom: date, dateTo: date, page, limit } });
    const value = unwrapApiData(response.data);
    const rows = rowsOf(value, ["items", "attendance", "records"]);
    const root = record(response.data);
    const data = record(root.data);
    const pagination = record(root.pagination ?? data.pagination);
    const total = numberOrNull(pagination.total ?? pagination.totalItems ?? pagination.totalCount) ?? rows.length;
    const pageSize = numberOrNull(pagination.limit) ?? limit;
    const currentPage = numberOrNull(pagination.page) ?? page;
    const totalPages = numberOrNull(pagination.totalPages) ?? Math.max(1, Math.ceil(total / pageSize));
    return { items: rows.map(mapAttendance), pagination: { page: currentPage, limit: pageSize, total, totalPages } };
  } catch (cause) {
    throw new Error(errorMessage(cause, "Could not load team attendance."));
  }
}

export async function fetchOvertimeRequests(params: {
  status: OvertimeStatus | "";
  dateFrom: string;
  dateTo: string;
  page: number;
  limit?: number;
}): Promise<{ items: OvertimeDashboardRequest[]; pagination: OvertimePagination }> {
  try {
    const { status, dateFrom, dateTo, page, limit = 20 } = params;
    const response = await api.get("/overtime", {
      params: { ...(status ? { status } : {}), ...(dateFrom ? { dateFrom } : {}), ...(dateTo ? { dateTo } : {}), page, limit },
    });
    const value = unwrapApiData(response.data);
    const rows = rowsOf(value, ["items", "requests", "overtime"]);
    const root = record(response.data);
    const data = record(root.data);
    const pagination = record(root.pagination ?? data.pagination);
    const total = numberOrNull(pagination.total ?? pagination.totalItems ?? pagination.totalCount) ?? rows.length;
    const pageSize = numberOrNull(pagination.limit) ?? limit;
    const currentPage = numberOrNull(pagination.page) ?? page;
    const totalPages = numberOrNull(pagination.totalPages) ?? Math.max(1, Math.ceil(total / pageSize));
    return { items: rows.map(mapOvertimeRequest), pagination: { page: currentPage, limit: pageSize, total, totalPages } };
  } catch (cause) {
    throw new Error(errorMessage(cause, "Could not load overtime requests."));
  }
}

export async function fetchOvertimeEligibility(): Promise<RecordValue> {
  try {
    return record(unwrapApiData((await api.get("/overtime/eligibility/today")).data));
  } catch (cause) {
    throw new Error(errorMessage(cause, "Could not load overtime eligibility."));
  }
}

export async function submitOwnOvertimeRequest(reason: string): Promise<void> {
  const trimmedReason = reason.trim();
  if (!trimmedReason) throw new Error("Enter a reason for your overtime request.");
  try {
    unwrapApiData((await api.post("/overtime", { reason: trimmedReason })).data);
  } catch (cause) {
    throw new Error(errorMessage(cause, "Could not submit the overtime request."));
  }
}

export async function decideTeamOvertimeRequest(id: string, decision: "APPROVED" | "REJECTED"): Promise<void> {
  try {
    unwrapApiData((await api.post(`/overtime/${encodeURIComponent(id)}/decision`, { decision })).data);
  } catch (cause) {
    throw new Error(errorMessage(cause, "Could not save the overtime decision."));
  }
}
