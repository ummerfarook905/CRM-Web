
export type OvertimeStatus =
  | "Pending"
  | "Approved"
  | "Rejected";

export interface OvertimeDecisionDto {
  decision: "Approved" | "Rejected";
  note?: string;
}

export interface RecordOvertimePaymentDto {
  amount: number;
  paymentReference?: string;
}

export interface ListOvertimeDto {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: OvertimeStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department?: string;
  designation?: string;
  date: string;
  regularHours?: number;
  overtimeHours?: number;
  reason?: string;
  status: OvertimeStatus;
  submittedAt?: string;
  reviewedAt?: string | null;
  note?: string | null;
  amount?: number | null;
  paymentReference?: string | null;
}

export interface OvertimeState {
  items: OvertimeRequest[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
}
