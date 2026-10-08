import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "../views/auth/Login";

import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";

import AdminDashboard from "../views/admin/AdminDashboard";
import ManagerDashboard from "../views/manager/ManagerDashboard";

import CustomerManagement from "../views/admin/CustomerManagement";

import Unauthorized from "../views/errors/Unauthorized";

import ProtectedRoute from "../components/ProtectedRoute";

import AuthViewModel from "../viewmodels/auth/AuthViewModel";

export default function AppRoutes() {
  const isAuthenticated =
    AuthViewModel.isAuthenticated();

  const user = AuthViewModel.getCurrentUser();

  const getDefaultRoute = () => {
    if (!isAuthenticated || !user) {
      return "/login";
    }

    if (user.role === "admin") {
      return "/admin/dashboard";
    }

    if (user.role === "manager") {
      return "/manager/dashboard";
    }

    return "/login";
  };

  return (
    <Routes>
      {/* ========================= */}
      {/* LOGIN */}
      {/* ========================= */}

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate
              to={getDefaultRoute()}
              replace
            />
          ) : (
            <Login />
          )
        }
      />

      {/* ========================= */}
      {/* ADMIN */}
      {/* ========================= */}

      <Route
        element={
          <ProtectedRoute allowedRole="admin" />
        }
      >
        <Route
          path="/admin"
          element={<AdminLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          {/* Future admin pages */}
          <Route
            path="customers"
            element={<CustomerManagement />}
          />

          <Route
            path="reports"
            element={
              <div className="rounded-xl bg-white p-8">
                <h1 className="text-2xl font-bold">
                  Admin Reports
                </h1>
              </div>
            }
          />

          <Route
            path="settings"
            element={
              <div className="rounded-xl bg-white p-8">
                <h1 className="text-2xl font-bold">
                  Admin Settings
                </h1>
              </div>
            }
          />
        </Route>
      </Route>

      {/* ========================= */}
      {/* MANAGER */}
      {/* ========================= */}

      <Route
        element={
          <ProtectedRoute allowedRole="manager" />
        }
      >
        <Route
          path="/manager"
          element={<ManagerLayout />}
        >
          <Route
            index
            element={
              <Navigate
                to="dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<ManagerDashboard />}
          />

          {/* Future manager pages */}
          <Route
            path="team"
            element={
              <div className="rounded-xl bg-white p-8">
                <h1 className="text-2xl font-bold">
                  My Team
                </h1>
              </div>
            }
          />

          <Route
            path="tasks"
            element={
              <div className="rounded-xl bg-white p-8">
                <h1 className="text-2xl font-bold">
                  Tasks
                </h1>
              </div>
            }
          />

          <Route
            path="reports"
            element={
              <div className="rounded-xl bg-white p-8">
                <h1 className="text-2xl font-bold">
                  Manager Reports
                </h1>
              </div>
            }
          />
        </Route>
      </Route>

      {/* ========================= */}
      {/* UNAUTHORIZED */}
      {/* ========================= */}

      <Route
        path="/unauthorized"
        element={<Unauthorized />}
      />

      {/* ========================= */}
      {/* ROOT */}
      {/* ========================= */}

      <Route
        path="/"
        element={
          <Navigate
            to={getDefaultRoute()}
            replace
          />
        }
      />

      {/* ========================= */}
      {/* 404 */}
      {/* ========================= */}

      <Route
        path="*"
        element={
          <Navigate
            to={getDefaultRoute()}
            replace
          />
        }
      />
    </Routes>
  );
}