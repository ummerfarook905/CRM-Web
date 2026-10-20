
import axios from "axios";

import { mapLoginResponse } from "./authResponse";

import type {
  AuthResponse,
  LoginCredentials,
} from "../models/auth/User";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

class AuthService {
  async login(
    credentials: LoginCredentials
  ): Promise<AuthResponse> {
    const response = await api.post(
      "/auth/login",
      credentials
    );

    // The backend wraps the session in an envelope
    // ({ success, message, data: { user, tokens } }); map it
    // to the flat { user, token } shape the app expects.
    return mapLoginResponse(response.data);
  }

  async logout(token: string | null): Promise<void> {
    if (!token) return;

    await api.post(
      "/auth/logout",
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
  }
}

export default new AuthService();
