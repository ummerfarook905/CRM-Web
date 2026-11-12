import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api, getAuthTokens } from "../api/axios";
import type { RootState } from "../app/Store";
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
  total: number;
  loading: boolean;
  error: string | null;
}

const initialState: EnquiryState = { items: [], total: 0, loading: false, error: null };

interface EnquiryListResponse {
  items: Enquiry[];
  total: number;
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};

function extractEnquiries(value: unknown): EnquiryListResponse {
  const root = asRecord(value);
  const data = asRecord(root.data);
  const nestedData = asRecord(data.data);
  const rawItems = [
    Array.isArray(value) ? value : undefined,
    root.items,
    root.enquiries,
    Array.isArray(root.data) ? root.data : undefined,
    data.items,
    data.enquiries,
    Array.isArray(data.data) ? data.data : undefined,
    nestedData.items,
    nestedData.enquiries,
  ].find(Array.isArray) as ApiEnquiry[] | undefined ?? [];
  const pagination = asRecord(root.pagination ?? data.pagination ?? nestedData.pagination);
  const rawTotal = pagination.total
    ?? pagination.totalItems
    ?? pagination.totalCount
    ?? nestedData.total
    ?? data.total
    ?? root.total;
  const parsedTotal = Number(rawTotal);
  const items = rawItems.map(mapApiEnquiry);

  return {
    items,
    total: Number.isFinite(parsedTotal) && parsedTotal >= 0
      ? Math.max(parsedTotal, items.length)
      : items.length,
  };
}

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

export const fetchEnquiries = createAsyncThunk<EnquiryListResponse, void, { rejectValue: string }>(
  "enquiries/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/enquiries");
      return extractEnquiries(response.data);
    } catch (error: unknown) {
      return rejectWithValue(getApiError(error, "Failed to load enquiries"));
    }
  },
);

export const addEnquiry = createAsyncThunk<
  Enquiry,
  CreateEnquiryPayload,
  { rejectValue: string; state: RootState }
>(
  "enquiries/addEnquiry",
  async (payload, { getState, rejectWithValue }) => {
    const { user, token } = getState().auth;
    const allowedRole = user?.role === "admin"
      || user?.role === "super_admin"
      || user?.role === "manager";
    const persistedToken = getAuthTokens().accessToken;
    if (!allowedRole || !token || token !== persistedToken) {
      return rejectWithValue(
        "Your sign-in changed or does not have permission to create enquiries. Sign in again with an admin or manager account.",
      );
    }

    try {
      const response = await api.post("/enquiries", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

export const deleteEnquiryApi = createAsyncThunk<
  string,
  string,
  { rejectValue: string; state: RootState }
>("enquiries/delete", async (id, { getState, rejectWithValue }) => {
  const role = getState().auth.user?.role;
  if (role !== "admin" && role !== "super_admin") {
    return rejectWithValue("Only administrators can delete enquiries.");
  }

  try {
    await api.delete(`/enquiries/${encodeURIComponent(id)}`);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(getApiError(error, "Failed to delete enquiry"));
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
        state.items = action.payload.items;
        state.total = action.payload.total;
      })
      .addCase(fetchEnquiries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load enquiries";
      })
      .addCase(addEnquiry.pending, (state) => {
        state.error = null;
      })
      .addCase(addEnquiry.fulfilled, (state, action) => {
        const alreadyExists = state.items.some((item) => item.id === action.payload.id);
        if (!alreadyExists) state.items.unshift(action.payload);
        state.total = Math.max(state.total + (alreadyExists ? 0 : 1), state.items.length);
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
      })
      .addCase(deleteEnquiryApi.fulfilled, (state, action) => {
        const existed = state.items.some((item) => item.id === action.payload);
        state.items = state.items.filter((item) => item.id !== action.payload);
        if (existed) state.total = Math.max(0, state.total - 1);
      })
      .addCase(deleteEnquiryApi.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete enquiry";
      });
  },
});

export const { clearEnquiryError, setEnquiryStatus } = enquiriesSlice.actions;
export default enquiriesSlice.reducer;
