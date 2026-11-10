import { api } from "./axios";

export type BillingStatus = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "FINALIZED";
export type BillingCategory = "DELIVERY" | "TRANSPORTATION" | "MATERIAL" | "SPARE_PARTS" | "OTHER_EXPENSE" | "DISCOUNT";
export interface BillingItemInput {
  category: BillingCategory;
  description: string;
  quantity: number;
  unitPrice: number;
}
export interface BillingQuery {
  status?: BillingStatus;
  workOrderId?: string;
}
export interface BillingConfig {
  managerCanAddCharges: boolean;
  allowSelfApproval: boolean;
  gstStateCode: string;
  gstRateSource: string;
}

export const listBilling = (query: BillingQuery = {}) => api.get("/billing", { params: query });
export const getBilling = (invoiceId: string) => api.get(`/billing/${encodeURIComponent(invoiceId)}`);
export const createBillingDraft = (workOrderId: string, items: BillingItemInput[]) => api.post("/billing", { workOrderId, items });
export const updateBillingDraft = (invoiceId: string, items: BillingItemInput[]) => api.put(`/billing/${encodeURIComponent(invoiceId)}`, { items });
export const submitBilling = (invoiceId: string) => api.post(`/billing/${encodeURIComponent(invoiceId)}/submit`);
export const approveBilling = (invoiceId: string, remarks: string) => api.post(`/billing/${encodeURIComponent(invoiceId)}/approve`, { remarks });
export const rejectBilling = (invoiceId: string, remarks: string) => api.post(`/billing/${encodeURIComponent(invoiceId)}/reject`, { remarks });
export const finalizeBilling = (invoiceId: string) => api.post(`/billing/${encodeURIComponent(invoiceId)}/finalize`);
export const uploadBillingReceipt = (invoiceId: string, receipt: File, invoiceItemId?: string) => {
  const form = new FormData();
  form.append("receipt", receipt);
  if (invoiceItemId) form.append("invoiceItemId", invoiceItemId);
  return api.post(`/billing/${encodeURIComponent(invoiceId)}/attachments`, form, { headers: { "Content-Type": "multipart/form-data" } });
};
export const getBillingConfig = () => api.get("/billing/config");
export const updateBillingConfig = (config: Pick<BillingConfig, "managerCanAddCharges" | "allowSelfApproval" | "gstStateCode">) => api.put("/billing/config", config);
export const updateServiceTax = (serviceId: string | number, gstRate: number, gstInclusive: boolean) => api.patch(`/services/${encodeURIComponent(String(serviceId))}`, { gstRate, gstInclusive });
export const downloadBillingPdf = (invoiceId: string) => api.get(`/billing/${encodeURIComponent(invoiceId)}/pdf`, { responseType: "blob" });
