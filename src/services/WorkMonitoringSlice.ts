import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { api } from "../api/axios";

export interface WorkAssignmentInfo {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  status: string;
  assignedAt: string;
  acceptedAt: string;
  startedAt: string;
  completedAt: string;
}

export interface WorkOrderPhoto {
  id: string;
  imageUrl: string;
  caption: string;
  createdAt: string;
}

export interface WorkStatusHistory {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  note: string;
  createdAt: string;
  changedById: string;
}

export interface WorkServiceReport {
  id: string;
  reportNumber: string;
  status: string;
  updatedAt: string;
  workSummary: string;
  workPerformed: string;
  issuesFound: string;
  materialsUsed: string;
  recommendations: string;
  completionRemarks: string;
}

export interface MonitoredWorkOrder {
  id: string;
  reference: string;
  bookingId: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  company: string;
  service: string;
  location: string;
  manager: string;
  priority: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  instructions: string;
  status: string;
  completedAt: string;
  createdAt: string;
  updatedAt: string;
  assignments: WorkAssignmentInfo[];
  serviceReport: WorkServiceReport | null;
  photoCount: number;
  statusLogCount: number;
}

export interface WorkOrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface WorkMonitoringState {
  items: MonitoredWorkOrder[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
  detail: MonitoredWorkOrder | null;
  detailLoading: boolean;
  detailError: string | null;
  history: WorkStatusHistory[];
  historyWorkOrderId: string | null;
  historyLoading: boolean;
  photos: WorkOrderPhoto[];
  photosWorkOrderId: string | null;
  photosLoading: boolean;
  reportUpdating: boolean;
  reportError: string | null;
}

type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue =>
  value && typeof value === "object" ? value as RecordValue : {};
const valueText = (value: unknown, fallback = ""): string =>
  typeof value === "string" || typeof value === "number" ? String(value) : fallback;

const personName = (value: unknown): string => {
  const item = record(value);
  const user = record(item.user);
  const joined = [user.firstName, user.lastName].filter(Boolean).join(" ");
  const direct = [item.firstName, item.lastName].filter(Boolean).join(" ");
  return valueText(item.name ?? item.fullName, joined || direct);
};

const mapAssignment = (value: unknown): WorkAssignmentInfo => {
  const item = record(value);
  const employee = record(item.employee);
  return {
    id: valueText(item.id),
    employeeId: valueText(item.employeeId ?? employee.id),
    employeeName: personName(employee) || "Unassigned technician",
    employeeNo: valueText(employee.employeeNo),
    status: valueText(item.status, "ASSIGNED").replaceAll("_", " "),
    assignedAt: valueText(item.assignedAt),
    acceptedAt: valueText(item.acceptedAt),
    startedAt: valueText(item.startedAt),
    completedAt: valueText(item.completedAt),
  };
};

const mapReport = (value: unknown): WorkServiceReport | null => {
  if (!value || typeof value !== "object") return null;
  const item = record(value);
  return {
    id: valueText(item.id),
    reportNumber: valueText(item.reportNumber),
    status: valueText(item.status, "DRAFT").replaceAll("_", " "),
    updatedAt: valueText(item.updatedAt),
    workSummary: valueText(item.workSummary),
    workPerformed: valueText(item.workPerformed),
    issuesFound: valueText(item.issuesFound),
    materialsUsed: valueText(item.materialsUsed),
    recommendations: valueText(item.recommendations),
    completionRemarks: valueText(item.completionRemarks),
  };
};

export const mapWorkOrder = (value: unknown): MonitoredWorkOrder => {
  const item = record(value);
  const customer = record(item.customer);
  const customerUser = record(customer.user);
  const service = record(item.service);
  const location = record(item.serviceLocation);
  const booking = record(item.booking);
  const counts = record(item._count);
  const address = [location.address, location.city, location.state]
    .map((part) => valueText(part))
    .filter(Boolean)
    .join(", ");
  return {
    id: valueText(item.id),
    reference: valueText(item.workOrderNumber ?? item.id, "Work order"),
    bookingId: valueText(item.bookingId ?? booking.id),
    customer: personName(customer) || "Unknown customer",
    customerPhone: valueText(customerUser.phone),
    customerEmail: valueText(customerUser.email),
    company: valueText(customer.companyName ?? customer.company ?? customer.businessName, "—"),
    service: valueText(service.name, "Service not specified"),
    location: [valueText(location.locationName), address, valueText(location.pincode)].filter(Boolean).join(" · ") || "—",
    manager: personName(item.manager) || "Unassigned manager",
    priority: valueText(item.priority, "MEDIUM").replaceAll("_", " "),
    scheduledDate: valueText(item.scheduledDate ?? booking.preferredDate),
    scheduledStartTime: valueText(item.scheduledStartTime ?? booking.preferredTime),
    scheduledEndTime: valueText(item.scheduledEndTime),
    instructions: valueText(item.instructions),
    status: valueText(item.status, "ASSIGNED").replaceAll("_", " "),
    completedAt: valueText(item.completedAt),
    createdAt: valueText(item.createdAt),
    updatedAt: valueText(item.updatedAt),
    assignments: Array.isArray(item.assignments) ? item.assignments.map(mapAssignment) : [],
    serviceReport: mapReport(item.serviceReport),
    photoCount: Number(counts.photos) || 0,
    statusLogCount: Number(counts.statusLogs) || 0,
  };
};

const unwrap = (value: unknown): unknown => record(value).data ?? value;

const errorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = record(error.response?.data).message;
    if (Array.isArray(message)) return message.map((item) => valueText(item)).join(", ");
    if (typeof message === "string") return message;
    return error.response ? "The work monitoring request failed." : "Unable to connect to the API.";
  }
  return error instanceof Error ? error.message : "Unexpected work monitoring error.";
};

