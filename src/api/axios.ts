
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

interface RetriableRequestConfig {
  _authRetry?: boolean;
  headers?: { set: (name: string, value: string) => void };
}

interface RefreshResponse {
  token?: string;
  accessToken?: string;
  refreshToken?: string;
  data?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    tokens?: {
      token?: string;
      accessToken?: string;
      refreshToken?: string;
    };
  };
  tokens?: {
    token?: string;
    accessToken?: string;
    refreshToken?: string;
  };
}

let refreshInFlight: Promise<string | null> | null = null;

function readRefreshTokens(response: unknown): {
  accessToken: string;
  refreshToken: string | null;
} | null {
  const body = response as RefreshResponse;
  const data = body?.data ?? body;
  const tokens = data.tokens ?? body.tokens;
  const accessToken = tokens?.accessToken ?? tokens?.token ?? data.accessToken ?? data.token;
  const refreshToken = tokens?.refreshToken ?? data.refreshToken;

  if (typeof accessToken !== "string" || accessToken.length === 0) return null;
  return {
    accessToken,
    refreshToken: typeof refreshToken === "string" && refreshToken.length > 0
      ? refreshToken
      : null,
  };
}

async function refreshAccessToken(): Promise<string | null> {
  const currentTokens = getAuthTokens();
  if (!currentTokens.refreshToken) return null;

  try {
    // Support the common route names used by auth APIs. The second route is
    // tried only when the first is not implemented by the server.
    let response;
    try {
      response = await refreshApi.post("/auth/refresh", {
        refreshToken: currentTokens.refreshToken,
      });
    } catch (error: unknown) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error;
      response = await refreshApi.post("/auth/refresh-token", {
        refreshToken: currentTokens.refreshToken,
      });
    }

    const nextTokens = readRefreshTokens(response.data);
    if (!nextTokens) return null;

    const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);
    const session = savedSession ? JSON.parse(savedSession) as Record<string, unknown> : {};
    const updatedSession = {
      ...session,
      token: nextTokens.accessToken,
      refreshToken: nextTokens.refreshToken ?? currentTokens.refreshToken,
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedSession));
    window.dispatchEvent(new CustomEvent("crm:auth-session-updated", {
      detail: {
        token: updatedSession.token,
        refreshToken: updatedSession.refreshToken,
      },
    }));

    return nextTokens.accessToken;
  } catch {
    return null;
  }
}

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

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    const request = error.config as (typeof error.config & RetriableRequestConfig) | undefined;
    if (!request || request._authRetry) return Promise.reject(error);

    request._authRetry = true;
    refreshInFlight ??= refreshAccessToken().finally(() => {
      refreshInFlight = null;
    });
    const accessToken = await refreshInFlight;

    if (!accessToken) {
      try {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      } catch {
        // Continue with in-memory session expiry if storage is unavailable.
      }
      window.dispatchEvent(new Event("crm:auth-session-expired"));
      return Promise.reject(error);
    }

    request.headers?.set("Authorization", `Bearer ${accessToken}`);
    return api.request(request);
  },
);
