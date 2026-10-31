import { useCallback, useEffect, useState } from "react";
import { api } from "../api/axios";

type DashboardRole = "admin" | "manager";
type RecordValue = Record<string, unknown>;
const record = (value: unknown): RecordValue => value && typeof value === "object" ? value as RecordValue : {};

function findCount(value: unknown, path: string[] = []): number | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return null;
  for (const [key, child] of Object.entries(value as RecordValue)) {
    const normalized = key.toLowerCase().replace(/[^a-z]/g, "");
    const serviceReportContext = [...path, normalized].some((part) => part.includes("servicereport") || part === "reports");
    if (typeof child === "number" && Number.isFinite(child)) {
      if (/^(pending|submitted|underreview)(servicereports?|reports?)$/.test(normalized) || /^(pending|submitted|underreview)$/.test(normalized) && serviceReportContext || /^reportsawaitingreview$/.test(normalized)) return child;
    }
    const nested = findCount(child, [...path, normalized]);
    if (nested !== null) return nested;
  }
  return null;
}

function totalFromList(value: unknown): number {
  const root = record(value);
  const data = record(root.data);
  const pagination = record(root.pagination ?? data.pagination);
  if (Number.isFinite(Number(pagination.total))) return Number(pagination.total);
  const items = Array.isArray(root.data) ? root.data : Array.isArray(data.items) ? data.items : Array.isArray(root.items) ? root.items : [];
  return items.length;
}

export function useServiceReportPendingCount(role: DashboardRole) {
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/dashboard/${role}`);
      const summaryCount = findCount(response.data);
      if (summaryCount !== null) {
        setCount(summaryCount);
      } else {
        const reportResponse = await api.get("/service-reports", { params: { page: 1, limit: 1, status: "SUBMITTED" } });
        setCount(totalFromList(reportResponse.data));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load submitted report count.");
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    void refresh();
    const listener = () => void refresh();
    window.addEventListener("crm:service-reports-reviewed", listener);
    return () => window.removeEventListener("crm:service-reports-reviewed", listener);
  }, [refresh]);

  return { count, loading, error, refresh };
}
