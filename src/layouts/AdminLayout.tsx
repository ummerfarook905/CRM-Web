import { Outlet } from "react-router-dom";
import AdminSideNav from "../components/admin/AdminSideNav";
import TopNav from "../components/TopNav";

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-100">

      <AdminSideNav />

      <TopNav role="admin" />

      <main className="min-h-screen pt-16 lg:ml-64">

        <div className="p-4 sm:p-5 lg:p-6">
          <Outlet />
        </div>

      </main>

    </div>
  );
}