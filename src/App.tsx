import { useEffect } from "react";
import { useAppDispatch } from "./app/Hooks";
import AppRoutes from "./routes/Approutes";
import ErrorBoundary from "./components/common/ErrorBoundary";
import {
  AUTH_STORAGE_KEY,
  parsePersistedSession,
  sessionChanged,
  sessionExpired,
  sessionRefreshed,
} from "./store/auth/AuthSlice";

function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    document.getElementById("initial-loader")?.setAttribute("hidden", "");
    document.documentElement.classList.remove("dark");
    try {
      localStorage.removeItem("nextradev.theme");
    } catch {
      // Ignore unavailable local storage.
    }

    const handleSessionUpdated = (event: Event) => {
      const detail = (event as CustomEvent<{ token: string; refreshToken: string }>).detail;
      if (detail?.token && detail.refreshToken) dispatch(sessionRefreshed(detail));
    };
    const handleSessionExpired = () => dispatch(sessionExpired());
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === AUTH_STORAGE_KEY || event.key === null) {
        dispatch(sessionChanged(parsePersistedSession(event.newValue)));
      }
    };

    window.addEventListener("crm:auth-session-updated", handleSessionUpdated);
    window.addEventListener("crm:auth-session-expired", handleSessionExpired);
    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("crm:auth-session-updated", handleSessionUpdated);
      window.removeEventListener("crm:auth-session-expired", handleSessionExpired);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}

export default App;
