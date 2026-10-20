import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
} from "lucide-react";
import { useEffect,useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { loginUser, clearAuthError } from "../../store/auth/AuthSlice";
import AuthViewModel from "../../viewmodels/auth/AuthViewModel";

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const {
    user,
    loading,
    error,
    isAuthenticated,
  } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(
        AuthViewModel.getDashboardPath(user.role),
        { replace: true }
      );
    }
  }, [isAuthenticated, user, navigate]);

  
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const result = await dispatch(
      loginUser({
        email: email.trim(),
        password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      navigate(
        AuthViewModel.getDashboardPath(
          result.payload.user.role
        ),
        { replace: true }
      );
    }
  };

  const fillAdminCredentials = () => {
    setEmail("admin@specterra.com");
    setPassword("Spectra-Z1rMbYmFA1a");
    dispatch(clearAuthError());
  };

  const fillManagerCredentials = () => {
    setEmail("manager@example.com");
    setPassword("manager123");
    dispatch(clearAuthError());
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Shield
              size={32}
              className="text-white"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">
            CRM System
          </h1>

          <p className="mt-2 text-slate-400">
            Sign in to your management portal
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              Welcome Back
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Enter your credentials to continue.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email Address
              </label>

              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="Enter your email"
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Password
              </label>

              <div className="relative">
                <Lock
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
            </div>

            {/* Login */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>
          </form>

          {/* Dummy credentials */}
          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-400">
              Demo Credentials
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={fillAdminCredentials}
                className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-left transition hover:bg-indigo-100"
              >
                <p className="font-semibold text-indigo-700">
                  Admin
                </p>
              </button>

              <button
                type="button"
                onClick={fillManagerCredentials}
                className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-left transition hover:bg-emerald-100"
              >
                <p className="font-semibold text-emerald-700">
                  Manager
                </p>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          Demo authentication system
        </p>
      </div>
    </div>
  );
}