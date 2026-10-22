
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../api/axios";

export interface Category {
  id: string;
  name: string;
}

interface CategoriesState {
  items: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: CategoriesState = {
  items: [],
  loading: false,
  error: null,
};

const normalizeCategory = (item: any): Category | null => {
  if (!item || typeof item === "string" || item.id == null || !item.name) {
    return null;
  }

  return {
    id: String(item.id),
    name: String(item.name),
  };
};

export const fetchCategories = createAsyncThunk<
  Category[],
  void,
  { rejectValue: string }
>("categories/fetchAll", async (_, { rejectWithValue }) => {
  try {
    const response = await api.get("/service-categories");
    const result = response.data?.data ?? response.data;
    const items = Array.isArray(result) ? result : result?.categories;

    if (!Array.isArray(items)) {
      return rejectWithValue("The categories API did not return a list.");
    }

    const categories = items.map(normalizeCategory);

    if (categories.some((category) => category === null)) {
      return rejectWithValue(
        "Each category response must contain an id and name."
      );
    }

    return categories as Category[];
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message ?? "Failed to fetch categories."
    );
  }
});

export const createCategory = createAsyncThunk<
  Category,
  string,
  { rejectValue: string }
>("categories/create", async (name, { rejectWithValue }) => {
  try {
    const response = await api.post("/service-categories", {
      name: name.trim(),
    });

    const result = response.data?.data ?? response.data;
    const category = normalizeCategory(result?.category ?? result);

    if (!category) {
      return rejectWithValue(
        "The category response must contain an id and name."
      );
    }

    return category;
  } catch (error: any) {
    const message = error.response?.data?.message;

    return rejectWithValue(
      Array.isArray(message)
        ? message.join(", ")
        : message ?? "Failed to create category."
    );
  }
});

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
        state.error = action.payload ?? "Failed to fetch categories.";
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        const exists = state.items.some(
          (item) => item.id === action.payload.id
        );

        if (!exists) {
          state.items.push(action.payload);
        }
        state.error = null;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload ?? "Failed to create category.";
      });
  },
});

export default categoriesSlice.reducer;
