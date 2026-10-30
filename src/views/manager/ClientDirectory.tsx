import {
  Calendar,
  Edit3,
  Eye,
  FileText,
  MapPin,
  Plus,
  Search,
  User,
  Users,
  X,
} from "lucide-react";


import { useEffect, useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/Hooks";
import { createCustomer, fetchCustomers } from "../../services/CustomerSlice";

interface ServiceLocation {
  id: number | string;
  name: string;
  address: string;
  city: string;
  type: string;
}

interface ServiceHistory {
  id: number;
  service: string;
  location: string;
  technician: string;
  date: string;
  status: "Completed" | "Pending" | "In Progress";
}

interface Customer {
  id: number | string;
  customerCode: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  city: string;
  status: "Active" | "Inactive";
  serviceLocations: ServiceLocation[];
  upcomingMaintenance: {
    service: string;
    location: string;
    date: string;
  }[];
  serviceHistory: ServiceHistory[];
}

export default function CustomerManagement() {
  const dispatch = useAppDispatch();
  const apiCustomers = useAppSelector((state) => state.customers.customers);
  const customerLoading = useAppSelector((state) => state.customers.loading);
  const customerError = useAppSelector((state) => state.customers.error);
  const customerCreating = useAppSelector((state) => state.customers.creating);
  const [customers, setCustomers] =
    useState<Customer[]>([]);

  const [search, setSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

  useEffect(() => {
    void dispatch(fetchCustomers());
  }, [dispatch]);

  useEffect(() => {
    setCustomers(apiCustomers);
  }, [apiCustomers]);

  const filteredCustomers = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(value) ||
        customer.company.toLowerCase().includes(value) ||
        customer.customerCode.toLowerCase().includes(value) ||
        customer.email.toLowerCase().includes(value) ||
        customer.phone.toLowerCase().includes(value) ||
        customer.city.toLowerCase().includes(value)
      );
    });
  }, [customers, search]);

  const handleAddCustomer = async (
    customer: Customer,
    password = "",
  ) => {
    const [firstName, ...lastNameParts] = customer.name.trim().split(/\s+/);
    if (!firstName) throw new Error("Enter the customer's name.");
    await dispatch(createCustomer({
      firstName,
      lastName: lastNameParts.join(" "),
      email: customer.email,
      phone: customer.phone,
      password,
    })).unwrap();
    setShowForm(false);
  };

  const handleUpdateCustomer = (
    customer: Customer
  ) => {
    setCustomers((current) =>
      current.map((item) =>
        item.id === customer.id
          ? customer
          : item
      )
    );

    setShowForm(false);
    setEditingCustomer(null);
  };

  const openAddCustomer = () => {
    setEditingCustomer(null);
    setShowForm(true);
  };

  const openEditCustomer = (
    customer: Customer
  ) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const openDetails = (
    customer: Customer
  ) => {
    setSelectedCustomer(customer);
    setShowDetails(true);
  };

  return (
    <div className="space-y-6">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Customer Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Client Directory
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage customers, service locations and service history.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddCustomer}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900"
        >
          <Plus size={17} />

          Add Customer
        </button>

      </div>

      {customerError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {customerError}
        </div>
      )}

      <p className="text-xs text-slate-500">Customer deletion is available to administrators.</p>

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <SummaryCard
          title="Total Customers"
          value={customers.length.toString()}
          icon={Users}
          iconClass="bg-indigo-50 text-indigo-700"
        />

        <SummaryCard
          title="Active Customers"
          value={
            customers.filter(
              (customer) =>
                customer.status === "Active"
            ).length.toString()
          }
          icon={User}
          iconClass="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          title="Service Locations"
          value={customers
            .reduce(
              (total, customer) =>
                total +
                customer.serviceLocations.length,
              0
            )
            .toString()}
          icon={MapPin}
          iconClass="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Upcoming Maintenance"
          value={customers
            .reduce(
              (total, customer) =>
                total +
                customer.upcomingMaintenance.length,
              0
            )
            .toString()}
          icon={Calendar}
          iconClass="bg-orange-50 text-orange-700"
        />

      </div>

      {/* ================================================= */}
      {/* CUSTOMER LIST */}
      {/* ================================================= */}

      
          <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

            {/* Table Header */}
            <div className="border-b border-slate-200 p-4 sm:p-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Customer Directory
                  </h2>
                  <p className="mt-1 text-xs text-slate-500">
                    View and manage all customer accounts.
                  </p>
                </div>

                {/* Search */}
                <div className="relative w-full lg:w-80">
                  <Search
                    size={17}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search customers..."
                    className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>
            </div>

            {/* Mobile Customer Cards */}
            <div className="space-y-3 p-3 sm:p-4 md:hidden">
              {filteredCustomers.length === 0 ? (
                <div className="px-4 py-12 text-center">
                  {customerLoading ? (
                    <p className="text-sm text-slate-500">Loading customers…</p>
                  ) : <Users size={30} className="mx-auto text-slate-300" />}
                  <p className="mt-3 text-sm font-semibold text-slate-700">
                    {customerLoading ? "" : search ? "No customers found" : "No client records found"}
                  </p>
                  {!customerLoading && search && (
                    <p className="mt-1 text-xs text-slate-400">Try a different search term.</p>
                  )}
                </div>
              ) : (
                filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200"
                  >
                    {/* Customer Information */}
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-800">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold text-slate-900">
                          {customer.company}
                        </p>
                        <p className="mt-1 break-words text-xs text-slate-500">
                          {customer.customerCode} · {customer.name}
                        </p>

                        <div className="mt-2">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              customer.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact and Location */}
                    <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 min-[375px]:grid-cols-2">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Phone
                        </p>
                        <p className="mt-1 break-words text-xs text-slate-700">
                          {customer.phone}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Email
                        </p>
                        <p className="mt-1 break-all text-xs text-slate-500">
                          {customer.email}
                        </p>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Location
                        </p>
                        <div className="mt-1 flex min-w-0 items-start gap-1.5 text-xs text-slate-600">
                          <MapPin
                            size={13}
                            className="mt-0.5 shrink-0 text-slate-400"
                          />
                          <span className="break-words">{customer.city}</span>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                          Service Locations
                        </p>
                        <div className="mt-1">
                          <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            {customer.serviceLocations.length} Locations
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => openDetails(customer)}
                        title="View customer"
                        aria-label={`View ${customer.name}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditCustomer(customer)}
                        title="Edit customer"
                        aria-label={`Edit ${customer.name}`}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <Edit3 size={16} />
                        Edit
                      </button>

                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop and Tablet Table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left">
                    <th className="whitespace-nowrap px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Customer
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Contact
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Location
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Service Locations
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Status
                    </th>
                    <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        {customerLoading ? (
                          <p className="text-sm text-slate-500">Loading customers…</p>
                        ) : <Users size={30} className="mx-auto text-slate-300" />}
                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {customerLoading ? "" : search ? "No customers found" : "No client records found"}
                        </p>
                        {!customerLoading && search && (
                          <p className="mt-1 text-xs text-slate-400">Try a different search term.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((customer) => (
                      <tr
                        key={customer.id}
                        className="border-b border-slate-100 transition hover:bg-slate-50"
                      >
                        {/* Customer */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-800">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-900">
                                {customer.company}
                              </p>
                              <p className="mt-0.5 whitespace-nowrap text-[11px] text-slate-500">
                                {customer.customerCode} · {customer.name}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="px-5 py-4">
                          <p className="text-xs text-slate-700">
                            {customer.phone}
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            {customer.email}
                          </p>
                        </td>

                        {/* Location */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-slate-600">
                            <MapPin size={13} className="shrink-0 text-slate-400" />
                            {customer.city}
                          </div>
                        </td>

                        {/* Service Locations */}
                        <td className="px-5 py-4">
                          <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                            {customer.serviceLocations.length} Locations
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              customer.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {customer.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openDetails(customer)}
                              title="View customer"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditCustomer(customer)}
                              title="Edit customer"
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                            >
                              <Edit3 size={16} />
                            </button>

                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-4 py-3 sm:px-5">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {filteredCustomers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {customers.length}
                </span>{" "}
                customers
              </p>
            </div>
          </div>


      {/* ================================================= */}
      {/* CUSTOMER DETAILS MODAL */}
      {/* ================================================= */}

      {showDetails && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={() => {
            setShowDetails(false);
            setSelectedCustomer(null);
          }}
        />
      )}

      {/* ================================================= */}
      {/* ADD / EDIT CUSTOMER MODAL */}
      {/* ================================================= */}

      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          saving={customerCreating}
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          onSave={
            editingCustomer
              ? async (customer) => { handleUpdateCustomer(customer); }
              : handleAddCustomer
          }
        />
      )}

    </div>
  );
}

/* ===================================================== */
/* SUMMARY CARD */
/* ===================================================== */

interface SummaryCardProps {
  title: string;
  value: string;
  icon: React.ElementType;
  iconClass: string;
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>

      </div>

    </div>
  );
}

/* ===================================================== */
/* CUSTOMER DETAILS MODAL */
/* ===================================================== */

interface CustomerDetailsModalProps {
  customer: Customer;
  onClose: () => void;
}

function CustomerDetailsModal({
  customer,
  onClose,
}: CustomerDetailsModalProps) {
  return (
    <Modal onClose={onClose}>

      {/* Header */}
      <div className="border-b border-slate-200 p-5">

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-800">
              {customer.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>

              <p className="text-xs font-semibold text-emerald-700">
                {customer.customerCode}
              </p>

              <h2 className="text-xl font-bold text-slate-900">
                {customer.company}
              </h2>

              <p className="text-xs text-slate-500">
                {customer.name}
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>

        </div>

      </div>

      <div className="max-h-[70vh] overflow-y-auto p-5">

        {/* Customer Information */}
        <section>

          <h3 className="text-sm font-bold text-slate-900">
            Customer Details
          </h3>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">

            <InfoItem
              label="Contact Person"
              value={customer.name}
              icon={User}
            />

            <InfoItem
              label="Phone"
              value={customer.phone}
              icon={User}
            />

            <InfoItem
              label="Email"
              value={customer.email}
              icon={FileText}
            />

            <InfoItem
              label="City"
              value={customer.city}
              icon={MapPin}
            />

          </div>

        </section>

        {/* Service Locations */}
        <section className="mt-6">

          <div className="flex items-center justify-between">

            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Service Locations
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Locations where services are provided.
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
              {customer.serviceLocations.length} Locations
            </span>

          </div>

          <div className="mt-3 space-y-2">

            {customer.serviceLocations.map(
              (location) => (
                <div
                  key={location.id}
                  className="rounded-lg border border-slate-200 p-3"
                >

                  <div className="flex gap-3">

                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <MapPin size={15} />
                    </div>

                    <div>

                      <p className="text-xs font-semibold text-slate-800">
                        {location.name}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {location.address},{" "}
                        {location.city}
                      </p>

                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                        {location.type}
                      </span>

                    </div>

                  </div>

                </div>
              )
            )}

          </div>

        </section>

        {/* Upcoming Maintenance */}
        <section className="mt-6">

          <h3 className="text-sm font-bold text-slate-900">
            Upcoming Maintenance
          </h3>

          <div className="mt-3 space-y-2">

            {customer.upcomingMaintenance.length ===
            0 ? (

              <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
                No upcoming maintenance scheduled.
              </div>

            ) : (

              customer.upcomingMaintenance.map(
                (maintenance, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                        <Calendar size={15} />
                      </div>

                      <div>

                        <p className="text-xs font-semibold text-slate-800">
                          {maintenance.service}
                        </p>

                        <p className="mt-1 text-[10px] text-slate-500">
                          {maintenance.location}
                        </p>

                      </div>

                    </div>

                    <p className="text-[10px] font-semibold text-slate-600">
                      {maintenance.date}
                    </p>

                  </div>
                )
              )

            )}

          </div>

        </section>

        {/* Service History */}
        <section className="mt-6">

          <h3 className="text-sm font-bold text-slate-900">
            Previous Work / Service History
          </h3>

          <div className="mt-3 overflow-x-auto">

            <table className="w-full min-w-[600px]">

              <thead>

                <tr className="border-b border-slate-200 text-left">

                  <th className="pb-2 text-[10px] font-bold uppercase text-slate-500">
                    Service
                  </th>

                  <th className="pb-2 text-[10px] font-bold uppercase text-slate-500">
                    Location
                  </th>

                  <th className="pb-2 text-[10px] font-bold uppercase text-slate-500">
                    Technician
                  </th>

                  <th className="pb-2 text-[10px] font-bold uppercase text-slate-500">
                    Date
                  </th>

                  <th className="pb-2 text-[10px] font-bold uppercase text-slate-500">
                    Status
                  </th>

                </tr>

              </thead>

              <tbody>

                {customer.serviceHistory.map(
                  (history) => (
                    <tr
                      key={history.id}
                      className="border-b border-slate-100"
                    >

                      <td className="py-3 text-xs font-medium text-slate-800">
                        {history.service}
                      </td>

                      <td className="py-3 text-xs text-slate-500">
                        {history.location}
                      </td>

                      <td className="py-3 text-xs text-slate-500">
                        {history.technician}
                      </td>

                      <td className="py-3 text-xs text-slate-500">
                        {history.date}
                      </td>

                      <td className="py-3">

                        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                          {history.status}
                        </span>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

    </Modal>
  );
}

/* ===================================================== */
/* CUSTOMER FORM MODAL */
/* ===================================================== */

interface CustomerFormModalProps {
  customer: Customer | null;
  saving: boolean;
  onClose: () => void;
  onSave: (customer: Customer, password?: string) => Promise<void>;
}

function CustomerFormModal({
  customer,
  saving,
  onClose,
  onSave,
}: CustomerFormModalProps) {
  const [name, setName] = useState(
    customer?.name ?? ""
  );

  const [company, setCompany] = useState(
    customer?.company ?? ""
  );

  const [email, setEmail] = useState(
    customer?.email ?? ""
  );

  const [phone, setPhone] = useState(
    customer?.phone ?? ""
  );

  const [city, setCity] = useState(
    customer?.city ?? ""
  );

  const [status, setStatus] =
    useState<Customer["status"]>(
      customer?.status ?? "Active"
    );

  const [formError, setFormError] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    setFormError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim()
    ) {
      setFormError("Enter the customer's name, email, and phone number.");
      return;
    }
    if (!customer && password.length < 8) {
      setFormError("Set a password with at least 8 characters for the customer account.");
      return;
    }

    const newCustomer: Customer = {
      id: customer?.id ?? Date.now(),

      customerCode:
        customer?.customerCode ??
        `CUS-${1000 + Date.now() % 1000}`,

      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      status,

      serviceLocations:
        customer?.serviceLocations ?? [],

      upcomingMaintenance:
        customer?.upcomingMaintenance ?? [],

      serviceHistory:
        customer?.serviceHistory ?? [],
    };

    try {
      await onSave(newCustomer, password);
    } catch (error) {
      setFormError(typeof error === "string" ? error : error instanceof Error ? error.message : "Unable to save customer.");
    }
  };

  return (
    <Modal onClose={onClose}>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 p-5">

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Customer Management
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {customer
              ? "Edit Customer"
              : "Add Customer"}
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>

      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-5"
      >

        <div className="grid gap-4 sm:grid-cols-2">

          <InputField
            label="Contact Person"
            value={name}
            onChange={setName}
            placeholder="Enter customer name"
          />

          {customer && <InputField
            label="Company Name"
            value={company}
            onChange={setCompany}
            placeholder="Enter company name"
          />}

          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="customer@example.com"
          />

          <InputField
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="+91 XXXXX XXXXX"
          />

          {!customer && <InputField
            label="Temporary password"
            value={password}
            onChange={setPassword}
            type="password"
            placeholder="At least 8 characters"
          />}

          {customer && <InputField
            label="City"
            value={city}
            onChange={setCity}
            placeholder="Enter city"
          />}

          {customer && <div>

            <label className="mb-1.5 block text-xs font-semibold text-slate-700">
              Status
            </label>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target
                    .value as Customer["status"]
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>}

        </div>

        {formError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}

        {/* Form Actions */}
        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            {saving ? "Saving…" : customer
              ? "Update Customer"
              : "Add Customer"}
          </button>

        </div>

      </form>

    </Modal>
  );
}

/* ===================================================== */
/* INPUT FIELD */
/* ===================================================== */

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: InputFieldProps) {
  return (
    <div>

      <label className="mb-1.5 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />

    </div>
  );
}

/* ===================================================== */
/* INFO ITEM */
/* ===================================================== */

interface InfoItemProps {
  label: string;
  value: string;
  icon: React.ElementType;
}

function InfoItem({
  label,
  value,
  icon: Icon,
}: InfoItemProps) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">

      <div className="flex items-center gap-2">

        <Icon
          size={14}
          className="text-slate-400"
        />

        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>

      </div>

      <p className="mt-1 text-xs font-semibold text-slate-800">
        {value}
      </p>

    </div>
  );
}

/* ===================================================== */
/* MODAL */
/* ===================================================== */

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

function Modal({
  children,
  onClose,
}: ModalProps) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/10 p-4 backdrop-blur-[2px]">

      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {children}

      </div>

    </div>
  );
}
