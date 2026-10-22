
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

export const createServiceRequestApi = createAsyncThunk<
  ServiceRequest,
  Omit<ServiceRequest, "id" | "createdAt">,
  { rejectValue: string }
>(
  "serviceRequests/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/service-requests", payload);
      return response.data.data ?? response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ??
          "Failed to create service request"
      );
    }
  }
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
      .addCase(createServiceRequestApi.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createServiceRequestApi.fulfilled, (state, action) => {
        state.loading = false;
        state.items.unshift(action.payload);
      })
      .addCase(createServiceRequestApi.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to create service request";
      });
  },
});

export default serviceRequestsSlice.reducer;
