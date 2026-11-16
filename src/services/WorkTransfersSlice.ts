import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "../api/axios";

export type WorkTransferStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface WorkTransfer {
  id: string;
  status: WorkTransferStatus;
  workOrderId: string;
  workOrderNumber: string;
  requestingTechnician: string;
  proposedTechnician: string;
  reason: string;
  note: string;
  requestedAt: string;
}

export interface TransferTarget {
  id: string;
  name: string;
  employeeNo: string;
}

interface TransferPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WorkTransfersState {
  items: WorkTransfer[];
  pagination: TransferPagination;
  fetchRequestId: string | null;
  loading: boolean;
  error: string | null;
  actionId: string | null;
  actionError: string | null;
  actionSuccess: string | null;
  targets: TransferTarget[];
  targetsWorkOrderId: string | null;
  targetsLoading: boolean;
  targetsError: string | null;
  reassigning: boolean;
  reassignError: string | null;
  reassignSuccess: string | null;
}

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : {};
const text = (value: unknown, fallback = ""): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : fallback;
const personName = (value: unknown): string => {
  if (typeof value === "string" && value.trim()) return value.trim();
  const person = record(value);
  const user = record(person.user);
  const fullName = [user.firstName ?? person.firstName, user.lastName ?? person.lastName]
    .filter((part) => typeof part === "string" && part.trim())
    .join(" ");
  return text(person.name ?? person.fullName, fullName || text(user.email ?? person.email, "Unknown technician"));
};
const unwrap = (value: unknown): { root: RecordValue; data: unknown; nested: RecordValue } => {
  const root = record(value);
  const data = root.data ?? value;
  const body = record(data);
  return { root, data, nested: record(body.data) };
};

const assertSuccess = (value: unknown) => {
  const envelope = record(value);
  if (envelope.success === false) {
    throw new Error(text(envelope.message, "The API rejected the request."));
  }
};

function rowsFromResponse(value: unknown, keys: string[]): RecordValue[] {
  const { root, data, nested } = unwrap(value);
  const body = record(data);
  const candidates = [
    Array.isArray(data) ? data : undefined,
    ...keys.map((key) => root[key]),
    ...keys.map((key) => body[key]),
    ...keys.map((key) => nested[key]),
    Array.isArray(body.data) ? body.data : undefined,
  ];
  const rows = candidates.find(Array.isArray);
  return Array.isArray(rows) ? rows.map(record) : [];
}

function paginationFromResponse(value: unknown, page: number, limit: number, itemCount: number): TransferPagination {
  const { root, data, nested } = unwrap(value);
  const body = record(data);
  const pagination = record(root.pagination ?? body.pagination ?? nested.pagination);
  const totalValue = pagination.total ?? pagination.totalItems ?? pagination.totalCount ?? nested.total ?? body.total ?? root.total;
  const parsedTotal = totalValue == null ? Number.NaN : Number(totalValue);
  const total = Number.isFinite(parsedTotal) && parsedTotal >= 0
    ? Math.max(parsedTotal, itemCount)
    : itemCount;
  const currentPage = Number(pagination.page) || page;
  const currentLimit = Number(pagination.limit) || limit;
  const pageCount = Number(pagination.totalPages ?? pagination.pages) || Math.ceil(total / currentLimit);
  return { page: currentPage, limit: currentLimit, total, totalPages: Math.max(1, pageCount) };
}

