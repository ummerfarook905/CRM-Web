
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import {
  clearOvertimeError,
  decideOvertime,
  fetchOvertime,
  recordOvertimePayment,
} from "../../services/OvertimeSlice";
import type {
  OvertimeRequest as ApiOvertimeRequest,
} from "../../services/OvertimeSlice";

export type OvertimeViewRequest = ApiOvertimeRequest & {
  rejectionReason?: string;
  overtimeSalary?: number;
};

const today = () => new Date().toISOString().slice(0, 10);

const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
};

export function useOvertimeViewModel() {
  const dispatch = useAppDispatch();

  const {
    requests: apiRequests,
    loading,
    updating,
    paying,
    error,
  } = useAppSelector((state) => state.overtime);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");

  const [selectedRequest, setSelectedRequest] =
    useState<OvertimeViewRequest | null>(null);
  const [rejectionTarget, setRejectionTarget] =
    useState<OvertimeViewRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionError, setActionError] = useState("");

  const [approvalTarget, setApprovalTarget] =
    useState<OvertimeViewRequest | null>(null);
  const [salaryInput, setSalaryInput] = useState("");
  const [salaryError, setSalaryError] = useState("");

  // Map API records to the fields used by the UI.
  const requests = useMemo<OvertimeViewRequest[]>(
    () =>
      apiRequests.map((request) => ({
        ...request,
        rejectionReason:
          request.status === "Rejected" ? request.note : undefined,
        overtimeSalary: request.amount,
      })),
    [apiRequests],
  );

  // Fetch requests using the selected status and date filters.
  useEffect(() => {
    const params: {
      page: number;
      limit: number;
      status?: "PENDING" | "APPROVED" | "REJECTED";
      dateFrom?: string;
      dateTo?: string;
    } = {
      page: 1,
      limit: 100,
    };

    if (statusFilter !== "All") {
      params.status = statusFilter.toUpperCase() as
        | "PENDING"
        | "APPROVED"
        | "REJECTED";
    }

    if (dateFilter === "Today") {
      params.dateFrom = today();
      params.dateTo = today();
    } else if (dateFilter === "Last 7 Days") {
      params.dateFrom = daysAgo(6);
      params.dateTo = today();
    }

    void dispatch(fetchOvertime(params));
  }, [dispatch, statusFilter, dateFilter]);

  useEffect(() => {
    if (error) {
      setActionError(error);
    }
  }, [error]);

  // Available departments for the department filter.
  const departments = useMemo(
    () =>
      [
        ...new Set(
          requests.map((request) => request.department || "Unassigned"),
        ),
      ].sort((a, b) => a.localeCompare(b)),
    [requests],
  );

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === "Pending"),
    [requests],
  );

  const approvedRequests = useMemo(
    () => requests.filter((request) => request.status === "Approved"),
    [requests],
  );

  const rejectedRequests = useMemo(
    () => requests.filter((request) => request.status === "Rejected"),
    [requests],
  );

  const totalOvertimeHours = useMemo(
    () =>
      approvedRequests.reduce(
        (total, request) => total + (request.overtimeHours ?? 0),
        0,
      ),
    [approvedRequests],
  );

  // Search and filter the loaded requests.
  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch = [
        request.id,
        request.employeeId,
        request.employeeName,
        request.department,
        request.designation,
        request.reason,
      ].some((value) => (value || "").toLowerCase().includes(query));

      const matchesStatus =
        statusFilter === "All" || request.status === statusFilter;

      const matchesDepartment =
        departmentFilter === "All" ||
        (request.department || "Unassigned") === departmentFilter;

      const requestDate = request.date?.slice(0, 10) ?? "";

      const matchesDate =
        dateFilter === "All" ||
        (dateFilter === "Today" && requestDate === today()) ||
        (dateFilter === "Last 7 Days" &&
          requestDate >= daysAgo(6) &&
          requestDate <= today());

      return (
        matchesSearch &&
        matchesStatus &&
        matchesDepartment &&
        matchesDate
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    departmentFilter,
    dateFilter,
  ]);

  // Open the approval modal.
  const approveRequest = useCallback((request: OvertimeViewRequest) => {
    if (request.status !== "Pending") return;

    setSelectedRequest(null);
    setApprovalTarget(request);
    setSalaryInput(request.overtimeSalary?.toString() ?? "");
    setSalaryError("");
    setActionError("");
  }, []);

  // Approve the request and record the payment.
  const confirmApproval = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!approvalTarget || approvalTarget.status !== "Pending") {
        return;
      }

      const salary = Number(salaryInput);

      if (
        !salaryInput.trim() ||
        !Number.isFinite(salary) ||
        salary < 0.01
      ) {
        setSalaryError("Enter a valid overtime salary greater than zero.");
        return;
      }

      setSalaryError("");
      setActionError("");

      try {
        await dispatch(
          decideOvertime({
            id: approvalTarget.id,
            changes: {
              decision: "APPROVED",
              note: "Overtime request approved.",
            },
          }),
        ).unwrap();

        await dispatch(
          recordOvertimePayment({
            id: approvalTarget.id,
            payment: {
              amount: Math.round(salary * 100) / 100,
            },
          }),
        ).unwrap();

        setApprovalTarget(null);
        setSalaryInput("");

        await dispatch(
          fetchOvertime({ page: 1, limit: 100 }),
        ).unwrap();
      } catch (caught) {
        setActionError(
          typeof caught === "string"
            ? caught
            : "Could not approve the request or record its payment. Please refresh and check its status.",
        );
      }
    },
    [approvalTarget, salaryInput, dispatch],
  );

  // Open the rejection modal.
  const openRejectDialog = useCallback(
    (request: OvertimeViewRequest) => {
      if (request.status !== "Pending") return;

      setSelectedRequest(null);
      setRejectionTarget(request);
      setRejectionReason("");
      setActionError("");
    },
    [],
  );

  // Reject a request with a required note.
  const confirmRejection = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (!rejectionTarget) return;

      const reason = rejectionReason.trim();

      if (!reason) {
        setActionError("Please provide a reason for rejection.");
        return;
      }

      if (reason.length > 1000) {
        setActionError(
          "The rejection reason must be 1000 characters or fewer.",
        );
        return;
      }

      setActionError("");

      try {
        await dispatch(
          decideOvertime({
            id: rejectionTarget.id,
            changes: {
              decision: "REJECTED",
              note: reason,
            },
          }),
        ).unwrap();

        setRejectionTarget(null);
        setRejectionReason("");

        await dispatch(
          fetchOvertime({ page: 1, limit: 100 }),
        ).unwrap();
      } catch (caught) {
        setActionError(
          typeof caught === "string"
            ? caught
            : "Failed to reject overtime request.",
        );
      }
    },
    [dispatch, rejectionTarget, rejectionReason],
  );

  // Clear errors from the ViewModel and Redux slice.
  const clearActionError = useCallback(() => {
    setActionError("");
    dispatch(clearOvertimeError());
  }, [dispatch]);

  return {
    requests,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    departmentFilter,
    setDepartmentFilter,
    dateFilter,
    setDateFilter,
    selectedRequest,
    setSelectedRequest,
    rejectionTarget,
    setRejectionTarget,
    rejectionReason,
    setRejectionReason,
    actionError,
    setActionError,
    clearActionError,
    approvalTarget,
    setApprovalTarget,
    salaryInput,
    setSalaryInput,
    salaryError,
    setSalaryError,
    departments,
    pendingRequests,
    approvedRequests,
    rejectedRequests,
    totalOvertimeHours,
    filteredRequests,
    approveRequest,
    confirmApproval,
    openRejectDialog,
    confirmRejection,
    loading,
    updating,
    paying,
    error,
  };
}
