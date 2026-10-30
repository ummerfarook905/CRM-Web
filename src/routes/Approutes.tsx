import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { useAppSelector } from "../app/Hooks";

import Login from "../views/auth/Login";

import AdminLayout from "../layouts/AdminLayout";
import ManagerLayout from "../layouts/ManagerLayout";

import AdminDashboard from "../views/admin/AdminDashboard";
import ManagerDashboard from "../views/manager/ManagerDashboard";

import CustomerManagement from "../views/admin/CustomerManagement";

import Unauthorized from "../views/errors/Unauthorized";

import ProtectedRoute from "../components/ProtectedRoute";

import EnquiryManagement from "../views/admin/EnquiryManagement";
import ServiceManagement from "../views/admin/ServiceManagement";
import WorkAssignment from "../views/manager/WorkAssignment";
import WorkMonitoring from "../views/manager/WorkMonitoring";
import WorkVerification from "../views/manager/WorkVerification";
import Employees from "../views/admin/Employees";
import Overtime from "../views/admin/Overtime";
import Attendance from "../views/admin/Attendance";
import Overtime1 from "../views/manager/Overtime1";
import EnquiryManagement1 from "../views/manager/EnquiryManagement1";
import ClientDirectory from "../views/manager/ClientDirectory";
import ServiceManagement1 from "../views/manager/ServiceManagement1";


export default function AppRoutes() {
  const { isAuthenticated, user } = useAppSelector(
    (state) => state.auth
  );

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
          isAuthenticated && user ? (
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
            path="Enquiries"
            element={<EnquiryManagement />}
          />

          <Route
            path="Services"
            element={<ServiceManagement />}
          />

          <Route
            path="Employees"
            element={<Employees />}
          />

          <Route
            path="Attendance"
            element={<Attendance />}
          />

          <Route
            path="Overtime"
            element={<Overtime />}
          />

          <Route
            path="WorkMonitoring"
            element={<WorkMonitoring />}
          />

          <Route
            path="WorkVerification"
            element={<WorkVerification />}
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
            path="WorkAssignment"
            element={<WorkAssignment />}
          />

          <Route
            path="WorkMonitoring"
            element={<WorkMonitoring />}
          />

          <Route
            path="WorkVerification"
            element={<WorkVerification />}
          />

          <Route
            path="Overtime1"
            element={<Overtime1 />}
          />

          <Route
            path="Enquiries1"
            element={<EnquiryManagement1 />}
          />

          <Route
            path="Client Directory"
            element={<ClientDirectory />}
          />

          <Route
            path="ServiceManagement"
            element={<ServiceManagement1 />}
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
