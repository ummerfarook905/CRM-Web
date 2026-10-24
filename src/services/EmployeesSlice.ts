
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { api } from "../api/axios";

import {
  mapApiEmployee,
  type ApiEmployee,
  type Employee,
  type EmployeeStatus,
  type CreateEmployeePayload,
  type UpdateEmployeePayload,
} from "../models/admin/Employee";

export type {
  Employee,
  EmployeeStatus,
} from "../models/admin/Employee";

interface EmployeesState {
  items: Employee[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeesState = {
  items: [],
  loading: false,
  error: null,
};

function getErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: { message?: string | string[] };
        };
      }
    ).response;

    const message = response?.data?.message;

    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }

  return error instanceof Error ? error.message : fallback;
}

function getResponseData<T>(response: {
  data: { data?: T } & Record<string, unknown>;
}): T {
  return (response.data.data ?? response.data) as T;
}

/* Fetch employees */
export const fetchEmployees = createAsyncThunk<
  Employee[],
  void,
  { rejectValue: string }
>("employees/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/employees");
    const result = response.data?.data ?? response.data;

    // Supports a direct array, { items: [...] }, or
    // a paginated response containing { data: [...] }.
    const rows: ApiEmployee[] = Array.isArray(result)
      ? result
      : Array.isArray(result?.items)
        ? result.items
        : Array.isArray(result?.data)
          ? result.data
          : [];

    return rows.map(mapApiEmployee);
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to load employees"),
    );
  }
});

/* Create employee */
export const addEmployee = createAsyncThunk<
  Employee,
  CreateEmployeePayload,
  { rejectValue: string }
>("employees/create", async (payload, { rejectWithValue }) => {
  try {
    const requestBody: CreateEmployeePayload = {
      firstName: payload.firstName.trim(),
      lastName: payload.lastName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      password: payload.password,
      designation: payload.designation.trim(),
      ...(payload.joiningDate
        ? { joiningDate: payload.joiningDate }
        : {}),
    };

    const response = await api.post("/employees", requestBody);
    const result = getResponseData<ApiEmployee>(response);

    if (!result?.id) {
      return rejectWithValue(
        "The API response did not contain a created employee.",
      );
    }

    return mapApiEmployee(result);
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to create employee"),
    );
  }
});

/* Update employee */
export const updateEmployeeApi = createAsyncThunk<
  Employee,
  { id: string; updates: UpdateEmployeePayload },
  { rejectValue: string }
>(
  "employees/update",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const requestBody: UpdateEmployeePayload = {
        ...(updates.firstName !== undefined && {
          firstName: updates.firstName.trim(),
        }),
        ...(updates.lastName !== undefined && {
          lastName: updates.lastName.trim(),
        }),
        ...(updates.email !== undefined && {
          email: updates.email.trim().toLowerCase(),
        }),
        ...(updates.phone !== undefined && {
          phone: updates.phone.trim(),
        }),
        ...(updates.designation !== undefined && {
          designation: updates.designation.trim(),
        }),
        ...(updates.joiningDate !== undefined && {
          joiningDate: updates.joiningDate,
        }),
        ...(updates.isActive !== undefined && {
          isActive: updates.isActive,
        }),
      };

      const response = await api.patch(
        `/employees/${encodeURIComponent(id)}`,
        requestBody,
      );

      const result = getResponseData<ApiEmployee>(response);

      if (!result?.id) {
        return rejectWithValue(
          "The API response did not contain the updated employee.",
        );
      }

      return mapApiEmployee(result);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update employee"),
      );
    }
  },
);

/* Delete employee */
export const deleteEmployeeApi = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>("employees/delete", async (id, { rejectWithValue }) => {
  try {
    await api.delete(`/employees/${encodeURIComponent(id)}`);
    return id;
  } catch (error: unknown) {
    return rejectWithValue(
      getErrorMessage(error, "Failed to delete employee"),
    );
  }
});

/* Change active/inactive status using the backend endpoint */
export const setEmployeeStatusApi = createAsyncThunk<
  Employee,
  { id: string; isActive: boolean },
  { rejectValue: string }
>(
  "employees/setStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      // Change this route if your controller defines a different path.
      const response = await api.patch(
        `/employees/${encodeURIComponent(id)}/status`,
        { isActive },
      );

      const result = getResponseData<ApiEmployee>(response);
      return mapApiEmployee(result);
    } catch (error: unknown) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to update employee status"),
      );
    }
  },
);

const employeesSlice = createSlice({
  name: "employees",
  initialState,
  reducers: {
    clearEmployeeError(state) {
      state.error = null;
    },

    setEmployeeStatus(
      state,
      action: PayloadAction<{ id: string; status: EmployeeStatus }>,
    ) {
      const employee = state.items.find(
        (item) => item.id === action.payload.id,
      );

      if (employee) {
        employee.status = action.payload.status;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load employees";
      })

      // Create
      .addCase(addEmployee.pending, (state) => {
        state.error = null;
      })
      .addCase(addEmployee.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(addEmployee.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create employee";
      })

      // Update
      .addCase(updateEmployeeApi.pending, (state) => {
        state.error = null;
      })
      .addCase(updateEmployeeApi.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateEmployeeApi.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to update employee";
      })

      // Delete
      .addCase(deleteEmployeeApi.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteEmployeeApi.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (item) => item.id !== action.payload,
        );
      })
      .addCase(deleteEmployeeApi.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to delete employee";
      })

      // Status
      .addCase(setEmployeeStatusApi.pending, (state) => {
        state.error = null;
      })
      .addCase(setEmployeeStatusApi.fulfilled, (state, action) => {
        const index = state.items.findIndex(
          (item) => item.id === action.payload.id,
        );

        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(setEmployeeStatusApi.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to update employee status";
      });
  },
});

export const { clearEmployeeError, setEmployeeStatus } =
  employeesSlice.actions;

export default employeesSlice.reducer;
