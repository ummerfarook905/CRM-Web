import { useEffect } from "react";
import { useAppDispatch } from "./app/Hooks";
import AppRoutes from "./routes/Approutes";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { sessionExpired, sessionRefreshed } from "./store/auth/AuthSlice";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.getElementById("initial-loader")?.setAttribute("hidden", "");

    const handleSessionUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ token: string; refreshToken: string }>).detail;
      if (detail?.token && detail.refreshToken) dispatch(sessionRefreshed(detail));
    };
    const handleSessionExpired = () => dispatch(sessionExpired());

    window.addEventListener("crm:auth-session-updated", handleSessionUpdated);
    window.addEventListener("crm:auth-session-expired", handleSessionExpired);
    return () => {
      window.removeEventListener("crm:auth-session-updated", handleSessionUpdated);
      window.removeEventListener("crm:auth-session-expired", handleSessionExpired);
    };
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
