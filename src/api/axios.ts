
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const AUTH_STORAGE_KEY = "crm.auth.session";

interface SavedSession {
  token?: string;
  refreshToken?: string;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Separate Axios instance for refreshing tokens.
// It does not use the authenticated request interceptor.
export const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Read both tokens from the saved Redux session.
export const getAuthTokens = (): {
  accessToken: string | null;
  refreshToken: string | null;
} => {
  try {
    const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!savedSession) {
      return {
        accessToken: null,
        refreshToken: null,
      };
    }

    const session = JSON.parse(savedSession) as SavedSession;

    return {
      accessToken: session.token ?? null,
      refreshToken: session.refreshToken ?? null,
    };
  } catch {
    return {
      accessToken: null,
      refreshToken: null,
    };
  }
};

// Automatically attach the access token to normal API requests.
api.interceptors.request.use(
  (config) => {
    const { accessToken } = getAuthTokens();

    if (accessToken) {
      config.headers.set(
        "Authorization",
        `Bearer ${accessToken}`
      );
    }

    return config;
  },
  (error) => Promise.reject(error)
);
