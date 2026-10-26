import type {
  AuthResponse,
  Role,
  User,
} from "../models/auth/User";

/**
 * Raw user object returned by the backend auth API.
 */
interface ApiUser {
  id: string | number;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
  role: string;
}

/**
 * Raw login payload. The backend wraps the session in an
 * envelope:
 *
 * {
 *   "success": true,
 *   "message": "Login successful",
 *   "data": {
 *     "user": { "id": "...", "firstName": "...", "role": "ADMIN" },
 *     "tokens": { "accessToken": "...", "refreshToken": "...", "expiresIn": 900 }
 *   }
 * }
 *
 * A flat `{ user, token }` shape is still accepted so the
 * client keeps working if the backend response changes.
 */
interface ApiLoginPayload {
  user?: ApiUser;
  token?: string;
  refreshToken?: string;
  data?: {
    user?: ApiUser;
    token?: string;
    refreshToken?: string;
    tokens?: {
      accessToken?: string;
      refreshToken?: string;
      expiresIn?: number;
    };
  };
}

const normalizeRole = (rawRole: string): Role => {
  const role = rawRole.trim().toLowerCase();

  if (role === "admin" || role === "manager") {
    return role;
  }

  throw new Error(
    `Unsupported user role "${rawRole}" returned by the login API.`
  );
};

const buildDisplayName = (apiUser: ApiUser): string => {
  const fullName = [apiUser.firstName, apiUser.lastName]
    .filter(
      (part): part is string =>
        typeof part === "string" && part.trim().length > 0
    )
    .join(" ")
    .trim();

  return fullName || apiUser.name?.trim() || apiUser.email;
};

const mapApiUser = (apiUser: ApiUser): User => ({
  id: apiUser.id,
  name: buildDisplayName(apiUser),
  email: apiUser.email,
  role: normalizeRole(apiUser.role),
});

/**
 * Converts the backend login payload into the flat
 * `{ user, token }` shape the Redux store expects.
 */
export const mapLoginResponse = (
  payload: unknown
): AuthResponse => {
  const body = (payload ?? {}) as ApiLoginPayload;

  const apiUser = body.data?.user ?? body.user;
  const token =
    body.data?.tokens?.accessToken ??
    body.data?.token ??
    body.token;

  const refreshToken =
    body.data?.tokens?.refreshToken ??
    body.data?.refreshToken ??
    body.refreshToken;

  if (!apiUser || !token || !refreshToken) {
    throw new Error(
      "Unexpected login response format from the server."
    );
  }

  return {
    user: mapApiUser(apiUser),
    token,
    refreshToken,
  };
};