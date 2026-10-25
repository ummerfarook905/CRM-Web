
export type AttendanceStatus =
  | "Present"
  | "Absent"
  | "Late"
  | "On Leave";

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
  employeeId?: string | null;
  name?: string | null;
  department?: string | null;
  designation?: string | null;
  date?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
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
