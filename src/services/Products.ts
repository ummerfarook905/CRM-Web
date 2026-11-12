import { api } from "../api/axios";

export const MAX_PRODUCT_PHOTO_COUNT = 2;
export const MAX_PRODUCT_PHOTO_SIZE = 5 * 1024 * 1024;
export const PRODUCT_PHOTO_ACCEPT = "image/*";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  photos: string[];
  isActive?: boolean;
  statusLabel?: string;
  availabilityField?: "isActive" | "isAvailable";
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  photos: File[];
  isActive?: boolean;
  availabilityField?: "isActive" | "isAvailable";
}

type RecordValue = Record<string, unknown>;

function asRecord(value: unknown): RecordValue | undefined {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as RecordValue
    : undefined;
}

function apiErrorMessage(error: unknown, fallback: string): string {
  const root = asRecord(error);
  const response = asRecord(root?.response);
  const data = asRecord(response?.data);
  const parts: string[] = [];

  const collect = (value: unknown) => {
    if (typeof value === "string" && value.trim()) {
      parts.push(value.trim());
    } else if (Array.isArray(value)) {
      value.forEach(collect);
    } else {
      const record = asRecord(value);
      if (record) {
        collect(record.message);
        collect(record.errors);
        collect(record.details);
        collect(record.validationErrors);
        collect(record.constraints);
      }
    }
  };

  collect(data?.message);
  collect(data?.error);
  collect(data?.errors);
  collect(data?.details);
  collect(data?.validationErrors);
  if (parts.length) return [...new Set(parts)].join("; ");
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function photoUrl(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  const record = asRecord(value);
  const url = record?.url ?? record?.photoUrl ?? record?.imageUrl ?? record?.path;
  return typeof url === "string" ? url : undefined;
}

function mapProduct(value: unknown): Product {
  const record = asRecord(value);
  if (!record || (typeof record.id !== "string" && typeof record.id !== "number")) {
    throw new Error("The products API returned a product without a valid ID.");
  }
  const photosValue = record.photos ?? record.images ?? record.photoUrls;
  const photos = (Array.isArray(photosValue) ? photosValue : photosValue ? [photosValue] : [])
    .map(photoUrl)
    .filter((url): url is string => Boolean(url));
  const availabilityField = typeof record.isActive === "boolean"
    ? "isActive"
    : typeof record.isAvailable === "boolean"
      ? "isAvailable"
      : undefined;
  const rawStatus = typeof record.status === "string" ? record.status : "";
  const normalizedStatus = rawStatus.trim().toLowerCase().replace(/[_-]+/g, " ");
  const statusValue = availabilityField
    ? Boolean(record[availabilityField])
    : ["active", "available", "in stock", "published"].includes(normalizedStatus)
      ? true
      : ["inactive", "unavailable", "out of stock", "disabled", "archived"].includes(normalizedStatus)
        ? false
        : undefined;
  const price = record.price === null || record.price === undefined || record.price === ""
    ? Number.NaN
    : Number(record.price);
  if (typeof record.name !== "string" || !record.name.trim()) {
    throw new Error("The products API returned a product without a name.");
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new Error(`The products API returned an invalid price for "${record.name}".`);
  }

  return {
    id: String(record.id),
    name: record.name,
    description: typeof record.description === "string" ? record.description : "",
    price: Number.isFinite(price) ? price : 0,
    photos,
    ...(statusValue !== undefined ? { isActive: statusValue } : {}),
    ...(availabilityField ? { availabilityField } : {}),
    ...(rawStatus ? { statusLabel: rawStatus } : statusValue !== undefined
      ? { statusLabel: statusValue ? "Available" : "Unavailable" }
      : {}),
  };
}

function rowsFromResponse(response: unknown): unknown[] {
  const root = asRecord(response);
  if (!root) {
    if (Array.isArray(response)) return response;
    throw new Error("The products API returned an unexpected response.");
  }
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.products)) return root.products;

  const data = asRecord(root.data);
  if (data) {
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.products)) return data.products;
  }
  throw new Error("The products API did not return a product list.");
}

function totalPagesFromResponse(response: unknown): number {
  const root = asRecord(response);
  const data = asRecord(root?.data);
  const pagination = asRecord(root?.pagination)
    ?? asRecord(root?.meta)
    ?? asRecord(data?.pagination)
    ?? asRecord(data?.meta);
  const pages = Number(pagination?.totalPages ?? pagination?.pages ?? 1);
  return Number.isFinite(pages) && pages > 0 ? Math.min(Math.ceil(pages), 100) : 1;
}

function productFormData(payload: ProductPayload, includeEmptyDescription = false): FormData {
  const formData = new FormData();
  formData.append("name", payload.name.trim());
  if (payload.description.trim() || includeEmptyDescription) {
    formData.append("description", payload.description.trim());
  }
  formData.append("price", String(payload.price));
  if (payload.isActive !== undefined && payload.availabilityField) {
    formData.append(payload.availabilityField, String(payload.isActive));
  }
  payload.photos.forEach((photo) => formData.append("photos", photo));
  return formData;
}

export async function listProducts(): Promise<Product[]> {
  try {
    const first = await api.get("/products", { params: { page: 1, limit: 100 } });
    const rows = [...rowsFromResponse(first.data)];
    const totalPages = totalPagesFromResponse(first.data);
    for (let page = 2; page <= totalPages; page += 1) {
      const response = await api.get("/products", { params: { page, limit: 100 } });
      rows.push(...rowsFromResponse(response.data));
    }
    return rows.map(mapProduct);
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, "Unable to load products."));
  }
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  try {
    const response = await api.post("/products", productFormData(payload), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = asRecord(response.data);
    const data = asRecord(body?.data) ?? body;
    return mapProduct(data?.product ?? data);
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, "Unable to create product."));
  }
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  try {
    const response = await api.patch(`/products/${encodeURIComponent(id)}`, productFormData(payload, true), {
      headers: { "Content-Type": "multipart/form-data" },
    });
    const body = asRecord(response.data);
    const data = asRecord(body?.data) ?? body;
    const product = asRecord(data?.product) ?? data;
    return mapProduct({ ...product, ...Object.fromEntries(
      Object.entries({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        ...(payload.isActive !== undefined && payload.availabilityField
          ? { [payload.availabilityField]: payload.isActive }
          : {}),
      }).filter(([, value]) => value !== undefined),
    ), id: product?.id ?? id });
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, "Unable to update product."));
  }
}

export async function deleteProduct(id: string): Promise<void> {
  try {
    await api.delete(`/products/${encodeURIComponent(id)}`);
  } catch (error: unknown) {
    throw new Error(apiErrorMessage(error, "Unable to delete product."));
  }
}
