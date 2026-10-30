
export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "On Leave"
  | "Half Day"
  | "Unknown";

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  date: string;
  checkIn: string;
  checkOut: string;
  workingHours: string;
  overtime: string;
  status: AttendanceStatus;
  location: string;
}

export interface ApiAttendanceRecord {
  id: string | number;
  employee?: {
    employeeNo?: string | null;
    designation?: string | null;
    department?: { name?: string | null } | null;
    user?: { firstName?: string | null; lastName?: string | null } | null;
  } | null;
  employeeNo?: string | null;
  employeeId?: string | null;
  name?: string | null;
  department?: string | null;
  designation?: string | null;
  date?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  workingMinutes?: number | null;
  workingHours?: string | null;
  overtime?: string | null;
  status?: string | null;
  location?: string | null;
}

export interface AttendanceState {
  items: AttendanceRecord[];
  loading: boolean;
  error: string | null;
}
