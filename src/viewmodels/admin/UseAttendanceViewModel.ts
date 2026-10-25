
import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchAttendance } from "../../services/AttendancesSlice";
import type { AttendanceRecord } from "../../models/admin/Attendance";

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export function useAttendanceViewModel() {
  const dispatch = useAppDispatch();

  const {
    items: records,
    loading,
    error,
  } = useAppSelector((state) => state.attendance);

  // UI-only state belongs in the ViewModel.
  const [selectedDate, setSelectedDate] = useState(today);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRecord, setSelectedRecord] =
    useState<AttendanceRecord | null>(null);

  useEffect(() => {
    void dispatch(fetchAttendance());
  }, [dispatch]);

  const departments = useMemo(
    () =>
      [...new Set(records.map((record) => record.department))]
        .filter((department) => department !== "—")
        .sort(),
    [records],
  );

  const dateRecords = useMemo(
    () => records.filter((record) => record.date === selectedDate),
    [records, selectedDate],
  );

  const presentCount = dateRecords.filter(
    (record) => record.status === "Present",
  ).length;

  const lateCount = dateRecords.filter(
    (record) => record.status === "Late",
  ).length;

  const absentCount = dateRecords.filter(
    (record) => record.status === "Absent",
  ).length;

  const leaveCount = dateRecords.filter(
    (record) => record.status === "On Leave",
  ).length;

  const attendanceRate =
    dateRecords.length > 0
      ? Math.round(
          ((presentCount + lateCount) / dateRecords.length) * 1000,
        ) / 10
      : 0;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return dateRecords.filter((record) => {
      const matchesSearch = [
        record.employeeId,
        record.name,
        record.department,
        record.designation,
        record.location,
      ].some((value) => value.toLowerCase().includes(query));

      const matchesDepartment =
        departmentFilter === "All" ||
        record.department === departmentFilter;

      const matchesStatus =
        statusFilter === "All" ||
        record.status === statusFilter;

      return (
        matchesSearch && matchesDepartment && matchesStatus
      );
    });
  }, [dateRecords, search, departmentFilter, statusFilter]);

  function clearFilters() {
    setSearch("");
    setDepartmentFilter("All");
    setStatusFilter("All");
  }

  function refreshAttendance() {
    return dispatch(fetchAttendance());
  }

  return {
    records,
    loading,
    error,

    selectedDate,
    setSelectedDate,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    selectedRecord,
    setSelectedRecord,

    departments,
    dateRecords,
    filteredRecords,
    presentCount,
    lateCount,
    absentCount,
    leaveCount,
    attendanceRate,

    clearFilters,
    refreshAttendance,
  };
}
