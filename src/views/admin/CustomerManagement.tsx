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


import { useMemo, useState } from "react";

interface ServiceLocation {
  id: number;
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
  id: number;
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

const initialCustomers: Customer[] = [
  {
    id: 1,
    customerCode: "CUS-1001",
    name: "Rajesh Kumar",
    company: "ABC Industries",
    email: "rajesh@abcindustries.com",
    phone: "+91 98765 43210",
    city: "Chennai",
    status: "Active",

    serviceLocations: [
      {
        id: 1,
        name: "ABC Industries - Main Plant",
        address: "Industrial Estate, Ambattur",
        city: "Chennai",
        type: "Water Treatment Plant",
      },
      {
        id: 2,
        name: "ABC Industries - Warehouse",
        address: "Guindy Industrial Area",
        city: "Chennai",
        type: "RO System",
      },
    ],

    upcomingMaintenance: [
      {
        service: "RO System Maintenance",
        location: "Main Plant",
        date: "Oct 18, 2026",
      },
      {
        service: "Filter Replacement",
        location: "Warehouse",
        date: "Nov 02, 2026",
      },
    ],

    serviceHistory: [
      {
        id: 1,
        service: "RO Maintenance",
        location: "Main Plant",
        technician: "John",
        date: "Oct 05, 2026",
        status: "Completed",
      },
      {
        id: 2,
        service: "Filter Replacement",
        location: "Warehouse",
        technician: "David",
        date: "Sep 18, 2026",
        status: "Completed",
      },
      {
        id: 3,
        service: "System Inspection",
        location: "Main Plant",
        technician: "Sarah",
        date: "Aug 22, 2026",
        status: "Completed",
      },
    ],
  },

  {
    id: 2,
    customerCode: "CUS-1002",
    name: "Anil Thomas",
    company: "GreenTech Pvt Ltd",
    email: "anil@greentech.com",
    phone: "+91 98470 12345",
    city: "Coimbatore",
    status: "Active",

    serviceLocations: [
      {
        id: 3,
        name: "GreenTech Factory",
        address: "SIDCO Industrial Estate",
        city: "Coimbatore",
        type: "Water Treatment Plant",
      },
    ],

    upcomingMaintenance: [
      {
        service: "AMC Service",
        location: "GreenTech Factory",
        date: "Oct 21, 2026",
      },
    ],

    serviceHistory: [
      {
        id: 4,
        service: "AMC Service",
        location: "GreenTech Factory",
        technician: "Mike",
        date: "Sep 20, 2026",
        status: "Completed",
      },
      {
        id: 5,
        service: "System Checkup",
        location: "GreenTech Factory",
        technician: "John",
        date: "Jul 14, 2026",
        status: "Completed",
      },
    ],
  },

  {
    id: 3,
    customerCode: "CUS-1003",
    name: "Priya Menon",
    company: "Sunrise Apartments",
    email: "priya@sunrise.com",
    phone: "+91 98471 56789",
    city: "Madurai",
    status: "Active",

    serviceLocations: [
      {
        id: 4,
        name: "Sunrise Apartments",
        address: "KK Nagar",
        city: "Madurai",
        type: "RO Plant",
      },
    ],

    upcomingMaintenance: [
      {
        service: "Filter Replacement",
        location: "Sunrise Apartments",
        date: "Oct 25, 2026",
      },
    ],

    serviceHistory: [
      {
        id: 6,
        service: "Filter Replacement",
        location: "Sunrise Apartments",
        technician: "David",
        date: "Sep 10, 2026",
        status: "Completed",
      },
    ],
  },

  {
    id: 4,
    customerCode: "CUS-1004",
    name: "Arun Joseph",
    company: "Global Foods",
    email: "arun@globalfoods.com",
    phone: "+91 98950 34567",
    city: "Thrissur",
    status: "Active",

    serviceLocations: [
      {
        id: 5,
        name: "Global Foods Factory",
        address: "Kuriachira Industrial Area",
        city: "Thrissur",
        type: "Water Treatment Plant",
      },
    ],

    upcomingMaintenance: [
      {
        service: "System Checkup",
        location: "Global Foods Factory",
        date: "Oct 28, 2026",
      },
    ],

    serviceHistory: [
      {
        id: 7,
        service: "System Checkup",
        location: "Global Foods Factory",
        technician: "Sarah",
        date: "Sep 25, 2026",
        status: "Completed",
      },
    ],
  },

  {
    id: 5,
    customerCode: "CUS-1005",
    name: "Dr. Suresh Nair",
    company: "Sri Hospitals",
    email: "admin@srihospitals.com",
    phone: "+91 99950 77889",
    city: "Kochi",
    status: "Inactive",

    serviceLocations: [
      {
        id: 6,
        name: "Sri Hospitals - Main",
        address: "MG Road",
        city: "Kochi",
        type: "RO System",
      },
    ],

    upcomingMaintenance: [],

    serviceHistory: [
      {
        id: 8,
        service: "AMC Visit",
        location: "Sri Hospitals - Main",
        technician: "John",
        date: "Aug 12, 2026",
        status: "Completed",
      },
    ],
  },
];

export default function CustomerManagement() {
  const [customers, setCustomers] =
    useState<Customer[]>(initialCustomers);

  const [search, setSearch] = useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<Customer | null>(null);

  const [showDetails, setShowDetails] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [editingCustomer, setEditingCustomer] =
    useState<Customer | null>(null);

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

  const handleAddCustomer = (
    customer: Customer
  ) => {
    setCustomers((current) => [
      ...current,
      {
        ...customer,
        id: Date.now(),
      },
    ]);

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
            Customers
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        {/* Table Header */}
        <div className="border-b border-slate-200 p-5">

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
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search customers..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white focus:ring-2 focus:ring-emerald-100"
              />

            </div>

          </div>

        </div>

        {/* Table */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50 text-left">

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Customer
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Contact
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Location
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Service Locations
                </th>

                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {filteredCustomers.length === 0 ? (

                <tr>

                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center"
                  >
                    <Users
                      size={30}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-700">
                      No customers found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try a different search term.
                    </p>
                  </td>

                </tr>

              ) : (

                filteredCustomers.map(
                  (customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50"
                    >

                      {/* Customer */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-sm font-bold text-emerald-800">
                            {customer.name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {customer.company}
                            </p>

                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {customer.customerCode} ·{" "}
                              {customer.name}
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

                      {/* City */}
                      <td className="px-5 py-4">

                        <div className="flex items-center gap-1.5 text-xs text-slate-600">

                          <MapPin
                            size={13}
                            className="text-slate-400"
                          />

                          {customer.city}

                        </div>

                      </td>

                      {/* Locations */}
                      <td className="px-5 py-4">

                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
                          {
                            customer
                              .serviceLocations
                              .length
                          }{" "}
                          Locations
                        </span>

                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">

                        <span
                          className={`
                            rounded-full
                            px-2.5
                            py-1
                            text-[10px]
                            font-bold
                            ${
                              customer.status ===
                              "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-500"
                            }
                          `}
                        >
                          {customer.status}
                        </span>

                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">

                        <div className="flex items-center justify-end gap-1">

                          <button
                            type="button"
                            onClick={() =>
                              openDetails(customer)
                            }
                            title="View customer"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-700"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEditCustomer(
                                customer
                              )
                            }
                            title="Edit customer"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                          >
                            <Edit3 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )

              )}

            </tbody>

          </table>

        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-5 py-3">

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
          onClose={() => {
            setShowForm(false);
            setEditingCustomer(null);
          }}
          onSave={
            editingCustomer
              ? handleUpdateCustomer
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
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

function CustomerFormModal({
  customer,
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

  const handleSubmit = (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    if (
      !name.trim() ||
      !company.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !city.trim()
    ) {
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

    onSave(newCustomer);
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

          <InputField
            label="Company Name"
            value={company}
            onChange={setCompany}
            placeholder="Enter company name"
          />

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

          <InputField
            label="City"
            value={city}
            onChange={setCity}
            placeholder="Enter city"
          />

          <div>

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

          </div>

        </div>

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
            className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            {customer
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
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">

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