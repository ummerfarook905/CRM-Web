import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { fetchEmployees } from "../../services/EmployeesSlice";

export function useAssignableEmployees() {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((state) => state.employees);

  useEffect(() => {
    if (items.length === 0 && !loading && !error) {
      void dispatch(fetchEmployees());
    }
  }, [dispatch, error, items.length, loading]);

  const employees = useMemo(
    () =>
      // Employee designations are configurable, so a hard-coded role-name
      // filter can hide valid staff (for example, service coordinators).
      // Scheduling can be assigned to any active employee.
      items.filter((employee) => employee.status === "Active" && employee.name.trim()),
    [items],
  );

  return { employees, loading, error };
}
