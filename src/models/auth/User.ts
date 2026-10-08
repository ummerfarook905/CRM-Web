export type Role = "admin" | "manager";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}