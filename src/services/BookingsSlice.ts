
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/axios";

// --------------------------------------------------
// Frontend types
// --------------------------------------------------

export type ServiceStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Scheduled"
  | "In Progress"
  | "Completed";

export type Priority = "Low" | "Medium" | "High";

export interface Booking {
  id: string | number;
  reference: string;
  customer: string;
  company: string;
  serviceId: string | number;
  location: string;
  requestedDate: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: Priority;
  status: ServiceStatus;
  assignedTo: string;
  notes: string;
}

// --------------------------------------------------
// Backend API types
// --------------------------------------------------

interface ApiBooking {
  id: string;
  bookingNumber: string;
  customerId: string;
  serviceId: string;
  serviceLocationId: string;
  preferredDate: string;
  preferredTime: string;
  remarks?: string | null;
  status: string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdAt?: string;
  updatedAt?: string;

  service?: {
    id: string;
    name?: string;
    image?: string | null;
    basePrice?: string | number;
    estimatedDuration?: number;
  } | null;

  serviceLocation?: {
    id: string;
    locationName?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;

  customer?: {
    id: string;
    user?: {
      id?: string;
      firstName?: string;
      lastName?: string;
      phone?: string | null;
      email?: string;
    } | null;
  } | null;

  workOrder?: {
    scheduledDate?: string | null;
    scheduledTime?: string | null;
    assignedTo?: string | null;
  } | null;
}

interface ApiBookingsResponse {
  success: boolean;
  message?: string;
  data:
    | ApiBooking[]
    | ApiBooking
    | { booking?: ApiBooking };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface BookingsState {
  items: Booking[];
  loading: boolean;
  error: string | null;
}

interface UpdateBookingPayload {
  id: Booking["id"];
  updates: Partial<Booking>;
}

interface ApiStatusUpdate {
  status: "CONFIRMED" | "SCHEDULED" | "CANCELLED";
  cancelReason?: string;
}

const initialState: BookingsState = {
  items: [],
  loading: false,
  error: null,
};

// --------------------------------------------------
// Error handling
// --------------------------------------------------

function getErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            message?: string | string[];
          };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (message) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

// --------------------------------------------------
// Map backend status to frontend status
// --------------------------------------------------

function mapBookingStatus(status: string): ServiceStatus {
  switch (status.toUpperCase()) {
    case "REQUESTED":
    case "PENDING":
      return "Pending";

    case "CONFIRMED":
    case "APPROVED":
      return "Approved";

    case "CANCELLED":
    case "CANCELED":
    case "REJECTED":
      return "Rejected";

    case "SCHEDULED":
      return "Scheduled";

    case "IN_PROGRESS":
      return "In Progress";

    case "COMPLETED":
      return "Completed";

    default:
      return "Pending";
  }
}

// --------------------------------------------------
// Map backend booking to frontend booking
// --------------------------------------------------

function mapApiBooking(item: ApiBooking): Booking {
  const user = item.customer?.user;
  const location = item.serviceLocation;

  const customerName =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" ") || "Unknown Customer";

  const locationName = [
    location?.locationName,
    location?.address,
    location?.city,
    location?.state,
    location?.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: item.id,
    reference: item.bookingNumber,
    customer: customerName,
    company: "—",
    serviceId: item.serviceId,
    location: locationName || "—",
    requestedDate: item.preferredDate || "",
    scheduledDate: item.workOrder?.scheduledDate || "",
    scheduledTime:
      item.workOrder?.scheduledTime ||
      item.preferredTime ||
      "",
    priority: "Medium",
    status: mapBookingStatus(item.status),
    assignedTo: item.workOrder?.assignedTo || "",
    notes: [item.remarks, item.cancelReason]
      .filter(Boolean)
      .join("\n"),
  };
}

// --------------------------------------------------
// Parse a booking from different API response shapes
// --------------------------------------------------


