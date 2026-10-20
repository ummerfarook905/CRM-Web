
import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import { api } from "../api/axios";

interface CategoriesState {
  items: string[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

// Assumed endpoint: GET /api/v1/service-categories
export const fetchCategories = createAsyncThunk<
  string[],
  void,
  { rejectValue: string }
>("categories/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get(
      "/service-categories"
    );

    const result = response.data?.data ?? response.data;
    const items = Array.isArray(result)
      ? result
      : result.categories;

    if (!Array.isArray(items)) {
      return rejectWithValue(
        "The categories API did not return a list."
      );
    }

    return items.map((item: any) =>
      typeof item === "string" ? item : item.name
    );
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ??
        "Failed to fetch categories."
    );
  }
});

// Assumed endpoint: POST /api/v1/service-categories

export const createCategory = createAsyncThunk<
  string,
  string,
  { rejectValue: string }
>(
  "categories/create",
  async (name, { rejectWithValue }) => {
    try {
      const response = await api.post("/service-categories", {
        name: name.trim(),
      });

      const result = response.data?.data ?? response.data;
      const category = result?.category ?? result;

      return typeof category === "string"
        ? category
        : category?.name ?? rejectWithValue("Category name missing from API response.");
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message ??
          "Failed to create category."
      );
    }
  }
);


const categoriesSlice = createSlice({
  name: "categories",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ?? "Failed to fetch categories.";
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        const exists = state.items.some(
          (item) =>
            item.toLowerCase() === action.payload.toLowerCase()
        );

        if (!exists) {
          state.items.push(action.payload);
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error =
          action.payload ?? "Failed to create category.";
      });
  },
});

export default categoriesSlice.reducer;
