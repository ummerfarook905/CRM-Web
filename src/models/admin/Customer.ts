export interface ServiceLocation {
  id: number;
  name: string;
  address: string;
  city: string;
  type: string;
}

export interface ServiceHistory {
  id: number;
  service: string;
  location: string;
  technician: string;
  date: string;
  status: "Completed" | "Pending" | "In Progress";
}

export interface Customer {
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

export const initialCustomers: Customer[] = [
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