function parseApiBooking(
  data: ApiBookingsResponse["data"],
  id: string
): ApiBooking | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  if (Array.isArray(data)) {
    return data.find((booking) => String(booking.id) === id);
  }

  // Check whether data is a wrapped booking response.
  if ("booking" in data) {
    const booking = data.booking;

    if (
      booking &&
      typeof booking.id === "string" &&
      typeof booking.bookingNumber === "string"
    ) {
      return booking;
    }

    return undefined;
  }

  // Explicitly verify that data is an ApiBooking.
  if (
    "id" in data &&
    typeof data.id === "string" &&
    "bookingNumber" in data &&
    typeof data.bookingNumber === "string"
  ) {
    return data as ApiBooking;
  }

  return undefined;
}


// --------------------------------------------------
// GET /bookings
// --------------------------------------------------

export const fetchBookings = createAsyncThunk<
  Booking[],
  void,
  { rejectValue: string }
>(
  "bookings/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response =
        await api.get<ApiBookingsResponse>("/bookings");

      const body = response.data;

      if (!body.success || !Array.isArray(body.data)) {
        return rejectWithValue(
          body.message ||
            "The bookings API did not return a list."
        );
      }

      return body.data.map(mapApiBooking);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch bookings.")
      );
    }
  }
);

// --------------------------------------------------
// PATCH /bookings/:id/status
//
// Backend DTO only accepts:
// CONFIRMED, SCHEDULED, CANCELLED
// --------------------------------------------------

export const updateBooking = createAsyncThunk<
  Booking,
  UpdateBookingPayload,
  { rejectValue: string }
>(
  "bookings/update",
  async ({ id, updates }, { getState, rejectWithValue }) => {
    try {
      let status: ApiStatusUpdate["status"];

      switch (updates.status) {
        case "Approved":
          status = "CONFIRMED";
          break;

        case "Scheduled":
          status = "SCHEDULED";
          break;

        case "Rejected":
          status = "CANCELLED";
          break;

        default:
          return rejectWithValue(
            "This API only supports confirming, scheduling, or cancelling bookings."
          );
      }

      const payload: ApiStatusUpdate = { status };

      if (status === "CANCELLED" && updates.notes?.trim()) {
        payload.cancelReason = updates.notes.trim();
      }

      // Update the booking status.
      const response = await api.patch<ApiBookingsResponse>(
        `/bookings/${encodeURIComponent(String(id))}/status`,
        payload
      );

      if (!response.data.success) {
        return rejectWithValue(
          response.data.message ||
            "Failed to update booking status."
        );
      }

      // Prefer a full booking returned by the PATCH response.
      let updatedBooking = parseApiBooking(
        response.data.data,
        String(id)
      );

      // If PATCH doesn't return the updated booking, fetch it.
      if (!updatedBooking) {
        const currentResponse =
          await api.get<ApiBookingsResponse>(
            `/bookings/${encodeURIComponent(String(id))}`
          );

        if (!currentResponse.data.success) {
          return rejectWithValue(
            "Booking status was updated, but fetching the updated booking failed."
          );
        }

        updatedBooking = parseApiBooking(
          currentResponse.data.data,
          String(id)
        );
      }

      if (updatedBooking) {
        return mapApiBooking(updatedBooking);
      }

      // If the API confirms success but doesn't return booking
      // details, update the existing Redux item safely.
      const state = getState() as {
        bookings: BookingsState;
      };

      const existingBooking = state.bookings.items.find(
        (booking) => String(booking.id) === String(id)
      );

      if (!existingBooking) {
        return rejectWithValue(
          "Booking updated, but its details could not be retrieved."
        );
      }

      return {
        ...existingBooking,
        status: updates.status!,
        notes:
          updates.status === "Rejected" && updates.notes
            ? updates.notes
            : existingBooking.notes,
      };
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update booking.")
      );
    }
  }
);

// --------------------------------------------------
// Redux slice
// --------------------------------------------------

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch bookings
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
          action.payload || "Failed to fetch bookings.";
      })

      // Update booking
      .addCase(updateBooking.pending, (state) => {
        state.error = null;
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
          action.payload || "Failed to update booking.";
      });
  },
});

export default bookingsSlice.reducer;
