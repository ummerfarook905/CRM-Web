
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
  id: number;
  reference: string;
  customer: string;
  company: string;
  serviceId: number;
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
      : result.bookings;

    if (!Array.isArray(items)) {
      return rejectWithValue(
        "The bookings API did not return a list."
      );
    }

    return items;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ??
        "Failed to fetch bookings."
    );
  }
});

// Assumed endpoint: PATCH /api/v1/service-bookings/:id
export const updateBooking = createAsyncThunk<
  Booking,
  { id: number; updates: Partial<Booking> },
  { rejectValue: string }
>(
  "bookings/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `bookings/${id}/status`,
        updates
      );

      const result = response.data?.data ?? response.data;
      return result.booking ?? result;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ??
          "Failed to update booking."
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
