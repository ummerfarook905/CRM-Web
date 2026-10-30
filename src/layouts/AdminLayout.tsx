import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSideNav from "../components/admin/AdminSideNav";
import TopNav from "../components/TopNav";

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <AdminSideNav
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />

      <TopNav role="admin" collapsed={collapsed} />

      <main
        className={`min-h-screen transition-all duration-300 ${
          collapsed ? "lg:ml-20" : "lg:ml-[280px]"
        }`}
      >
        <div className="px-4 pb-6 pt-20 sm:px-5 lg:px-7">
          <div key={location.pathname} className="book-page-open">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