export const fetchWorkOrders = createAsyncThunk<
  { items: MonitoredWorkOrder[]; pagination: Pagination },
  WorkOrderQuery,
  { rejectValue: string }
>("workMonitoring/fetchWorkOrders", async (query, { rejectWithValue }) => {
  try {
    const params = Object.fromEntries(
      Object.entries(query).filter(([, value]) => value !== undefined && value !== ""),
    );
    const response = await api.get("/work-orders", { params });
    const root = record(response.data);
    const body = record(root.data);
    const rows = Array.isArray(root.data)
      ? root.data
      : Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.workOrders)
          ? body.workOrders
          : Array.isArray(root.items)
            ? root.items
            : [];
    const pageInfo = record(root.pagination ?? body.pagination);
    const page = Number(pageInfo.page) || query.page || 1;
    const limit = Number(pageInfo.limit) || query.limit || 20;
    const total = Number(pageInfo.total) || rows.length;
    return {
      items: rows.map(mapWorkOrder),
      pagination: {
        page,
        limit,
        total,
        totalPages: Number(pageInfo.totalPages) || Math.ceil(total / limit),
      },
    };
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchWorkOrderDetail = createAsyncThunk<
  MonitoredWorkOrder,
  string,
  { rejectValue: string }
>("workMonitoring/fetchDetail", async (id, { rejectWithValue }) => {
  try {
    const response = await api.get("/work-orders/" + encodeURIComponent(id));
    return mapWorkOrder(unwrap(response.data));
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchWorkOrderHistory = createAsyncThunk<
  { workOrderId: string; items: WorkStatusHistory[] },
  string,
  { rejectValue: string }
>("workMonitoring/fetchHistory", async (id, { rejectWithValue }) => {
  try {
    const response = await api.get("/work-orders/" + encodeURIComponent(id) + "/status-history");
    const data = unwrap(response.data);
    return {
      workOrderId: id,
      items: Array.isArray(data) ? data.map((entry) => {
        const item = record(entry);
        return {
          id: valueText(item.id),
          fromStatus: item.fromStatus == null ? null : valueText(item.fromStatus).replaceAll("_", " "),
          toStatus: valueText(item.toStatus).replaceAll("_", " "),
          note: valueText(item.note),
          createdAt: valueText(item.createdAt),
          changedById: valueText(item.changedById),
        };
      }) : [],
    };
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const fetchWorkOrderPhotos = createAsyncThunk<
  { workOrderId: string; items: WorkOrderPhoto[] },
  string,
  { rejectValue: string }
>("workMonitoring/fetchPhotos", async (id, { rejectWithValue }) => {
  try {
    const response = await api.get("/work-photos", { params: { workOrderId: id } });
    const data = unwrap(response.data);
    return {
      workOrderId: id,
      items: Array.isArray(data) ? data.map((entry) => {
        const item = record(entry);
        return {
          id: valueText(item.id),
          imageUrl: valueText(item.imageUrl),
          caption: valueText(item.caption),
          createdAt: valueText(item.createdAt),
        };
      }) : [],
    };
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

export const approveWorkServiceReport = createAsyncThunk<
  WorkServiceReport,
  { reportId: string; note?: string },
  { rejectValue: string }
>("workMonitoring/approveReport", async ({ reportId, note }, { rejectWithValue }) => {
  try {
    const response = await api.post(
      "/service-reports/" + encodeURIComponent(reportId) + "/approve",
      { note },
    );
    return mapReport(unwrap(response.data)) as WorkServiceReport;
  } catch (error) {
    return rejectWithValue(errorMessage(error));
  }
});

const initialState: WorkMonitoringState = {
  items: [],
  pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  loading: false,
  error: null,
  detail: null,
  detailLoading: false,
  detailError: null,
  history: [],
  historyWorkOrderId: null,
  historyLoading: false,
  photos: [],
  photosWorkOrderId: null,
  photosLoading: false,
  reportUpdating: false,
  reportError: null,
};

const workMonitoringSlice = createSlice({
  name: "workMonitoring",
  initialState,
  reducers: {
    clearWorkMonitoringErrors(state) {
      state.error = null;
      state.detailError = null;
      state.reportError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWorkOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to load work orders.";
      })
      .addCase(fetchWorkOrderDetail.pending, (state) => {
        state.detailLoading = true;
        state.detailError = null;
      })
      .addCase(fetchWorkOrderDetail.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.detail = action.payload;
      })
      .addCase(fetchWorkOrderDetail.rejected, (state, action) => {
        state.detailLoading = false;
        state.detailError = action.payload ?? "Failed to load work order details.";
      })
      .addCase(fetchWorkOrderHistory.pending, (state) => {
        state.historyLoading = true;
      })
      .addCase(fetchWorkOrderHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.historyWorkOrderId = action.payload.workOrderId;
        state.history = action.payload.items;
      })
      .addCase(fetchWorkOrderHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.detailError = action.payload ?? "Failed to load status history.";
      })
      .addCase(fetchWorkOrderPhotos.pending, (state) => {
        state.photosLoading = true;
      })
      .addCase(fetchWorkOrderPhotos.fulfilled, (state, action) => {
        state.photosLoading = false;
        state.photosWorkOrderId = action.payload.workOrderId;
        state.photos = action.payload.items;
      })
      .addCase(fetchWorkOrderPhotos.rejected, (state, action) => {
        state.photosLoading = false;
        state.detailError = action.payload ?? "Failed to load field photos.";
      })
      .addCase(approveWorkServiceReport.pending, (state) => {
        state.reportUpdating = true;
        state.reportError = null;
      })
      .addCase(approveWorkServiceReport.fulfilled, (state, action) => {
        state.reportUpdating = false;
        if (state.detail) state.detail.serviceReport = action.payload;
        state.items = state.items.map((item) =>
          item.serviceReport?.id === action.payload.id
            ? { ...item, serviceReport: action.payload }
            : item,
        );
      })
      .addCase(approveWorkServiceReport.rejected, (state, action) => {
        state.reportUpdating = false;
        state.reportError = action.payload ?? "Failed to approve service report.";
      });
  },
});

export const { clearWorkMonitoringErrors } = workMonitoringSlice.actions;
export default workMonitoringSlice.reducer;
