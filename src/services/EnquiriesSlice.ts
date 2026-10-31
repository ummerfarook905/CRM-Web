import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api/axios";
import {
  mapApiEnquiry,
  type ApiEnquiry,
  type CreateEnquiryPayload,
  type Enquiry,
  type EnquiryStatus,
} from "../models/admin/Enquiry";

export type { Enquiry, EnquiryStatus, Priority } from "../models/admin/Enquiry";

interface EnquiryState {
  items: Enquiry[];
  loading: boolean;
  error: string | null;
}

const initialState: EnquiryState = { items: [], loading: false, error: null };

type ApiErrorShape = { response?: { data?: { message?: unknown; errors?: unknown; details?: unknown; validationErrors?: unknown } } };
function errorDetails(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(errorDetails);
  if (!value || typeof value !== "object") return [];
  const record = value as Record<string, unknown>;
  const field = typeof record.field === "string" ? record.field : typeof record.property === "string" ? record.property : "";
  const messages = [record.message, record.messages, record.constraints].flatMap(errorDetails);
  if (field && messages.length) return [`${field}: ${messages.join(", ")}`];
  const nested = [record.fields, record.details, record.errors, record.validationErrors].flatMap(errorDetails);
  return [...messages, ...nested];
}
function getApiError(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const data = (error as ApiErrorShape).response?.data;
    const details = [data?.errors, data?.details, data?.validationErrors].flatMap(errorDetails);
    if (details.length) return details.join("; ");
    const message = data?.message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return error instanceof Error ? error.message : fallback;
}

export const fetchEnquiries = createAsyncThunk<Enquiry[], void, { rejectValue: string }>(
  "enquiries/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/enquiries");
      const result = response.data;
      const rows: ApiEnquiry[] = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : Array.isArray(result?.items)
            ? result.items
            : [];
      return rows.map(mapApiEnquiry);
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, "Failed to load enquiries"));
    }
  },
);

export const addEnquiry = createAsyncThunk<Enquiry, CreateEnquiryPayload, { rejectValue: string }>(
  "enquiries/addEnquiry",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/enquiries", payload);
      const result = response.data?.data ?? response.data;
      return mapApiEnquiry((result?.enquiry ?? result) as ApiEnquiry);
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, "Failed to add enquiry"));
    }
  },
);

export const updateEnquiryApi = createAsyncThunk<
  Enquiry,
  { id: string; updates: Partial<Enquiry> },
  { rejectValue: string }
>("enquiries/update", async ({ id, updates }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/enquiries/${encodeURIComponent(id)}`, updates);
    const result = response.data?.data ?? response.data;
    return mapApiEnquiry(result as ApiEnquiry);
  } catch (error: unknown) {
    return rejectWithValue(getApiError(error, "Failed to update enquiry"));
  }
});

const enquiriesSlice = createSlice({
  name: "enquiries",
  initialState,
  reducers: {
    clearEnquiryError(state) {
      state.error = null;
    },
    setEnquiryStatus(state, action: PayloadAction<{ id: string; status: EnquiryStatus }>) {
      const enquiry = state.items.find((item) => item.id === action.payload.id);
      if (enquiry) enquiry.status = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEnquiries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEnquiries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load enquiries";
      })
      .addCase(addEnquiry.pending, (state) => {
        state.error = null;
      })
      .addCase(addEnquiry.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(addEnquiry.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create enquiry";
      })
      .addCase(updateEnquiryApi.fulfilled, (state, action) => {
        const index = state.items.findIndex((item) => item.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateEnquiryApi.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update enquiry";
      });
  },
});

export const { clearEnquiryError, setEnquiryStatus } = enquiriesSlice.actions;
export default enquiriesSlice.reducer;
