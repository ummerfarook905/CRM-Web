
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

import { api } from "../api/axios";
import type { Customer } from "../models/admin/Customer";

interface CustomerState {
  customers: Customer[];
  loading: boolean;
  updating: boolean;
  deleting: boolean;
  creating: boolean;
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

export interface DeleteCustomerResult {
  id: string;
  deleted: boolean;
  deactivated: boolean;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}

const initialState: CustomerState = {
  customers: [],
  loading: false,
  updating: false,
  deleting: false,
  creating: false,
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

export interface CreateCustomerAddressPayload {
  customerId: string;
  name: string;
  address: string;
  city: string;
  type?: string;
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
    status: apiCustomer.isActive === false ? "Inactive" : "Active",

    serviceLocations: addresses.map((address) => ({
      id: address.id ?? "",
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

export const createCustomerAddress = createAsyncThunk<
  import("../models/admin/Customer").ServiceLocation,
  CreateCustomerAddressPayload,
  { rejectValue: string }
>("customers/createAddress", async ({ customerId, ...address }, { rejectWithValue }) => {
  const payload = { ...address, type: address.type ?? "Service" };
  const nestedPath = `/customers/${encodeURIComponent(customerId)}/addresses`;

  try {
    let response;
    try {
      response = await api.post(nestedPath, payload);
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error;
      try {
        response = await api.post("/addresses", { customerId, ...payload });
      } catch (fallbackError: unknown) {
        if (!axios.isAxiosError(fallbackError) || fallbackError.response?.status !== 404) throw fallbackError;
        response = await api.post("/service-locations", { customerId, ...payload });
      }
    }

    const body = response.data?.data ?? response.data;
    const result = body?.address ?? body;
    const id = result?.id ?? result?.addressId ?? result?.serviceLocationId;
    if (!result || (typeof id !== "string" && typeof id !== "number")) {
      throw new Error("The saved location response did not include its ID.");
    }

    return {
      id,
      name: result.name ?? payload.name,
      address: result.address ?? result.street ?? payload.address,
      city: result.city ?? payload.city,
      type: result.type ?? payload.type,
    };
  } catch (error: unknown) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const createCustomer = createAsyncThunk<
  Customer,
  CreateCustomerDto,
  { rejectValue: string }
>("customers/createCustomer", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/customers", {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password,
    });
    return extractCustomer(response.data);
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
  DeleteCustomerResult,
  Customer["id"],
  { rejectValue: string }
>(
  "customers/deleteCustomer",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(
        `/customers/${encodeURIComponent(String(id))}`
      );
      const payload = response.data?.data ?? response.data;
      if (!payload || typeof payload.id !== "string") {
        throw new Error("Invalid customer deletion response.");
      }
      return {
        id: payload.id,
        deleted: Boolean(payload.deleted),
        deactivated: Boolean(payload.deactivated),
      };
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

      .addCase(createCustomer.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.creating = false;
        state.customers.unshift(action.payload);
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload ?? "Failed to create customer.";
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
        if (action.payload.deactivated) {
          state.customers = state.customers.map((customer) =>
            String(customer.id) === String(action.payload.id)
              ? { ...customer, status: "Inactive" }
              : customer
          );
        } else {
          state.customers = state.customers.filter(
            (customer) => String(customer.id) !== String(action.payload.id)
          );
        }
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
