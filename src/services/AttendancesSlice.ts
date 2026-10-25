
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type {
  ApiAttendanceRecord,
  AttendanceRecord,
  AttendanceState,
  AttendanceStatus,
} from "../models/admin/Attendance";
import {api} from "../api/axios";

const initialState: AttendanceState = {
  items: [],
  loading: false,
  error: null,
};

function mapApiAttendance(
  item: ApiAttendanceRecord,
): AttendanceRecord {
  const validStatuses: AttendanceStatus[] = [
    "Present",
    "Absent",
    "Late",
    "On Leave",
  ];

  const status = validStatuses.includes(
    item.status as AttendanceStatus,
  )
    ? (item.status as AttendanceStatus)
    : "Absent";

  return {
    id: String(item.id),
    employeeId: item.employeeId ?? "—",
    name: item.name ?? "Unknown Employee",
    department: item.department ?? "—",
    designation: item.designation ?? "—",
    date: item.date ? item.date.slice(0, 10) : "",
    checkIn: item.checkIn ?? "—",
    checkOut: item.checkOut ?? "—",
    workingHours: item.workingHours ?? "0h 00m",
    overtime: item.overtime ?? "0m",
    status,
    location: item.location ?? "—",
  };
}

function extractRecords(
  response: unknown,
): ApiAttendanceRecord[] {
  if (Array.isArray(response)) {
    return response as ApiAttendanceRecord[];
  }

  if (response && typeof response === "object") {
    const data = response as Record<string, unknown>;

    if (Array.isArray(data.data)) {
      return data.data as ApiAttendanceRecord[];
    }

    if (
      data.data &&
      typeof data.data === "object" &&
      Array.isArray(
        (data.data as Record<string, unknown>).items,
      )
    ) {
      return (data.data as { items: ApiAttendanceRecord[] })
        .items;
    }

    if (Array.isArray(data.items)) {
      return data.items as ApiAttendanceRecord[];
    }
  }

  throw new Error("Unexpected attendance API response format");
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to load attendance records";
}

export const fetchAttendance = createAsyncThunk<
  AttendanceRecord[],
  void,
  { rejectValue: string }
>(
  "attendance/fetchAttendance",
  async (_, { rejectWithValue }) => {
    try {
      // Change this path to match your backend controller.
      const response = await api.get("/attendance");

      return extractRecords(response.data).map(
        mapApiAttendance,
      );
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

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
      .addCase(
        fetchAttendance.fulfilled,
        (state, action) => {
          state.loading = false;
          state.items = action.payload;
        },
      )
      .addCase(
        fetchAttendance.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload ?? "Failed to load attendance";
        },
      );
  },
});

export default attendanceSlice.reducer;
