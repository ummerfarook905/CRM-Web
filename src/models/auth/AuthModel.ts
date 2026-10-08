import type { User } from "./User";

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}