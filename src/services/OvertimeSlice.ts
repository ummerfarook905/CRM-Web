import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "../api/axios";

// ─── Types ──────────────────────────────────────────────

export type OvertimeStatus = "Pending" | "Approved" | "Rejected";

export type ApiOvertimeStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface ListOvertimeDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: ApiOvertimeStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface OvertimeDecisionDto {
  decision: "APPROVED" | "REJECTED";
  note?: string;
}

export interface RecordOvertimePaymentDto {
  amount: number;
  paymentReference?: string;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
  date: string;
  regularHours?: number;
  overtimeHours?: number;
  reason?: string;
  status: OvertimeStatus;
  submittedAt?: string;
  reviewedAt?: string;
  note?: string;
  amount?: number;
  paymentReference?: string;
}

interface ApiOvertime {
  id: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  designation?: string;
  date?: string;
  overtimeDate?: string;
  regularHours?: number;
  overtimeHours?: number;
  hours?: number;
  reason?: string;
  status?: string;
  submittedAt?: string;
  createdAt?: string;
  reviewedAt?: string;
  note?: string;
  amount?: number;
  paymentReference?: string;
  employee?: {
    id?: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    department?: string;
    designation?: string;
  };
  [key: string]: unknown;
}

interface OvertimeListResponse {
  items: OvertimeRequest[];
  total: number;
  page: number;
  limit: number;
}

interface OvertimeState {
  requests: OvertimeRequest[];
  loading: boolean;
  updating: boolean;
  paying: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}

const initialState: OvertimeState = {
  requests: [],
  loading: false,
  updating: false,
  paying: false,
  error: null,
  total: 0,
  page: 1,
  limit: 10,
};

// ─── Helpers ───────────────────────────────────────────

const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string | string[] }
      | undefined;

    if (Array.isArray(data?.message)) {
      return data.message.join(", ");
    }

    return (
      data?.message ||
      error.message ||
      "An API error occurred."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
};

const mapApiStatus = (status?: string): OvertimeStatus => {
  switch (status?.toUpperCase()) {
    case "APPROVED":
      return "Approved";
    case "REJECTED":
      return "Rejected";
    default:
      return "Pending";
  }
};

const mapApiOvertime = (
  item: ApiOvertime,
): OvertimeRequest => {
  const employee = item.employee;

  const employeeName =
    item.employeeName ||
    employee?.name ||
    [employee?.firstName, employee?.lastName]
      .filter(Boolean)
      .join(" ") ||
    "Unknown Employee";

  return {
    id: item.id,
    employeeId: item.employeeId || employee?.id || "",
    employeeName,
    department: item.department || employee?.department || "",
    designation: item.designation || employee?.designation || "",
    date: item.date || item.overtimeDate || "",
    regularHours: item.regularHours,
    overtimeHours: item.overtimeHours ?? item.hours,
    reason: item.reason || "",
    status: mapApiStatus(item.status),
    submittedAt: item.submittedAt || item.createdAt,
    reviewedAt: item.reviewedAt,
    note: item.note,
    amount: item.amount,
    paymentReference: item.paymentReference,
  };
};

const extractList = (
  response: unknown,
): {
  items: ApiOvertime[];
  total: number;
  page: number;
  limit: number;
} => {
  const root = response as Record<string, unknown>;

  const body =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const rawItems =
    Array.isArray(body?.items)
      ? body.items
      : Array.isArray(body?.requests)
        ? body.requests
        : Array.isArray(body?.data)
          ? body.data
          : Array.isArray(response)
            ? response
            : [];

  const pagination =
    body?.pagination && typeof body.pagination === "object"
      ? (body.pagination as Record<string, unknown>)
      : body;

  return {
    items: rawItems as ApiOvertime[],
    total:
      typeof pagination?.total === "number"
        ? pagination.total
        : rawItems.length,
    page:
      typeof pagination?.page === "number"
        ? pagination.page
        : 1,
    limit:
      typeof pagination?.limit === "number"
        ? pagination.limit
        : rawItems.length || 10,
  };
};

const extractItem = (response: unknown): ApiOvertime => {
  const root = response as Record<string, unknown>;

  const body =
    root?.data && typeof root.data === "object"
      ? (root.data as Record<string, unknown>)
      : root;

  const item =
    body?.request && typeof body.request === "object"
      ? body.request
      : body?.overtime && typeof body.overtime === "object"
        ? body.overtime
        : body;

  if (!item || typeof item !== "object" || !("id" in item)) {
    throw new Error(
      "The API did not return an overtime request. Check the endpoint response.",
    );
  }

  return item as ApiOvertime;
};

// ─── Fetch Overtime ─────────────────────────────────────

export const fetchOvertime = createAsyncThunk<
  OvertimeListResponse,
  ListOvertimeDto | undefined,
  { rejectValue: string }
>(
  "overtime/fetchOvertime",
  async (params, { rejectWithValue }) => {
    try {
      // Change this route if your backend controller uses another path.
      const response = await api.get("/overtime", { params });

      const result = extractList(response.data);

      return {
        items: result.items.map(mapApiOvertime),
        total: result.total,
        page: result.page,
        limit: result.limit,
      };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Approve / Reject Overtime ──────────────────────────

export const decideOvertime = createAsyncThunk<
  OvertimeRequest,
  {
    id: string;
    changes: OvertimeDecisionDto;
  },
  { rejectValue: string }
>(
  "overtime/decideOvertime",
  async ({ id, changes }, { rejectWithValue }) => {
    try {
      // Change this route if your backend controller uses another path.
      const response = await api.patch(
        `/overtime/${encodeURIComponent(id)}/decision`,
        changes,
      );

      return mapApiOvertime(extractItem(response.data));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Record Overtime Payment ────────────────────────────

export const recordOvertimePayment = createAsyncThunk<
  OvertimeRequest,
  {
    id: string;
    payment: RecordOvertimePaymentDto;
  },
  { rejectValue: string }
>(
  "overtime/recordOvertimePayment",
  async ({ id, payment }, { rejectWithValue }) => {
    try {
      // Change this route if your backend controller uses another path.
      const response = await api.post(
        `/overtime/${encodeURIComponent(id)}/payments`,
        payment,
      );

      return mapApiOvertime(extractItem(response.data));
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

// ─── Redux Slice ───────────────────────────────────────

const overtimeSlice = createSlice({
  name: "overtime",
  initialState,
  reducers: {
    clearOvertimeError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchOvertime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOvertime.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload.items;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.limit = action.payload.limit;
      })
      .addCase(fetchOvertime.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Failed to fetch overtime requests.";
      })

      // Approve / Reject
      .addCase(decideOvertime.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(decideOvertime.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.requests.findIndex(
          (request) => request.id === action.payload.id,
        );

        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(decideOvertime.rejected, (state, action) => {
        state.updating = false;
        state.error =
          action.payload || "Failed to update overtime request.";
      })

      // Payment
      .addCase(recordOvertimePayment.pending, (state) => {
        state.paying = true;
        state.error = null;
      })
      .addCase(recordOvertimePayment.fulfilled, (state, action) => {
        state.paying = false;

        const index = state.requests.findIndex(
          (request) => request.id === action.payload.id,
        );

        if (index !== -1) {
          state.requests[index] = action.payload;
        }
      })
      .addCase(recordOvertimePayment.rejected, (state, action) => {
        state.paying = false;
        state.error =
          action.payload || "Failed to record overtime payment.";
      });
  },
});

export const { clearOvertimeError } = overtimeSlice.actions;
export default overtimeSlice.reducer;

