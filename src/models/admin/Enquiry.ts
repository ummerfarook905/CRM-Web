export type EnquiryStatus = "New" | "Contacted" | "Assigned" | "Converted";
export type Priority = "Low" | "Medium" | "High";

/** Normalized enquiry shape used by the UI. */
export interface Enquiry {
  id: string;
  reference: string;
  customerId: string | null;
  customerName: string;
  company: string;
  phone: string;
  email: string;
  serviceId: string | null;
  serviceLocationId: string | null;
  service: string;
  location: string;
  message: string;
  receivedDate: string;
  priority: Priority;
  status: EnquiryStatus;
  assignedManager: string;
  assignedEmployees: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEnquiryPayload {
  customerId?: string | null;
  name: string;
  phone: string;
  email?: string | null;
  serviceId?: string | null;
  serviceLocationId?: string | null;
  message?: string | null;
}

export interface ApiEnquiry {
  id: string;
  enquiryNumber?: string | null;
  customerId?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  serviceId?: string | null;
  serviceLocationId?: string | null;
  message?: string | null;
  status?: string | null;
  assignedManagerId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  service?: { id?: string; name?: string | null } | null;
  customer?: { id?: string; name?: string | null; company?: string | null } | null;
  assignedManager?: { id?: string; name?: string | null } | null;
  assignedEmployees?: Array<string | { id?: string; name?: string | null }> | null;
}

const statusMap: Record<string, EnquiryStatus> = {
  NEW: "New",
  CONTACTED: "Contacted",
  ASSIGNED: "Assigned",
  CONVERTED: "Converted",
};

export function mapApiEnquiry(item: ApiEnquiry): Enquiry {
  const rawStatus = (item.status ?? "NEW").toUpperCase();
  const employees = Array.isArray(item.assignedEmployees)
    ? item.assignedEmployees.map((employee) =>
        typeof employee === "string" ? employee : employee.name ?? employee.id ?? "",
      ).filter(Boolean)
    : [];

  return {
    id: String(item.id),
    reference: item.enquiryNumber ?? "",
    customerId: item.customerId ?? item.customer?.id ?? null,
    customerName: item.customer?.name ?? item.name ?? "",
    company: item.customer?.company ?? "",
    phone: item.phone ?? "",
    email: item.email ?? "",
    serviceId: item.serviceId ?? item.service?.id ?? null,
    serviceLocationId: item.serviceLocationId ?? null,
    service: item.service?.name ?? "",
    location: "",
    message: item.message ?? "",
    receivedDate: item.createdAt ? item.createdAt.slice(0, 10) : "",
    priority: "Medium",
    status: statusMap[rawStatus] ?? "New",
    assignedManager: item.assignedManager?.name ?? "",
    assignedEmployees: employees,
    createdAt: item.createdAt ?? undefined,
    updatedAt: item.updatedAt ?? undefined,
  };
}
