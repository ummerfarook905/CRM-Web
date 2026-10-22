import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/axios";

import type {
  Service,
  CreateServicePayload,
  ApiService,
} from "../models/admin/Service";



interface ServicesState {
  items: Service[];
  loading: boolean;
  error: string | null;
}

const initialState: ServicesState = {
  items: [],
  loading: false,
  error: null,
};

/** Convert the backend response into the fields your existing UI uses */
const mapApiService = (service: ApiService): Service => ({
  id: service.id,
  name: service.name,
  category: service.category?.name ?? "",
  categoryId: service.categoryId,
  description: service.description,
  duration: service.estimatedDuration,
  price: Number(service.basePrice),
  image: service.image ?? "",
  requiresMaintenance: service.requiresMaintenance,
  defaultMaintenanceFrequency: service.defaultMaintenanceFrequency,
  status: service.isActive ? "Active" : "Inactive",
});

export const fetchServices = createAsyncThunk<
  Service[],
  void,
  { rejectValue: string }
>("services/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/services");
    const result = response.data?.data ?? response.data;
    const items = Array.isArray(result) ? result : result.services;

    if (!Array.isArray(items)) {
      return rejectWithValue("The services API did not return a list.");
    }

    return items.map(mapApiService);
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to fetch services."
    );
  }
});

export const createService = createAsyncThunk<
  Service,
  CreateServicePayload,
  { rejectValue: string }
>("services/create", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/services", payload);
    const result = response.data?.data ?? response.data;
    const service = result?.service ?? result;

    if (!service || service.id == null) {
      return rejectWithValue(
        "The API response does not contain a valid created service."
      );
    }

    return mapApiService(service as ApiService);
  } catch (error: any) {
    const data = error.response?.data;
    const messages = data?.message;

    return rejectWithValue(
      Array.isArray(messages)
        ? messages.join(", ")
        : messages ?? "Failed to create service."
    );
  }
});

export const updateService = createAsyncThunk<
  Service,
  { id: number | string } & Partial<CreateServicePayload>,
  { rejectValue: string }
>("services/update", async (service, { rejectWithValue }) => {
  try {
    const { id, ...payload } = service;
    const response = await api.patch(`/services/${id}`, payload);
    const result = response.data?.data ?? response.data;
    return mapApiService((result?.service ?? result) as ApiService);
  } catch (error: any) {
    const messages = error.response?.data?.message;

    return rejectWithValue(
      Array.isArray(messages)
        ? messages.join(", ")
        : messages ?? "Failed to update service."
    );
  }
});

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    clearServicesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to fetch services.";
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
        state.error = null;
      })
      .addCase(createService.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create service.";
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update service.";
      });
  },
});

export const { clearServicesError } = servicesSlice.actions;
export default servicesSlice.reducer;