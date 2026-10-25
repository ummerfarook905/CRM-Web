
export type EmployeeStatus = "Active" | "Inactive";

export interface Employee {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  joiningDate: string;
  status: EmployeeStatus;
  profilePhoto?: string | null;
}

export interface ApiEmployee {
  id: string;
  employeeNo?: string;
  joiningDate?: string | null;
  designation?: string | null;
  createdAt?: string;
  updatedAt?: string;
  user?: {
    id?: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    profilePhoto?: string | null;
    isActive?: boolean;
    isVerified?: boolean;
  };
}

export interface EmployeeForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  joiningDate: string;
}

export interface CreateEmployeePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  designation: string;
  joiningDate?: string;
}

export interface UpdateEmployeePayload {
  firstName?: string;
  lastName?: string;
  // email?: string;
  phone?: string;
  designation?: string;
  joiningDate?: string;
  isActive?: boolean;
}

export function mapApiEmployee(employee: ApiEmployee): Employee {
  const user = employee.user;

  return {
    id: employee.id,
    employeeNo: employee.employeeNo ?? "",
    name: [user?.firstName, user?.lastName]
      .filter(Boolean)
      .join(" "),
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    department: "Operations",
    designation: employee.designation ?? "",
    joiningDate: employee.joiningDate
      ? employee.joiningDate.slice(0, 10)
      : "",
    status: user?.isActive === false ? "Inactive" : "Active",
    profilePhoto: user?.profilePhoto ?? null,
  };
}
