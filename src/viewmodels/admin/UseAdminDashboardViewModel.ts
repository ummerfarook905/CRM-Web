
import { useEffect, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "../../app/Hooks";

import { fetchServices } from "../../services/ServicesSlice";
import { fetchBookings } from "../../services/BookingsSlice";
import { fetchEnquiries } from "../../services/EnquiriesSlice";
import { fetchCustomers } from "../../services/CustomerSlice";
import { fetchAttendance } from "../../services/AttendancesSlice";
import { fetchOvertime } from "../../services/OvertimeSlice";

type ApiRow = Record<string, unknown>;

function getRows(value: unknown): ApiRow[] {
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is ApiRow =>
        typeof item === "object" && item !== null
    );
  }

  if (typeof value !== "object" || value === null) {
    return [];
  }

  const data = value as Record<string, unknown>;

  for (const key of ["items", "customers", "employees", "data"]) {
    const result = data[key];

    if (Array.isArray(result)) {
      return getRows(result);
    }
  }

  return [];
}

function getStatus(value: unknown): string {
  return typeof value === "string"
    ? value.trim().toLowerCase().replace(/[_-]+/g, " ")
    : "";
}

export function useAdminDashboardViewModel() {
  const dispatch = useAppDispatch();

  // Redux states
  const servicesState = useAppSelector((state) => state.services);
  const bookingsState = useAppSelector((state) => state.bookings);
  const enquiriesState = useAppSelector((state) => state.enquiries);
  const customersState = useAppSelector((state) => state.customers);
  const attendanceState = useAppSelector((state) => state.attendance);
  const overtimeState = useAppSelector((state) => state.overtime);
  const employeesState = useAppSelector((state) => state.employees);

  // Fetch actual API data
  useEffect(() => {
    void dispatch(fetchServices());
    void dispatch(fetchBookings());
    void dispatch(fetchEnquiries());
    void dispatch(fetchCustomers());
    void dispatch(fetchAttendance());
    void dispatch(fetchOvertime({ page: 1, limit: 100 }));
  }, [dispatch]);

  // Data from Redux
  const services = servicesState.items;
  const bookings = bookingsState.items;
  const enquiries = enquiriesState.items;
  const customers = customersState.customers;
  const attendance = attendanceState.items;
  const overtime = overtimeState.requests;

  // Employees are read from Redux.
  // Their API fetch must be dispatched once the employee thunk is available.
  const employees = useMemo(
    () => getRows(employeesState),
    [employeesState]
  );

  // Loading flags from each Redux slice
  const servicesLoading = servicesState.loading;
  const bookingsLoading = bookingsState.loading;
  const enquiriesLoading = enquiriesState.loading;
  const customersLoading = customersState.loading;
  const attendanceLoading = attendanceState.loading;
  const overtimeLoading = overtimeState.loading;

  // Combined loading state for the dashboard
  const loading = Boolean(
    servicesLoading ||
    bookingsLoading ||
    enquiriesLoading ||
    customersLoading ||
    attendanceLoading ||
    overtimeLoading
  );

  // Dashboard statistics
  const stats = useMemo(() => {
    const pendingBookings = bookings.filter(
      (item) => getStatus(item.status) === "pending"
    ).length;

    const scheduledBookings = bookings.filter(
      (item) => getStatus(item.status) === "scheduled"
    ).length;

    const inProgressBookings = bookings.filter(
      (item) => getStatus(item.status) === "in progress"
    ).length;

    const completedBookings = bookings.filter(
      (item) => getStatus(item.status) === "completed"
    ).length;

    const pendingEnquiries = enquiries.filter(
      (item) =>
        ["new", "pending"].includes(getStatus(item.status))
    ).length;

    const activeCustomers = customers.filter(
      (item) => getStatus(item.status) === "active"
    ).length;

    const activeServices = services.filter(
      (item) => getStatus(item.status) === "active"
    ).length;

    const pendingOvertime = overtime.filter(
      (item) => getStatus(item.status) === "pending"
    ).length;

    const present = attendance.filter(
      (item) => getStatus(item.status) === "present"
    ).length;

    const late = attendance.filter(
      (item) => getStatus(item.status) === "late"
    ).length;

    const absent = attendance.filter(
      (item) => getStatus(item.status) === "absent"
    ).length;

    const onLeave = attendance.filter(
      (item) => getStatus(item.status) === "on leave"
    ).length;

    return {
      totalCustomers: customers.length,
      activeCustomers,
      totalServices: services.length,
      activeServices,
      totalBookings: bookings.length,
      pendingBookings,
      scheduledBookings,
      inProgressBookings,
      completedBookings,
      totalEnquiries: enquiries.length,
      pendingEnquiries,
      totalEmployees: employees.length,
      pendingOvertime,
      attendanceCount: attendance.length,
      present,
      late,
      absent,
      onLeave,
    };
  }, [
    services,
    bookings,
    enquiries,
    customers,
    employees,
    attendance,
    overtime,
  ]);

  // API errors
  const errors = [
    servicesState.error,
    bookingsState.error,
    enquiriesState.error,
    customersState.error,
    attendanceState.error,
    overtimeState.error,
  ].filter(
    (error): error is string => Boolean(error)
  );

  return {
    stats,
    loading,
    errors,
    hasErrors: errors.length > 0,

    services,
    bookings,
    enquiries,
    customers,
    employees,
    attendance,
    overtime,
  };
}
