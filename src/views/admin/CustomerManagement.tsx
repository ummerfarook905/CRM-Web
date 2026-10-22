
import { useState } from "react";
import type { ElementType, FormEvent, ReactNode } from "react";

import {
  Calendar,
  Edit3,
  Eye,
  FileText,
  MapPin,
  Search,
  User,
  Users,
  Trash2,
  X,
} from "lucide-react";

import type { Customer } from "../../models/admin/Customer";
import { useCustomerViewModel } from "../../viewmodels/admin/UseCustomerViewModel";

export default function CustomerManagement() {
  const {
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
  } = useCustomerViewModel();

  return (
    <div className="space-y-6">
      {/* HEADER */}
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
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Customers"
          value={customers.length.toString()}
          icon={Users}
          iconClass="bg-indigo-50 text-indigo-700"
        />

        <SummaryCard
          title="Active Customers"
          value={activeCustomers.toString()}
          icon={User}
          iconClass="bg-emerald-50 text-emerald-700"
        />

        <SummaryCard
          title="Service Locations"
          value={totalServiceLocations.toString()}
          icon={MapPin}
          iconClass="bg-blue-50 text-blue-700"
        />

        <SummaryCard
          title="Upcoming Maintenance"
          value={totalUpcomingMaintenance.toString()}
          icon={Calendar}
          iconClass="bg-orange-50 text-orange-700"
        />
      </div>

      {/* CUSTOMER DIRECTORY */}
      <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* TABLE HEADER AND SEARCH */}
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
                aria-label="Search customers"
                className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>
        </div>

        {/* MOBILE CUSTOMER CARDS */}
        <div className="space-y-3 p-3 sm:p-4 md:hidden">
          {filteredCustomers.length === 0 ? (
            <EmptyCustomers />
          ) : (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-emerald-200"
              >
                {/* CUSTOMER INFORMATION */}
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
                      <CustomerStatus status={customer.status} />
                    </div>
                  </div>
                </div>

                {/* CONTACT AND LOCATION */}
                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 min-[375px]:grid-cols-2">
                  <div className="min-w-0">
                    <FieldLabel>Phone</FieldLabel>
                    <p className="mt-1 break-words text-xs text-slate-700">
                      {customer.phone}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <FieldLabel>Email</FieldLabel>
                    <p className="mt-1 break-all text-xs text-slate-500">
                      {customer.email}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <FieldLabel>Location</FieldLabel>
                    <div className="mt-1 flex min-w-0 items-start gap-1.5 text-xs text-slate-600">
                      <MapPin
                        size={13}
                        className="mt-0.5 shrink-0 text-slate-400"
                      />
                      <span className="break-words">{customer.city}</span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <FieldLabel>Service Locations</FieldLabel>
                    <div className="mt-1">
                      <span className="inline-flex max-w-full rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {customer.serviceLocations.length} Locations
                      </span>
                    </div>
                  </div>
                </div>

                {/* MOBILE ACTIONS */}
                <div className="mt-4 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => openDetails(customer)}
                    aria-label={`View ${customer.name}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    <Eye size={16} />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditCustomer(customer)}
                    aria-label={`Edit ${customer.name}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                  >
                    <Edit3 size={16} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteCustomer(customer)}
                    aria-label={`Delete ${customer.name}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-100"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP AND TABLET TABLE */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left">
                <TableHeader>Customer</TableHeader>
                <TableHeader>Contact</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Service Locations</TableHeader>
                <TableHeader>Status</TableHeader>

                <th className="whitespace-nowrap px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center">
                    <EmptyCustomers />
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr
                    key={customer.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    {/* CUSTOMER */}
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

                    {/* CONTACT */}
                    <td className="px-5 py-4">
                      <p className="text-xs text-slate-700">
                        {customer.phone}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {customer.email}
                      </p>
                    </td>

                    {/* LOCATION */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <MapPin
                          size={13}
                          className="shrink-0 text-slate-400"
                        />
                        {customer.city}
                      </div>
                    </td>

                    {/* SERVICE LOCATIONS */}
                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                        {customer.serviceLocations.length} Locations
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="px-5 py-4">
                      <CustomerStatus status={customer.status} />
                    </td>

                    {/* ACTIONS */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openDetails(customer)}
                          title="View customer"
                          aria-label={`View ${customer.name}`}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Eye size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditCustomer(customer)}
                          title="Edit customer"
                          aria-label={`Edit ${customer.name}`}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Edit3 size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCustomer(customer)}
                          title="Delete customer"
                          aria-label={`Delete ${customer.name}`}
                          className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* FOOTER */}
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

      {/* CUSTOMER DETAILS MODAL */}
      {showDetails && selectedCustomer && (
        <CustomerDetailsModal
          customer={selectedCustomer}
          onClose={closeDetails}
        />
      )}

      {/* EDIT CUSTOMER MODAL */}
      {showForm && editingCustomer && (
        <CustomerFormModal
          key={editingCustomer.id}
          customer={editingCustomer}
          onClose={closeForm}
          onSave={handleUpdateCustomer}
        />
      )}
    </div>
  );
}

/* =====================================================
   SUMMARY CARD
===================================================== */

interface SummaryCardProps {
  title: string;
  value: string;
  icon: ElementType;
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   TABLE HEADER
===================================================== */

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="whitespace-nowrap px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

/* =====================================================
   FIELD LABEL
===================================================== */

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
      {children}
    </p>
  );
}

/* =====================================================
   CUSTOMER STATUS
===================================================== */

function CustomerStatus({
  status,
}: {
  status: Customer["status"];
}) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${
        status === "Active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   EMPTY CUSTOMERS
===================================================== */

function EmptyCustomers() {
  return (
    <div className="px-4 py-8 text-center">
      <Users size={30} className="mx-auto text-slate-300" />

      <p className="mt-3 text-sm font-semibold text-slate-700">
        No customers found
      </p>

      <p className="mt-1 text-xs text-slate-400">
        Try a different search term.
      </p>
    </div>
  );
}

/* =====================================================
   CUSTOMER DETAILS MODAL
===================================================== */

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
      {/* HEADER */}
      <div className="border-b border-slate-200 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg font-bold text-emerald-800">
              {customer.name.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold text-emerald-700">
                {customer.customerCode}
              </p>

              <h2 className="break-words text-xl font-bold text-slate-900">
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
            aria-label="Close customer details"
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-5">
        {/* CUSTOMER INFORMATION */}
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

            <InfoItem
              label="Status"
              value={customer.status}
              icon={Users}
            />
          </div>
        </section>

        {/* SERVICE LOCATIONS */}
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
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
            {customer.serviceLocations.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
                No service locations available.
              </p>
            ) : (
              customer.serviceLocations.map((location) => (
                <div
                  key={location.id}
                  className="rounded-lg border border-slate-200 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <MapPin size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-xs font-semibold text-slate-800">
                        {location.name}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-500">
                        {location.address}, {location.city}
                      </p>

                      <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-1 text-[9px] font-semibold text-slate-600">
                        {location.type}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* UPCOMING MAINTENANCE */}
        <section className="mt-6">
          <h3 className="text-sm font-bold text-slate-900">
            Upcoming Maintenance
          </h3>

          <div className="mt-3 space-y-2">
            {customer.upcomingMaintenance.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-4 text-center text-xs text-slate-500">
                No upcoming maintenance scheduled.
              </div>
            ) : (
              customer.upcomingMaintenance.map((maintenance, index) => (
                <div
                  key={`${maintenance.service}-${maintenance.date}-${index}`}
                  className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                      <Calendar size={15} />
                    </div>

                    <div className="min-w-0">
                      <p className="break-words text-xs font-semibold text-slate-800">
                        {maintenance.service}
                      </p>

                      <p className="mt-1 text-[10px] text-slate-500">
                        {maintenance.location}
                      </p>
                    </div>
                  </div>

                  <p className="pl-11 text-[10px] font-semibold text-slate-600 sm:pl-0">
                    {maintenance.date}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* SERVICE HISTORY */}
        <section className="mt-6">
          <h3 className="text-sm font-bold text-slate-900">
            Previous Work / Service History
          </h3>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <TableHeader>Service</TableHeader>
                  <TableHeader>Location</TableHeader>
                  <TableHeader>Technician</TableHeader>
                  <TableHeader>Date</TableHeader>
                  <TableHeader>Status</TableHeader>
                </tr>
              </thead>

              <tbody>
                {customer.serviceHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-6 text-center text-xs text-slate-500"
                    >
                      No service history available.
                    </td>
                  </tr>
                ) : (
                  customer.serviceHistory.map((history) => (
                    <tr
                      key={history.id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-5 py-3 text-xs font-medium text-slate-800">
                        {history.service}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {history.location}
                      </td>

                      <td className="px-5 py-3 text-xs text-slate-500">
                        {history.technician}
                      </td>

                      <td className="whitespace-nowrap px-5 py-3 text-xs text-slate-500">
                        {history.date}
                      </td>

                      <td className="px-5 py-3">
                        <span
                          className={`whitespace-nowrap rounded-full px-2 py-1 text-[9px] font-bold ${
                            history.status === "Completed"
                              ? "bg-emerald-50 text-emerald-700"
                              : history.status === "Pending"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {history.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Modal>
  );
}

/* =====================================================
   EDIT CUSTOMER FORM MODAL
===================================================== */

interface CustomerFormModalProps {
  customer: Customer;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

function CustomerFormModal({
  customer,
  onClose,
  onSave,
}: CustomerFormModalProps) {
  const [name, setName] = useState(customer.name);
  const [company, setCompany] = useState(customer.company);
  const [email, setEmail] = useState(customer.email);
  const [phone, setPhone] = useState(customer.phone);
  const [city, setCity] = useState(customer.city);
  const [status, setStatus] = useState<Customer["status"]>(
    customer.status
  );

  const [error, setError] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !company.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !city.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const updatedCustomer: Customer = {
      ...customer,
      name: name.trim(),
      company: company.trim(),
      email: email.trim(),
      phone: phone.trim(),
      city: city.trim(),
      status,
    };

    onSave(updatedCustomer);
  };

  return (
    <Modal onClose={onClose}>
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 p-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
            Customer Management
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-900">
            Edit Customer
          </h2>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close edit customer form"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={18} />
        </button>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-4 p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            label="Contact Person"
            value={name}
            onChange={setName}
            placeholder="Enter customer name"
            required
          />

          <InputField
            label="Company Name"
            value={company}
            onChange={setCompany}
            placeholder="Enter company name"
            required
          />

          <InputField
            label="Email"
            value={email}
            onChange={setEmail}
            type="email"
            placeholder="customer@example.com"
            required
          />

          <InputField
            label="Phone"
            value={phone}
            onChange={setPhone}
            placeholder="+91 XXXXX XXXXX"
            required
          />

          <InputField
            label="City"
            value={city}
            onChange={setCity}
            placeholder="Enter city"
            required
          />

          <div>
            <label
              htmlFor="customer-status"
              className="mb-1.5 block text-xs font-semibold text-slate-700"
            >
              Status
            </label>

            <select
              id="customer-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value as Customer["status"])
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        {/* FORM ACTIONS */}
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
            className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            Update Customer
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* =====================================================
   INPUT FIELD
===================================================== */

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: InputFieldProps) {
  const inputId = `customer-${label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")}`;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="mb-1.5 block text-xs font-semibold text-slate-700"
      >
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      <input
        id={inputId}
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

/* =====================================================
   INFO ITEM
===================================================== */

interface InfoItemProps {
  label: string;
  value: string;
  icon: ElementType;
}

function InfoItem({ label, value, icon: Icon }: InfoItemProps) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-slate-400" />

        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>

      <p className="mt-1 break-words text-xs font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

/* =====================================================
   REUSABLE MODAL
===================================================== */

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 h-full w-full cursor-default"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        {children}
      </div>
    </div>
  );
}
