
import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { api } from "../api/axios";

export type ServiceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Scheduled"
  | "In Progress"
  | "Completed";

export type Priority = "Low" | "Medium" | "High";

export interface Booking {
  id: number | string;
  reference: string;
  customer: string;
  company: string;
  serviceId: number | string;
  location: string;
  requestedDate: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: Priority;
  status: ServiceStatus;
  assignedTo: string;
  notes: string;
}

interface BookingsState {
  items: Booking[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingsState = {
  items: [],
  loading: false,
  error: null,
};

const textValue = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textValue).filter(Boolean).join(", ");
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return textValue(
      record.name ?? record.fullName ?? record.label ?? record.title ??
        record.address ?? record.value ?? record.city
    );
  }
  return "";
};

const mapBooking = (item: any): Booking => ({
  id: item.id,
  reference: textValue(item.reference ?? item.bookingReference),
  customer: textValue(item.customer ?? item.customerName),
  company: textValue(item.company ?? item.companyName),
  serviceId: item.serviceId ?? item.service?.id ?? "",
  location: textValue(item.location ?? item.address),
  requestedDate: textValue(item.requestedDate ?? item.requestDate),
  scheduledDate: textValue(item.scheduledDate),
  scheduledTime: textValue(item.scheduledTime),
  priority: textValue(item.priority) as Priority,
  status: textValue(item.status) as ServiceStatus,
  assignedTo: textValue(item.assignedTo ?? item.employee),
  notes: textValue(item.notes),
});

const errorText = (value: unknown, fallback: string): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((entry) => errorText(entry, "")).filter(Boolean).join(", ") || fallback;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return errorText(record.message ?? record.error ?? record.detail, fallback);
  }
  return fallback;
};

// Assumed endpoint: GET /api/v1/service-bookings
export const fetchBookings = createAsyncThunk<
  Booking[],
  void,
  { rejectValue: string }
>("bookings/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(
      "/bookings"
    );

    const result = response.data?.data ?? response.data;
    const items = Array.isArray(result)
      ? result
      : result?.bookings;

    if (!Array.isArray(items)) {
      return rejectWithValue(
        "The bookings API did not return a list."
      );
    }

    return items.map(mapBooking);
  } catch (error: any) {
    return rejectWithValue(
      errorText(error.response?.data?.message, "Failed to fetch bookings.")
    );
  }
});

// Assumed endpoint: PATCH /api/v1/service-bookings/:id
export const updateBooking = createAsyncThunk<
  Booking,
  { id: number | string; updates: Partial<Booking> },
  { rejectValue: string }
>(
  "bookings/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `bookings/${id}/status`,
        updates
      );

      const result = response.data?.data ?? response.data;
      return mapBooking(result.booking ?? result);
    } catch (error: any) {
      return rejectWithValue(
        errorText(error.response?.data?.message, "Failed to update booking.")
      );
    }
  }
);

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to fetch bookings.";
      })
      .addCase(updateBooking.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (booking) => booking.id === action.payload.id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateBooking.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to update booking.";
      });
  },
});

export default bookingsSlice.reducer;
