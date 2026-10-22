
import { useMemo, useState } from "react";

import {
  useAppDispatch,
  useRootState,
} from "../../app/Hooks";

import {
  updateCustomer,
  deleteCustomer,
} from "../../services/CustomerSlice";

import type { Customer } from "../../models/admin/Customer";

export function useCustomerViewModel() {
  const dispatch = useAppDispatch();

  // Shared customer state from Redux
  const customers = useRootState(
    (state) => state.customers.customers
  );

  // View-related state
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  const [showDetails, setShowDetails] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Search and filtering logic
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
        field.toLowerCase().includes(value)
      )
    );
  }, [customers, search]);

  // Summary calculations
  const activeCustomers = customers.filter(
    (customer) => customer.status === "Active"
  ).length;

  const totalServiceLocations = customers.reduce(
    (total, customer) =>
      total + customer.serviceLocations.length,
    0
  );

  const totalUpcomingMaintenance = customers.reduce(
    (total, customer) =>
      total + customer.upcomingMaintenance.length,
    0
  );

  // Open customer details
  const openDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  const closeDetails = () => {
    setSelectedCustomer(null);
    setShowDetails(false);
  };

  // Open edit form
  const openEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  // Update customer through Redux
  const handleUpdateCustomer = (customer: Customer) => {
    dispatch(updateCustomer(customer));
    closeForm();
  };

  // Delete customer through Redux
  const handleDeleteCustomer = (customer: Customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name} (${customer.customerCode})?`
    );

    if (!confirmed) return;

    dispatch(deleteCustomer(customer.id));

    if (selectedCustomer?.id === customer.id) {
      closeDetails();
    }

    if (editingCustomer?.id === customer.id) {
      closeForm();
    }
  };

  return {
    customers,
    filteredCustomers,
    search,
    setSearch,

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
