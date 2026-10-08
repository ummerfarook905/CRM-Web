import { Outlet } from "react-router-dom";
import ManagerSideNav from "../components/manager/ManagerSideNav";
import TopNav from "../components/TopNav";

export default function ManagerLayout() {
  return (
    <div className="min-h-screen bg-slate-100">

      <ManagerSideNav />

      <TopNav role="manager" />

      <main className="min-h-screen pt-16 lg:ml-64">

        <div className="p-4 sm:p-5 lg:p-6">
          <Outlet />
        </div>

      </main>

    </div>
  );
}