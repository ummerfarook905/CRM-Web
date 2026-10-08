import type {
  AuthResponse,
  LoginCredentials,
  User,
} from "../models/auth/User";

const USERS: Array<User & { password: string }> = [
  {
    id: 1,
    name: "Admin User",
    email: "admin@example.com",
    password: "admin123",
    role: "admin",
  },
  {
    id: 2,
    name: "Manager User",
    email: "manager@example.com",
    password: "manager123",
    role: "manager",
  },
];

const USER_KEY = "auth_user";
const TOKEN_KEY = "auth_token";

class AuthService {
  login(credentials: LoginCredentials): AuthResponse | null {
    const user = USERS.find(
      (item) =>
        item.email === credentials.email &&
        item.password === credentials.password
    );

    if (!user) {
      return null;
    }

    const { password, ...userWithoutPassword } = user;

    const token = `dummy-token-${user.id}-${Date.now()}`;

    localStorage.setItem(
      USER_KEY,
      JSON.stringify(userWithoutPassword)
    );

    localStorage.setItem(TOKEN_KEY, token);

    return {
      user: userWithoutPassword,
      token,
    };
  }

  logout(): void {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    const storedUser = localStorage.getItem(USER_KEY);

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();

    return user?.role === role;
  }
}

export default new AuthService();