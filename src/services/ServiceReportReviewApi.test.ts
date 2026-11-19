import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "../api/axios";
import { submitServiceReportDecision } from "./ServiceReportReviewApi";

vi.mock("../api/axios", () => ({
  api: { post: vi.fn() },
}));

describe("service report decisions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.post).mockResolvedValue({ data: { success: true, data: { id: "report-1" } } });
  });

  it("approves a report with an optional note", async () => {
    await submitServiceReportDecision("report-1", "approve", "Looks complete.");

    expect(api.post).toHaveBeenCalledWith("/service-reports/report-1/approve", { note: "Looks complete." });
  });

  it("requests correction with a required non-empty note", async () => {
    await submitServiceReportDecision("report-1", "request-correction", "Please add a completed installation photo.");

    expect(api.post).toHaveBeenCalledWith("/service-reports/report-1/request-correction", {
      note: "Please add a completed installation photo.",
    });
    await expect(submitServiceReportDecision("report-1", "request-correction", "  "))
      .rejects.toThrow("Enter a correction note");
  });
});