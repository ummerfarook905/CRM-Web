
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api/axios";

import {
  mapApiEnquiry,
  type ApiEnquiry,
  type Enquiry,
  type EnquiryStatus,
  type CreateEnquiryPayload,
} from "../models/admin/Enquiry";

export type {
  Enquiry,
  EnquiryStatus,
  Priority,
} from "../models/admin/Enquiry";

interface EnquiryState {
  items: Enquiry[];
  loading: boolean;
  error: string | null;
}

const initialState: EnquiryState = {
  items: [],
  loading: false,
  error: null,
};

/* Fetch enquiries from the backend */
export const fetchEnquiries = createAsyncThunk<
  Enquiry[],
  void,
  { rejectValue: string }
>("enquiries/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/enquiries");
    const result = response.data;

    const rows: ApiEnquiry[] = Array.isArray(result)
      ? result
      : Array.isArray(result?.data)
        ? result.data
        : [];

    return rows.map(mapApiEnquiry);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to load enquiries"
    );
  }
});

/* Create an enquiry */

export const addEnquiry = createAsyncThunk<
  Enquiry,
  CreateEnquiryPayload,
  { rejectValue: string }
>(
  "enquiries/create",
  async (payload, { rejectWithValue }) => {
    try {
      const requestBody: CreateEnquiryPayload = {
        name: payload.name.trim(),
        phone: payload.phone.trim(),
        email: payload.email?.trim() || null,
        serviceId: payload.serviceId || null,
        serviceLocationId: payload.serviceLocationId || null,
        message: payload.message?.trim() || null,
      };

      const response = await api.post("/enquiries", requestBody);
      const result = response.data?.data ?? response.data;

      if (!result?.id) {
        return rejectWithValue(
          "The API response did not contain a created enquiry."
        );
      }

      return mapApiEnquiry(result as ApiEnquiry);
    } catch (error: any) {
      const message = error.response?.data?.message;

      return rejectWithValue(
        Array.isArray(message)
          ? message.join(", ")
          : message ?? "Failed to create enquiry."
      );
    }
  }
);


/* Update an enquiry using its UUID string */
export const updateEnquiryApi = createAsyncThunk<
  Enquiry,
  { id: string; updates: Partial<Enquiry> },
  { rejectValue: string }
>(
  "enquiries/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/enquiries/${id}`, updates);
      const result = response.data?.data ?? response.data;

      return mapApiEnquiry(result as ApiEnquiry);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ?? "Failed to update enquiry"
      );
    }
  }
);

const enquiriesSlice = createSlice({
  name: "enquiries",
  initialState,
  reducers: {
    clearEnquiryError(state) {
      state.error = null;
    },

    setEnquiryStatus(
      state,
      action: PayloadAction<{
        id: string;
        status: EnquiryStatus;
      }>
    ) {
      const enquiry = state.items.find(
        (item) => item.id === action.payload.id
      );

      if (enquiry) {
        enquiry.status = action.payload.status;
      }
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
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateEnquiryApi.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update enquiry";
      });
  },
});

export const { clearEnquiryError, setEnquiryStatus } =
  enquiriesSlice.actions;

export default enquiriesSlice.reducer;
