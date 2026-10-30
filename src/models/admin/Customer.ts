export interface ServiceLocation {
  id: string | number;
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
  id: string;
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
