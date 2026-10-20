
import {
  createAsyncThunk,
  createSlice,
} from "@reduxjs/toolkit";
import axios from "axios";

import AuthService from "../../services/AuthService";

import type {
  AuthResponse,
  AuthState,
  LoginCredentials,
  User,
} from "../../models/auth/User";

const AUTH_STORAGE_KEY = "crm.auth.session";

interface PersistedSession {
  user: User;
  token: string;
}

const loadPersistedSession = (): PersistedSession | null => {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<PersistedSession>;

    if (
      typeof parsed.token === "string" &&
      parsed.token.length > 0 &&
      typeof parsed.user === "object" &&
      parsed.user !== null &&
      typeof parsed.user.role === "string"
    ) {
      return {
        user: parsed.user,
        token: parsed.token,
      };
    }

    return null;
  } catch {
    return null;
  }
};

const persistSession = (
  session: PersistedSession | null
): void => {
  try {
    if (session) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(session)
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable; session stays in memory.
  }
};

const persistedSession = loadPersistedSession();

const initialState: AuthState = {
  user: persistedSession?.user ?? null,
  token: persistedSession?.token ?? null,
  isAuthenticated: persistedSession !== null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk<
  AuthResponse,
  LoginCredentials,
  { rejectValue: string }
>(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      return await AuthService.login(credentials);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          const data = error.response.data as
            | { message?: unknown }
            | undefined;

          return rejectWithValue(
            typeof data?.message === "string" &&
              data.message.length > 0
              ? data.message
              : "Invalid email or password."
          );
        }

        return rejectWithValue(
          "Unable to connect to the server. Please try again."
        );
      }

      if (error instanceof Error && error.message) {
        return rejectWithValue(error.message);
      }

      return rejectWithValue("Login failed.");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
      persistSession(null);
    },

    clearAuthError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        persistSession({
          user: action.payload.user,
          token: action.payload.token,
        });
      })

      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error =
          action.payload ??
          action.error.message ??
          "Login failed.";
        persistSession(null);
      });
  },
});

export const { logout, clearAuthError } =
  authSlice.actions;

export default authSlice.reducer;
