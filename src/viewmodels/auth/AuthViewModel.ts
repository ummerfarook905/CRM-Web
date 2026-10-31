
import { store } from "../../app/Store";
import AuthService from "../../services/AuthService";
import { getAuthTokens } from "../../api/axios";
import { logout } from "../../store/auth/AuthSlice";

import type { Role, User } from "../../models/auth/User";

class AuthViewModel {
  getDashboardPath(role: Role): string {
    if (role === "employee") return "/expenses";
    if (role === "manager") return "/manager/dashboard";
    return "/admin/dashboard";
  }

  hasRole(
    user: User | null,
    role: Role
  ): boolean {
    return user?.role === role;
  }

  getCurrentUser(): User | null {
    return store.getState().auth.user;
  }

  logout(): void {
    const { accessToken: token } = getAuthTokens();

    store.dispatch(logout());

    // Best-effort server-side logout; the local session is
    // already cleared.
    AuthService.logout(token).catch(() => {
      // Ignore logout API failures.
    });
  }
}

export default new AuthViewModel();
