import AuthService from "../../services/AuthService";
import type {
  LoginCredentials,
  User,
} from "../../models/auth/User";

class AuthViewModel {
  login(credentials: LoginCredentials): User | null {
    const response = AuthService.login(credentials);

    if (!response) {
      return null;
    }

    return response.user;
  }

  logout(): void {
    AuthService.logout();
  }

  getCurrentUser(): User | null {
    return AuthService.getCurrentUser();
  }

  getToken(): string | null {
    return AuthService.getToken();
  }

  isAuthenticated(): boolean {
    return AuthService.isAuthenticated();
  }

  hasRole(role: "admin" | "manager"): boolean {
    return AuthService.hasRole(role);
  }
}

export default new AuthViewModel();