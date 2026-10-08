import { ShieldX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthViewModel from "../../viewmodels/auth/AuthViewModel";

export default function Unauthorized() {
  const navigate = useNavigate();

  const user = AuthViewModel.getCurrentUser();

  const goToDashboard = () => {
    if (user?.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user?.role === "manager") {
      navigate("/manager/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <ShieldX size={32} />
        </div>

        <h1 className="mt-6 text-3xl font-bold text-slate-900">
          Access Denied
        </h1>

        <p className="mt-3 text-slate-500">
          You don't have permission to access this page.
        </p>

        {user && (
          <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm">
            Logged in as{" "}
            <strong>{user.role}</strong>
          </div>
        )}

        <button
          onClick={goToDashboard}
          className="mt-6 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Go to My Dashboard
        </button>
      </div>
    </div>
  );
}