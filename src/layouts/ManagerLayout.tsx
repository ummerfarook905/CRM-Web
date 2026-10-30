import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import ManagerSideNav from "../components/manager/ManagerSideNav";
import TopNav from "../components/TopNav";

export default function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#f1f4f8]">
      <ManagerSideNav
        collapsed={collapsed}
        onToggle={() => setCollapsed((value) => !value)}
      />

      <TopNav role="manager" collapsed={collapsed} />

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
