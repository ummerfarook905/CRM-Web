
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

import { api } from "../api/axios";
import type { Customer } from "../models/admin/Customer";

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  updating: boolean;
  deleting: boolean;
  error: string | null;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface UpdateCustomerPayload {
  id: string;
  changes: UpdateCustomerDto;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  updating: false,
  deleting: false,
  error: null,
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;

    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;

    return error.response
      ? "The customer request failed."
      : "Unable to connect to the server.";
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}


interface ApiAddress {
  id?: string | number;
  name?: string | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  type?: string | null;
}

interface ApiCustomer {
  id: string;
  userId?: string;
  isActive?: boolean;
  notes?: string | null;
  user?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
  } | null;
  addresses?: ApiAddress[] | null;
}

function mapApiCustomer(apiCustomer: ApiCustomer): Customer {
  const user = apiCustomer.user;
  const name = [
    user?.firstName,
    user?.lastName,
  ]
    .filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0
    )
    .join(" ");

  const addresses = apiCustomer.addresses ?? [];

  return {
    id: apiCustomer.id,
    customerCode: `CUS-${apiCustomer.id.slice(0, 8).toUpperCase()}`,
    name: name || user?.email || "Unknown Customer",
    company: name || "—",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    city: addresses[0]?.city ?? "—",
    status: apiCustomer.isActive ? "Active" : "Inactive",

    serviceLocations: addresses.map((address, index) => ({
      id: index + 1,
      name: address.name ?? "Service Location",
      address: address.address ?? address.street ?? "",
      city: address.city ?? "",
      type: address.type ?? "Service",
    })),

    upcomingMaintenance: [],
    serviceHistory: [],
  };
}


// Supports either a direct array or a { data: [...] } response.

function extractCustomers(response: unknown): Customer[] {
  const body = response as {
    success?: boolean;
    data?: unknown;
  };

  if (!Array.isArray(body?.data)) {
    throw new Error(
      "Invalid customers API response: expected data array."
    );
  }

  return (body.data as ApiCustomer[]).map(mapApiCustomer);
}



function extractCustomer(response: unknown): Customer {
  const body = response as {
    data?: unknown;
    customer?: unknown;
  };

  const raw =
    body?.data && !Array.isArray(body.data)
      ? body.data
      : body?.customer ?? response;

  if (!raw || typeof raw !== "object") {
    throw new Error("Invalid customer API response.");
  }

  return mapApiCustomer(raw as ApiCustomer);
}


export const fetchCustomers = createAsyncThunk<
  Customer[],
  void,
  { rejectValue: string }
>("customers/fetchCustomers", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/customers");
    return extractCustomers(response.data);
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const updateCustomer = createAsyncThunk<
  Customer,
  UpdateCustomerPayload,
  { rejectValue: string }
>(
  "customers/updateCustomer",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      const response = await api.patch(
        `/customers/${encodeURIComponent(id)}`,
        changes
      );

      return extractCustomer(response.data);
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

export const deleteCustomer = createAsyncThunk<
  Customer["id"],
  Customer["id"],
  { rejectValue: string }
>(
  "customers/deleteCustomer",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(
        `/customers/${encodeURIComponent(String(id))}`
      );

      return id;
    } catch (error: unknown) {
      return rejectWithValue(getErrorMessage(error));
    }
  }
);

const customerSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    clearCustomerError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customers = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to load customers.";
      })

      .addCase(updateCustomer.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateCustomer.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.customers.findIndex(
          (customer) => customer.id === action.payload.id
        );

        if (index !== -1) {
          state.customers[index] = action.payload;
        }
      })
      .addCase(updateCustomer.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload ?? "Failed to update customer.";
      })

      .addCase(deleteCustomer.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteCustomer.fulfilled, (state, action) => {
        state.deleting = false;
        state.customers = state.customers.filter(
          (customer) => customer.id !== action.payload
        );
      })
      .addCase(deleteCustomer.rejected, (state, action) => {
        state.deleting = false;
        state.error =
          action.payload ?? "Failed to delete customer.";
      });
  },
});

export const { clearCustomerError } = customerSlice.actions;
export default customerSlice.reducer;
