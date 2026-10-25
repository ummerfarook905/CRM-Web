
import { useEffect, useMemo, useState } from "react";

import {
  clearEmployeeError,
  addEmployee,
  deleteEmployeeApi,
  fetchEmployees,
  updateEmployeeApi,
} from "../../services/EmployeesSlice";

import { useAppDispatch, useAppSelector } from "../../app/Hooks";

import type {
  Employee,
  EmployeeForm,
  CreateEmployeePayload,
} from "../../models/admin/Employee";

type ModalMode = "add" | "edit" | "view" | null;

// Password is required for creation but is not part of the employee record.
type EmployeeFormValues = EmployeeForm & {
  password: string;
  isActive: boolean;
};

const emptyForm: EmployeeFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  designation: "",
  joiningDate: "",
  isActive: true,
};

export function useEmployeesViewModel() {
  const dispatch = useAppDispatch();

  const employees = useAppSelector(
    (state) => state.employees.items,
  );

  const loading = useAppSelector(
    (state) => state.employees.loading,
  );

  const error = useAppSelector(
    (state) => state.employees.error,
  );

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const [modalMode, setModalMode] = useState<ModalMode>(null);

  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee | null>(null);

  const [form, setForm] = useState<EmployeeFormValues>({
    ...emptyForm,
  });

  const [formError, setFormError] = useState("");

  // Load employee records from the API through Redux.
  useEffect(() => {
    void dispatch(fetchEmployees());
  }, [dispatch]);

  const activeCount = employees.filter(
    (employee) => employee.status === "Active",
  ).length;

  const inactiveCount = employees.length - activeCount;

  const departments = useMemo(
    () =>
      [...new Set(employees.map((employee) => employee.department))]
        .sort(),
    [employees],
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch = [
        employee.id,
        employee.employeeNo,
        employee.name,
        employee.email,
        employee.phone,
        employee.department,
        employee.designation,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query),
      );

      const matchesDepartment =
        departmentFilter === "All" ||
        employee.department === departmentFilter;

      const matchesStatus =
        statusFilter === "All" ||
        employee.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  function openAddModal() {
    dispatch(clearEmployeeError());
    setForm({ ...emptyForm });
    setSelectedEmployee(null);
    setFormError("");
    setModalMode("add");
  }

  function openViewModal(employee: Employee) {
    dispatch(clearEmployeeError());
    setSelectedEmployee(employee);
    setFormError("");
    setModalMode("view");
  }

  function openEditModal(employee: Employee) {
  dispatch(clearEmployeeError());
  setSelectedEmployee(employee);

  const nameParts = employee.name.trim().split(/\s+/);

  setForm({
    firstName: nameParts[0] ?? "",
    lastName: nameParts.slice(1).join(" "),
    email: employee.email,
    phone: employee.phone,
    designation: employee.designation,
    joiningDate: employee.joiningDate,
    password: "",
    isActive: employee.status === "Active",
  });

  setFormError("");
  setModalMode("edit");
}

  function closeModal() {
    setModalMode(null);
    setSelectedEmployee(null);
    setFormError("");
    setForm({ ...emptyForm });
    dispatch(clearEmployeeError());
  }

  function updateForm<K extends keyof EmployeeFormValues>(
    key: K,
    value: EmployeeFormValues[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  
async function handleSubmit(
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();

  setFormError("");
  dispatch(clearEmployeeError());

  const firstName = form.firstName.trim();
  const lastName = form.lastName.trim();
  const normalizedEmail = form.email.trim().toLowerCase();

  if (!firstName) {
    setFormError("Please enter the employee's first name.");
    return;
  }

  if (!lastName) {
    setFormError("Please enter the employee's last name.");
    return;
  }

  if (!normalizedEmail) {
    setFormError("Please enter an email address.");
    return;
  }

  if (!form.phone.trim()) {
    setFormError("Please enter a phone number.");
    return;
  }

  if (!form.designation.trim()) {
    setFormError("Please enter the employee's designation.");
    return;
  }

  const duplicateEmail = employees.some(
    (employee) =>
      employee.email.toLowerCase() === normalizedEmail &&
      employee.id !== selectedEmployee?.id,
  );

  if (duplicateEmail) {
    setFormError("An employee with this email address already exists.");
    return;
  }

  try {
    if (modalMode === "add") {
      if (!form.password.trim()) {
        setFormError("Please enter a password for the new employee.");
        return;
      }

      if (form.password.length < 8) {
        setFormError("Password must be at least 8 characters.");
        return;
      }

      const requestBody: CreateEmployeePayload = {
        firstName,
        lastName,
        email: normalizedEmail,
        phone: form.phone.trim(),
        password: form.password,
        designation: form.designation.trim(),
        ...(form.joiningDate
          ? { joiningDate: form.joiningDate }
          : {}),
      };

      await dispatch(addEmployee(requestBody)).unwrap();
    } else if (modalMode === "edit" && selectedEmployee) {
      await dispatch(
        updateEmployeeApi({
          id: selectedEmployee.id,
          updates: {
            firstName,
            lastName,
            // email: normalizedEmail,
            phone: form.phone.trim(),
            designation: form.designation.trim(),
            joiningDate: form.joiningDate || undefined,
            isActive: form.isActive,
          },
        }),
      ).unwrap();
    } else {
      return;
    }

    closeModal();
  } catch (err: unknown) {
  console.error("Save employee failed:", err);

  setFormError(
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : "Unable to save employee. Check the browser console and Network response.",
  );
}
}


  async function handleDelete(employee: Employee) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee.name}?`,
    );

    if (!confirmed) return;

    dispatch(clearEmployeeError());

    try {
      await dispatch(deleteEmployeeApi(employee.id)).unwrap();

      if (selectedEmployee?.id === employee.id) {
        closeModal();
      }
    } catch {
      // The API error is available in Redux state.
    }
  }

  function clearFilters() {
    setSearch("");
    setDepartmentFilter("All");
    setStatusFilter("All");
  }

  return {
    employees,
    loading,
    error,
    activeCount,
    inactiveCount,
    departments,
    filteredEmployees,
    search,
    setSearch,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    modalMode,
    selectedEmployee,
    form,
    formError,
    updateForm,
    openAddModal,
    openViewModal,
    openEditModal,
    closeModal,
    handleSubmit,
    handleDelete,
    clearFilters,
  };
}
