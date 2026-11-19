import { api } from "../api/axios";

export type ServiceReportDecision = "approve" | "request-correction";

export async function submitServiceReportDecision(
  reportId: string,
  decision: ServiceReportDecision,
  note?: string,
): Promise<unknown> {
  const trimmedNote = note?.trim() ?? "";
  if (decision === "request-correction" && !trimmedNote) {
    throw new Error("Enter a correction note before requesting changes.");
  }

  const action = decision === "approve" ? "approve" : "request-correction";
  const response = await api.post(
    `/service-reports/${encodeURIComponent(reportId)}/${action}`,
    trimmedNote ? { note: trimmedNote } : {},
  );
  const envelope = response.data as { success?: unknown; message?: unknown; data?: unknown };
  if (envelope?.success === false) {
    throw new Error(typeof envelope.message === "string" ? envelope.message : "The report decision was rejected.");
  }
  return envelope?.data ?? response.data;
}