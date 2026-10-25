export type EnquiryStatus =
  | "New"
  | "Contacted"
  | "Assigned"
  | "Converted";

export type Priority = "Low" | "Medium" | "High";

export interface CreateEnquiryPayload {
  name: string;
  phone: string;
  email?: string | null;
  serviceId?: string | null;
  serviceLocationId?: string | null;
  message?: string | null;
}

export interface Enquiry {
  id: string;
  reference: string;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  service: string;
  location: string;
  message: string;
  receivedDate: string;
  priority: Priority;
  status: EnquiryStatus;
  assignedManager: string;
  assignedEmployees: string[];
  customerId?: string | null;
  serviceId?: string | null;
  serviceLocationId?: string | null;
}

export interface ApiEnquiry {
  id: string;
  enquiryNumber: string;
  customerId: string | null;
  name: string;
  phone: string;
  email: string | null;
  serviceId: string | null;
  message: string | null;
  serviceLocationId: string | null;
  status: string;
  assignedManagerId: string | null;
  createdAt: string;
  service: { name?: string } | null;
  customer: {
  id?: string;
  name?: string;
  company?: string;
} | null;
  assignedManager: {
    name?: string;
  } | null;
}

export function mapApiEnquiry(item: ApiEnquiry): Enquiry {
  const statusMap: Record<string, EnquiryStatus> = {
    NEW: "New",
    CONTACTED: "Contacted",
    ASSIGNED: "Assigned",
    CONVERTED: "Converted",
  };

  return {
    id: item.id,
    reference: item.enquiryNumber ?? "",

    customerId: item.customerId ?? item.customer?.id ?? null,
    serviceId: item.serviceId ?? null,
    serviceLocationId: item.serviceLocationId ?? null,

    customerName: item.customer?.name || item.name || "",
    company: item.customer?.company || "",
    phone: item.phone || "",
    email: item.email || "",
    service: item.service?.name || "",
    location: "",
    message: item.message || "",

    receivedDate: item.createdAt
      ? item.createdAt.slice(0, 10)
      : "",

    priority: "Medium",
    status: statusMap[item.status] ?? "New",
    assignedManager: item.assignedManager?.name || "",
    assignedEmployees: [],
  };
}