
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/axios";

export interface ServiceRequest {
  id: string;
  enquiryReference: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  location: string;
  serviceDate: string;
  notes: string;
  assignedManager: string;
  assignedEmployees: string[];
  status: "Scheduled";
  createdAt: string;
}

export interface ConvertEnquiryPayload {
  id: string;
  customerId: string;
  serviceId: string;
  serviceLocationId: string;
  preferredDate: string;
  preferredTime: string;
  priority: "LOW" | "NORMAL" | "HIGH";
  managerId?: string;
  employeeIds?: string[];
  remarks?: string;
  instructions?: string;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  customerId: string;
  serviceId: string;
  serviceLocationId: string;
  preferredDate: string;
  preferredTime: string;
  remarks?: string | null;
  status: "REQUESTED" | string;
  confirmedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
}

interface ServiceRequestState {
  items: ServiceRequest[];
  loading: boolean;
  error: string | null;
}

const initialState: ServiceRequestState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchServiceRequests = createAsyncThunk<
  ServiceRequest[],
  void,
  { rejectValue: string }
>("serviceRequests/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/service-requests");
    const result = response.data;

    return Array.isArray(result) ? result : result.data;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ??
        "Failed to load service requests"
    );
  }
});

export const convertEnquiryToBookingApi = createAsyncThunk<
  Booking,
  ConvertEnquiryPayload,
  { rejectValue: string }
>(
  "serviceRequests/convertEnquiryToBooking",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `/enquiries/${encodeURIComponent(id)}/convert`,
        payload,
      );

      return response.data?.data ?? response.data;
    } catch (error: unknown) {
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const apiError = (
          error as {
            response?: {
              data?: {
                message?: unknown;
                errors?: unknown;
                details?: unknown;
                validationErrors?: unknown;
              };
            };
          }
        ).response?.data;
        console.error("Enquiry conversion API error", { enquiryId: id, requestBody: payload, response: apiError });

        const errorText = (value: unknown): string[] => {
          if (typeof value === "string") return [value];
          if (Array.isArray(value)) return value.flatMap(errorText);
          if (!value || typeof value !== "object") return [];
          const record = value as Record<string, unknown>;
          const field = typeof record.field === "string" ? record.field : typeof record.property === "string" ? record.property : "";
          const messages = [record.message, record.messages, record.constraints].flatMap(errorText);
          if (field && messages.length) return [`${field}: ${messages.join(", ")}`];
          const nested = [record.fields, record.details, record.errors, record.validationErrors].flatMap(errorText);
          if (nested.length) return nested;
          return Object.entries(record).flatMap(([key, entry]) =>
            typeof entry === "string"
              ? [`${key}: ${entry}`]
              : errorText(entry),
          );
        };
        const details = [apiError?.errors, apiError?.details, apiError?.validationErrors]
          .flatMap(errorText);
        const message = apiError?.message;
        let rawError = "";
        if (message === "Validation failed" && apiError) {
          try { rawError = JSON.stringify(apiError); } catch { rawError = ""; }
        }

        return rejectWithValue(
          details.join("; ") ||
            (message === "Validation failed" && rawError ? `${message}: ${rawError}` : "") ||
            (Array.isArray(message) ? message.join(", ") : typeof message === "string" ? message : "") ||
            "Failed to convert enquiry into a booking.",
        );
      }

      return rejectWithValue(
        "Failed to convert enquiry into a booking.",
      );
    }
  },
);

const serviceRequestsSlice = createSlice({
  name: "serviceRequests",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchServiceRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServiceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load service requests";
      })
  },
});

export default serviceRequestsSlice.reducer;
