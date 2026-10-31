import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/axios";

export interface Designation {
  id: string;
  name: string;
}

interface DesignationsState {
  items: Designation[];
  loading: boolean;
  error: string | null;
}

const initialState: DesignationsState = { items: [], loading: false, error: null };

function unwrap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  const record = value as Record<string, unknown>;
  const nested = record.data;
  return nested && typeof nested === "object" && !Array.isArray(nested)
    ? nested as Record<string, unknown>
    : record;
}

function errorText(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "response" in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    const message = response?.data?.message;
    if (typeof message === "string") return message;
    if (Array.isArray(message)) return message.join(", ");
  }
  return error instanceof Error ? error.message : fallback;
}

function normalize(value: unknown): Designation | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (item.id == null || typeof item.name !== "string" || !item.name.trim()) return null;
  return { id: String(item.id), name: item.name.trim() };
}

export const fetchDesignations = createAsyncThunk<Designation[], void, { rejectValue: string }>(
  "designations/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/designations");
      const body = unwrap(response.data);
      const rows = Array.isArray(response.data) ? response.data : body.designations ?? body.items ?? body.data;
      if (!Array.isArray(rows)) return rejectWithValue("The designations API did not return a list.");
      return rows.map(normalize).filter((item): item is Designation => item !== null);
    } catch (error) {
      return rejectWithValue(errorText(error, "Failed to load designations."));
    }
  },
);

export const createDesignation = createAsyncThunk<Designation, string, { rejectValue: string }>(
  "designations/create",
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post("/designations", { name: name.trim() });
      const body = unwrap(response.data);
      const designation = normalize(body.designation ?? body);
      if (!designation) return rejectWithValue("The designation response did not include an ID and name.");
      return designation;
    } catch (error) {
      return rejectWithValue(errorText(error, "Failed to create designation."));
    }
  },
);

const designationsSlice = createSlice({
  name: "designations",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesignations.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchDesignations.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchDesignations.rejected, (state, action) => { state.loading = false; state.error = action.payload ?? "Failed to load designations."; })
      .addCase(createDesignation.fulfilled, (state, action) => {
        const exists = state.items.some((item) => item.id === action.payload.id || item.name.toLowerCase() === action.payload.name.toLowerCase());
        if (!exists) state.items.push(action.payload);
        state.error = null;
      })
      .addCase(createDesignation.rejected, (state, action) => { state.error = action.payload ?? "Failed to create designation."; });
  },
});

export default designationsSlice.reducer;