function mapTransfer(value: RecordValue): WorkTransfer {
  const workOrder = record(value.workOrder);
  const fromEmployee = value.fromEmployee ?? value.requestingEmployee ?? value.requestedByEmployee ?? value.employee;
  const toEmployee = value.toEmployee ?? value.requestedEmployee ?? value.targetEmployee;
  const rawStatus = text(value.status, "PENDING").toUpperCase();
  const status: WorkTransferStatus = rawStatus === "APPROVED" || rawStatus === "REJECTED" ? rawStatus : "PENDING";
  return {
    id: text(value.id ?? value.transferId),
    status,
    workOrderId: text(value.workOrderId ?? workOrder.id),
    workOrderNumber: text(value.workOrderNumber ?? workOrder.workOrderNumber ?? workOrder.reference, "Work order"),
    requestingTechnician: personName(value.requestingTechnician ?? value.requestingTechnicianName ?? fromEmployee),
    proposedTechnician: personName(value.proposedTechnician ?? value.proposedTechnicianName ?? toEmployee),
    reason: text(value.reason),
    note: text(value.note),
    requestedAt: text(value.requestedAt ?? value.createdAt),
  };
}

function apiError(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = record(error.response?.data).message;
    if (Array.isArray(message)) return message.map((entry) => text(entry)).join(", ");
    if (typeof message === "string") return message;
    if (!error.response) return "Unable to connect to the API. Check the server connection and try again.";
    return `${fallback} (HTTP ${error.response.status}).`;
  }
  return error instanceof Error ? error.message : fallback;
}

const initialState: WorkTransfersState = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
  fetchRequestId: null,
  loading: false,
  error: null,
  actionId: null,
  actionError: null,
  actionSuccess: null,
  targets: [],
  targetsWorkOrderId: null,
  targetsLoading: false,
  targetsError: null,
  reassigning: false,
  reassignError: null,
  reassignSuccess: null,
};

export const fetchWorkTransfers = createAsyncThunk<
  { items: WorkTransfer[]; pagination: TransferPagination },
  { status: WorkTransferStatus; page: number; limit?: number },
  { rejectValue: string }
>("workTransfers/fetch", async ({ status, page, limit = 20 }, { rejectWithValue }) => {
  try {
    const response = await api.get("/work-transfers", { params: { status, page, limit } });
    assertSuccess(response.data);
    const rows = rowsFromResponse(response.data, ["items", "workTransfers", "transfers"]);
    return {
      items: rows.map(mapTransfer).filter((item) => item.id),
      pagination: paginationFromResponse(response.data, page, limit, rows.length),
    };
  } catch (error) {
    return rejectWithValue(apiError(error, "Could not load work transfers"));
  }
});

export const decideWorkTransfer = createAsyncThunk<
  { transferId: string; decision: "APPROVED" | "REJECTED" },
  { transferId: string; decision: "APPROVED" | "REJECTED"; note?: string },
  { rejectValue: string }
>("workTransfers/decide", async ({ transferId, decision, note }, { rejectWithValue }) => {
  try {
    const response = await api.patch(`/work-transfers/${encodeURIComponent(transferId)}/decision`, {
      decision,
      ...(note?.trim() ? { note: note.trim() } : {}),
    });
    assertSuccess(response.data);
    return { transferId, decision };
  } catch (error) {
    return rejectWithValue(apiError(error, "Could not save the transfer decision"));
  }
});

export const fetchTransferTargets = createAsyncThunk<
  { workOrderId: string; items: TransferTarget[] },
  string,
  { rejectValue: string }
>("workTransfers/fetchTargets", async (workOrderId, { rejectWithValue }) => {
  try {
    const response = await api.get("/work-transfers/reassignment-targets", { params: { workOrderId } });
    assertSuccess(response.data);
    const rows = rowsFromResponse(response.data, ["items", "employees", "technicians", "targets"]);
    const items = rows.flatMap((item): TransferTarget[] => {
      const employee = record(item.employee);
      const id = text(item.employeeId ?? item.id ?? employee.id);
      if (!id) return [];
      const active = item.isActive ?? employee.isActive;
      const available = item.isAvailable ?? item.available;
      const eligible = item.isEligible ?? item.eligible;
      if (active === false || available === false || eligible === false) return [];
      const name = personName(item.employee ?? item);
      return [{ id, name, employeeNo: text(item.employeeNo ?? employee.employeeNo) }];
    });
    return { workOrderId, items };
  } catch (error) {
    const message = axios.isAxiosError(error) && error.response?.status === 404
      ? "Eligible technician availability is not exposed to admin/manager accounts yet. The backend must add an authorized same-company target endpoint."
      : apiError(error, "Could not load eligible technicians");
    return rejectWithValue(message);
  }
});

