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

const errorText = (value: unknown, fallback: string): string => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map((item) => errorText(item, "")).filter(Boolean).join(", ") || fallback;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return errorText(record.message ?? record.error ?? record.detail, fallback);
  }
  return fallback;
};

/** Keep API values from leaking as plain objects into React text children. */
const displayText = (value: unknown): string => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const label = record.name ?? record.label ?? record.value ?? record.minutes;
    return typeof label === "string" || typeof label === "number"
      ? String(label)
      : "";
  }

  return "";
};

const durationMinutes = (value: unknown): string => {
  const raw =
    value && typeof value === "object"
      ? (value as Record<string, unknown>).minutes ??
        (value as Record<string, unknown>).value
      : value;

  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  if (typeof raw !== "string") return "";

  const text = raw.trim();
  const match = text.match(/^(\d+(?:\.\d+)?)\s*(minutes?|mins?|hours?|hrs?)?$/i);
  if (!match) return "";

  const amount = Number(match[1]);
  const unit = match[2]?.toLowerCase() ?? "minutes";
  return String(unit.startsWith("h") ? amount * 60 : amount);
};

/** Convert the backend response into the fields your existing UI uses */
const mapApiService = (service: ApiService): Service => {
  const category = service.category as unknown;
  const categoryName =
    category && typeof category === "object"
      ? (category as Record<string, unknown>).name
      : category;
  const relatedCategoryId =
    category && typeof category === "object"
      ? (category as Record<string, unknown>).id
      : undefined;

  return {
    id: service.id,
    name: displayText(service.name),
    category: displayText(categoryName),
    categoryId: displayText(service.categoryId ?? relatedCategoryId),
    description: displayText(service.description),
    duration: durationMinutes(service.estimatedDuration),
    price: Number(service.basePrice) || 0,
    image: displayText(service.image),
    requiresMaintenance: Boolean(service.requiresMaintenance),
    defaultMaintenanceFrequency: displayText(
      service.defaultMaintenanceFrequency
    ) || null,
    status: service.isActive ? "Active" : "Inactive",
  };
};

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
      errorText(error.response?.data?.message, "Failed to fetch services.")
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
    console.error("Create service failed:", {
    status: error.response?.status,
    response: data,
  });

  return rejectWithValue(errorText(data?.message, "Failed to create service. Check the console."));
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
    return rejectWithValue(errorText(error.response?.data?.message, "Failed to update service."));
  }
});

export const deleteService = createAsyncThunk<
  number | string,
  number | string,
  { rejectValue: string }
>("services/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/services/${id}`);

    // Return the deleted service ID
    return id;
  } catch (error: any) {
    const data = error.response?.data;
    console.error("Delete service failed:", {
      status: error.response?.status,
      response: data,
    });

    return rejectWithValue(errorText(data?.message, "Failed to delete service."));
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
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (service) => service.id !== action.payload
        );

        state.error = null;
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete service.";
      });
      
  },
});

export const { clearServicesError } = servicesSlice.actions;
export default servicesSlice.reducer;
