
import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { api } from "../api/axios";

export interface Service {
  id: number;
  name: string;
  category: string;
  description: string;
  duration: string;
  price: number;
  image?: string;
  requiresMaintenance: boolean;
  defaultMaintenanceFrequency: string;
  status: "Active" | "Inactive";
}

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

// GET /api/v1/services
export const fetchServices = createAsyncThunk<
  Service[],
  void,
  { rejectValue: string }
>("services/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/services");

    // Adjust if your API returns { data: { services: [] } }
    const result = response.data?.data ?? response.data;
    const items = Array.isArray(result)
      ? result
      : result.services;

    if (!Array.isArray(items)) {
      return rejectWithValue(
        "The services API did not return a list."
      );
    }

    return items;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ??
        "Failed to fetch services."
    );
  }
});

// POST /api/v1/services
export const createService = createAsyncThunk<
  Service,
  Omit<Service, "id">,
  { rejectValue: string }
>(
  "services/create",
  async (payload, { rejectWithValue }) => {
    try {
      const savedSession = localStorage.getItem("crm.auth.session");

      if (!savedSession) {
        return rejectWithValue("Login session not found. Please log in again.");
      }

      const session = JSON.parse(savedSession);
      const token = session?.token;

      if (!token) {
        return rejectWithValue("Access token not found in localStorage.");
      }

      console.log("Creating service with payload:", {
        ...payload,
        image: payload.image ? "[Image provided]" : "",
      });

      const response = await api.post("/services", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = response.data?.data ?? response.data;
      const service = result?.service ?? result;

      if (!service || typeof service !== "object" || service.id == null) {
        console.error("Unexpected create-service response:", response.data);
        return rejectWithValue(
          "The API response does not contain a valid created service."
        );
      }

      return service as Service;
    } catch (error: any) {
      const data = error.response?.data;

      console.error("Service API status:", error.response?.status);
      console.error("Full backend response:", JSON.stringify(data, null, 2));

      // Show every validation error returned by the backend.
      const fieldErrors = data?.errors?.fields;

      if (Array.isArray(fieldErrors)) {
        console.table(fieldErrors);
      }

      const message = Array.isArray(fieldErrors)
    ? fieldErrors
        .map((item: any) =>
          typeof item === "string"
            ? item
            : `${item.field ?? item.property ?? "Field"}: ${
                item.message ?? item.constraints
                  ? JSON.stringify(item.message ?? item.constraints)
                  : JSON.stringify(item)
              }`
        )
        .join("\n")
    : Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "Failed to create service.";

      return rejectWithValue(
        message);
    }
  }
);

// PATCH /api/v1/services/:id
export const updateService = createAsyncThunk<
  Service,
  Service,
  { rejectValue: string }
>("services/update", async (service, { rejectWithValue }) => {
  try {
    const response = await api.patch(
      `/services/${service.id}`,
      service
    );

    const result = response.data?.data ?? response.data;
    return result.service ?? result;
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ??
        "Failed to update service."
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
        state.error =
          action.payload ?? "Failed to fetch services.";
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(createService.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to create service.";
      })
      .addCase(updateService.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id
        );

        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateService.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to update service.";
      });
  },
});

export const { clearServicesError } = servicesSlice.actions;
export default servicesSlice.reducer;
