
import { useEffect, useMemo, useState } from "react";

import {
  useAppDispatch,
  useRootState,
} from "../../app/Hooks";

import {
  fetchCustomers,
  updateCustomer,
  setCustomerPassword,
  deleteCustomer,
  clearCustomerError,
} from "../../services/CustomerSlice";

import type { Customer } from "../../models/admin/Customer";

export function useCustomerViewModel() {
  const dispatch = useAppDispatch();

  const {
    customers,
    loading,
    updating,
    deleting,
    error,
  } = useRootState((state) => state.customers);

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCustomers());
  }, [dispatch]);

  const filteredCustomers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.company,
        customer.customerCode,
        customer.email,
        customer.phone,
        customer.city,
      ].some((field) =>
        String(field ?? "").toLowerCase().includes(value)
      )
    );
  }, [customers, search]);

  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const totalServiceLocations = customers.reduce(
    (total, customer) =>
      total + (customer.serviceLocations?.length ?? 0),
    0
  );

  const totalUpcomingMaintenance = customers.reduce(
    (total, customer) =>
      total + (customer.upcomingMaintenance?.length ?? 0),
    0
  );

  const openDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setSelectedCustomer(null);
    setShowDetails(false);
  };

  const openEditCustomer = (customer: Customer) => {
    dispatch(clearCustomerError());
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  
const handleUpdateCustomer = async (customer: Customer, newPassword?: string) => {
  if (!editingCustomer) return;

  const nameParts = customer.name.trim().split(/\s+/);
  const firstName = nameParts.shift() ?? "";
  const lastName = nameParts.join(" ");

  const result = await dispatch(
    updateCustomer({
      id: editingCustomer.id,
      changes: {
        firstName,
        lastName,
        email: customer.email.trim().toLowerCase(),
        phone: customer.phone.trim(),
        organizationName: customer.company.trim(),
      },
    })
  );

  if (updateCustomer.fulfilled.match(result)) {
    setSelectedCustomer((current) =>
      current?.id === result.payload.id
        ? result.payload
        : current
    );

    if (newPassword) {
      const passwordResult = await dispatch(setCustomerPassword({
        id: editingCustomer.id,
        newPassword,
      }));
      if (!setCustomerPassword.fulfilled.match(passwordResult)) {
        const passwordError = typeof passwordResult.payload === "string"
          ? passwordResult.payload
          : "Unable to update the customer password.";
        throw new Error(`Customer details were saved, but the password was not updated: ${passwordError}`);
      }
    }

    closeForm();
    return;
  }

  throw new Error(typeof result.payload === "string" ? result.payload : "Unable to update customer.");
};


  const handleDeleteCustomer = async (customer: Customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name} (${customer.customerCode})?`
    );

    if (!confirmed) return;

    dispatch(clearCustomerError());
    setDeleteMessage(null);
    const result = await dispatch(deleteCustomer(customer.id));

    if (deleteCustomer.fulfilled.match(result)) {
      setDeleteMessage(result.payload.deactivated
        ? `${customer.name} has linked records, so the account was deactivated.`
        : `${customer.name} and the linked user account were deleted.`);
      if (selectedCustomer?.id === customer.id) {
        closeDetails();
      }

      if (editingCustomer?.id === customer.id) {
        closeForm();
      }
    }
  };

  return {
    customers,
    filteredCustomers,
    search,
    setSearch,

    loading,
    updating,
    deleting,
    error,
    deleteMessage,

    activeCustomers,
    totalServiceLocations,
    totalUpcomingMaintenance,

    selectedCustomer,
    editingCustomer,
    showDetails,
    showForm,

    openDetails,
    closeDetails,
    openEditCustomer,
    closeForm,
    handleUpdateCustomer,
    handleDeleteCustomer,
  };
}
