import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ApiAttendanceRecord,
  AttendanceRecord,
  AttendanceState,
  AttendanceStatus,
} from "../models/admin/Attendance";
import { api } from "../api/axios";

const initialState: AttendanceState = {
  items: [],
  loading: false,
  error: null,
};

type ApiResponse = {
  data?: unknown;
  items?: unknown;
  pagination?: { totalPages?: number };
};

function rowsFromResponse(response: unknown): ApiAttendanceRecord[] {
  if (Array.isArray(response)) return response as ApiAttendanceRecord[];
  if (!response || typeof response !== "object") {
    throw new Error("Unexpected attendance API response format");
  }

  const body = response as ApiResponse;
  if (Array.isArray(body.data)) return body.data as ApiAttendanceRecord[];
  if (Array.isArray(body.items)) return body.items as ApiAttendanceRecord[];
  if (body.data && typeof body.data === "object") {
    const data = body.data as ApiResponse;
    if (Array.isArray(data.data)) return data.data as ApiAttendanceRecord[];
    if (Array.isArray(data.items)) return data.items as ApiAttendanceRecord[];
  }
  throw new Error("Unexpected attendance API response format");
}

function pagesFromResponse(response: unknown): number {
  if (!response || typeof response !== "object") return 1;
  const body = response as ApiResponse;
  const nested = body.data && typeof body.data === "object"
    ? body.data as ApiResponse
    : undefined;
  return body.pagination?.totalPages ?? nested?.pagination?.totalPages ?? 1;
}

function displayTime(value: unknown): string {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function duration(minutes: unknown): string {
  if (typeof minutes !== "number" || !Number.isFinite(minutes)) return "—";
  return `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m`;
}

function mapStatus(value: unknown): AttendanceStatus {
  switch (String(value ?? "").toUpperCase()) {
    case "PRESENT": return "Present";
    case "LATE": return "Late";
    case "ABSENT": return "Absent";
    case "LEAVE":
    case "ON LEAVE": return "On Leave";
    case "HALF_DAY":
    case "HALF DAY": return "Half Day";
    default: return "Unknown";
  }
}

function mapApiAttendance(item: ApiAttendanceRecord): AttendanceRecord {
  const employee = item.employee;
  const user = employee?.user;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ");
  const latitude = item.checkInLatitude ?? item.checkOutLatitude;
  const longitude = item.checkInLongitude ?? item.checkOutLongitude;
  const location = latitude != null && longitude != null
    ? `${latitude}, ${longitude}`
    : item.location ?? "—";

  return {
    id: String(item.id),
    employeeId: employee?.employeeNo ?? item.employeeNo ?? item.employeeId ?? "—",
    name: fullName || item.name || "Unknown Employee",
    department: item.department ?? employee?.department?.name ?? "—",
    designation: item.designation ?? employee?.designation ?? "—",
    date: item.date ? item.date.slice(0, 10) : "",
    checkIn: displayTime(item.checkInTime ?? item.checkIn),
    checkOut: displayTime(item.checkOutTime ?? item.checkOut),
    workingHours: item.workingMinutes != null
      ? duration(item.workingMinutes)
      : item.workingHours ?? "—",
    overtime: item.overtime ?? "—",
    status: mapStatus(item.status),
    location,
  };
}

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return error instanceof Error ? error.message : "Unable to load attendance records";
}

export const fetchAttendance = createAsyncThunk<
  AttendanceRecord[],
  string | undefined,
  { rejectValue: string }
>("attendance/fetchAttendance", async (date, { rejectWithValue }) => {
  try {
    const dateParams = date ? { dateFrom: date, dateTo: date } : {};
    const first = await api.get("/attendance", {
      params: { page: 1, limit: 100, ...dateParams },
    });
    const rows = rowsFromResponse(first.data);
    const totalPages = Math.min(pagesFromResponse(first.data), 100);

    for (let page = 2; page <= totalPages; page += 1) {
      const response = await api.get("/attendance", {
        params: { page, limit: 100, ...dateParams },
      });
      rows.push(...rowsFromResponse(response.data));
    }

    return rows.map(mapApiAttendance);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load attendance";
      });
  },
});

export default attendanceSlice.reducer;