export interface ReassignWorkPayload {
  workOrderId: string;
  fromEmployeeId: string;
  toEmployeeId: string;
  reason: string;
  note?: string;
}

export const reassignWork = createAsyncThunk<
  { workOrderId: string },
  ReassignWorkPayload,
  { rejectValue: string }
>("workTransfers/reassign", async (payload, { rejectWithValue }) => {
  try {
    const response = await api.post("/work-transfers/reassign", {
      workOrderId: payload.workOrderId,
      fromEmployeeId: payload.fromEmployeeId,
      toEmployeeId: payload.toEmployeeId,
      reason: payload.reason.trim(),
      ...(payload.note?.trim() ? { note: payload.note.trim() } : {}),
    });
    assertSuccess(response.data);
    return { workOrderId: payload.workOrderId };
  } catch (error) {
    return rejectWithValue(apiError(error, "Could not reassign the work order"));
  }
});

const workTransfersSlice = createSlice({
  name: "workTransfers",
  initialState,
  reducers: {
    clearWorkTransferMessages(state) {
      state.actionError = null;
      state.actionSuccess = null;
      state.reassignError = null;
      state.reassignSuccess = null;
    },
    clearTransferTargets(state) {
      state.targets = [];
      state.targetsWorkOrderId = null;
      state.targetsLoading = false;
      state.targetsError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkTransfers.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.fetchRequestId = action.meta.requestId;
      })
      .addCase(fetchWorkTransfers.fulfilled, (state, action) => {
        if (state.fetchRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.fetchRequestId = null;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWorkTransfers.rejected, (state, action) => {
        if (state.fetchRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.fetchRequestId = null;
        state.error = action.payload ?? "Could not load work transfers";
      })
      .addCase(decideWorkTransfer.pending, (state, action) => {
        state.actionId = action.meta.arg.transferId;
        state.actionError = null;
        state.actionSuccess = null;
      })
      .addCase(decideWorkTransfer.fulfilled, (state, action) => {
        state.actionId = null;
        state.actionSuccess = action.payload.decision === "APPROVED" ? "Transfer approved." : "Transfer rejected.";
      })
      .addCase(decideWorkTransfer.rejected, (state, action) => {
        state.actionId = null;
        state.actionError = action.payload ?? "Could not save the transfer decision";
      })
      .addCase(fetchTransferTargets.pending, (state, action) => {
        state.targets = [];
        state.targetsWorkOrderId = action.meta.arg;
        state.targetsLoading = true;
        state.targetsError = null;
      })
      .addCase(fetchTransferTargets.fulfilled, (state, action) => {
        if (state.targetsWorkOrderId !== action.payload.workOrderId) return;
        state.targetsLoading = false;
        state.targets = action.payload.items;
        state.targetsWorkOrderId = action.payload.workOrderId;
      })
      .addCase(fetchTransferTargets.rejected, (state, action) => {
        if (state.targetsWorkOrderId !== action.meta.arg) return;
        state.targetsLoading = false;
        state.targetsError = action.payload ?? "Could not load eligible technicians";
      })
      .addCase(reassignWork.pending, (state) => {
        state.reassigning = true;
        state.reassignError = null;
        state.reassignSuccess = null;
      })
      .addCase(reassignWork.fulfilled, (state) => {
        state.reassigning = false;
        state.reassignSuccess = "Work reassigned successfully.";
      })
      .addCase(reassignWork.rejected, (state, action) => {
        state.reassigning = false;
        state.reassignError = action.payload ?? "Could not reassign the work order";
      });
  },
});

export const { clearWorkTransferMessages, clearTransferTargets } = workTransfersSlice.actions;
export default workTransfersSlice.reducer;