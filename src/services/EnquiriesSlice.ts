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

type ApiErrorShape = { response?: { data?: { message?: string } } };
function getApiError(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const message = (error as ApiErrorShape).response?.data?.message;
    if (message) return message;
  }
  return fallback;
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
      return mapApiEnquiry(result as ApiEnquiry);
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
