/** Fields used by the frontend UI */
export interface Service {
  id: number | string;
  name: string;
  category: string;
  categoryId: string;
  description: string;
  duration: string;
  price: number;
  image?: string | null;
  requiresMaintenance: boolean;
  defaultMaintenanceFrequency: string | null;
  status: "Active" | "Inactive";
}

/** Exact fields sent to the backend when creating a service */
export interface CreateServicePayload {
  name: string;
  categoryId: string;
  description: string;
  estimatedDuration: number;
  basePrice: number;
  image?: string | null;
  requiresMaintenance: boolean;
  defaultMaintenanceFrequency: string | null;
  isActive: boolean;
}

/** Backend response structure */
export interface ApiService {
  id: number | string;
  name: string;
  categoryId?: number | string | null;
  description: string;
  estimatedDuration: number | string | { minutes?: number | string; value?: number | string };
  basePrice: number | string;
  image?: string | null;
  requiresMaintenance: boolean;
  defaultMaintenanceFrequency: string | null;
  isActive: boolean;
  category?: string | {
    id?: number | string;
    name: string;
  } | null;
}
