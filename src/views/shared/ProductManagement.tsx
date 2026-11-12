import { useEffect, useMemo, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  listProducts,
  MAX_PRODUCT_PHOTO_COUNT,
  MAX_PRODUCT_PHOTO_SIZE,
  PRODUCT_PHOTO_ACCEPT,
  updateProduct,
  type Product,
  type ProductPayload,
} from "../../services/Products";

function photoError(photos: File[]): string | null {
  if (photos.length > MAX_PRODUCT_PHOTO_COUNT) {
    return `Choose no more than ${MAX_PRODUCT_PHOTO_COUNT} photos.`;
  }
  if (photos.some((photo) => !photo.type.startsWith("image/"))) {
    return "Choose image files for product photos.";
  }
  if (photos.some((photo) => photo.size > MAX_PRODUCT_PHOTO_SIZE)) {
    return "Each photo must be no larger than 5 MB.";
  }
  return null;
}

function statusLabel(product: Product): string {
  return product.statusLabel ?? (
    product.isActive === undefined
      ? "Status not provided"
      : product.isActive
        ? "Available"
        : "Unavailable"
  );
}

export default function ProductManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    void listProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((cause: unknown) => {
        if (active) setLoadError(cause instanceof Error ? cause.message : "Unable to load products.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const loadProducts = async () => {
    try {
      setProducts(await listProducts());
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "Unable to load products.");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.description, statusLabel(product)]
        .some((value) => value.toLowerCase().includes(query)),
    );
  }, [products, search]);

  const openAdd = () => {
    setEditing(null);
    setActionError("");
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setActionError("");
    setShowForm(true);
  };

  const saveProduct = async (payload: ProductPayload) => {
    const saved = editing
      ? await updateProduct(editing.id, payload)
      : await createProduct(payload);
    setProducts((current) => editing
      ? current.map((product) => product.id === editing.id
        ? { ...product, ...saved, photos: saved.photos.length || payload.photos.length ? saved.photos : product.photos }
        : product)
      : [saved, ...current]);
    setShowForm(false);
    setEditing(null);
    setNotice(editing ? "Product updated." : "Product created.");
  };

  const removeProduct = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    setDeletingId(product.id);
    setActionError("");
    setNotice("");
    try {
      await deleteProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice("Product deleted.");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Catalog</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Products</h1>
          <p className="mt-1 text-sm text-slate-500">Manage products available to your company’s customers.</p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
        >
          <Plus size={17} /> Add Product
        </button>
      </header>

      {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {actionError && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</p>}
      {loadError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setLoadError("");
              void loadProducts();
            }}
            className="mt-2 font-semibold underline"
          >
            Try again
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Product catalogue</h2>
            <p className="mt-1 text-xs text-slate-500">{products.length} product{products.length === 1 ? "" : "s"}</p>
          </div>
          <label className="relative block w-full sm:max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products..."
              aria-label="Search products"
              className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-600"
            />
          </label>
        </div>

        {loading ? (
          <p className="p-10 text-center text-sm text-slate-500">Loading products…</p>
        ) : !loadError && filteredProducts.length === 0 ? (
          <p className="p-10 text-center text-sm text-slate-500">
            {products.length ? "No products match your search." : "No products yet. Add a product to get started."}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredProducts.map((product) => (
              <article key={product.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                  {product.photos.length
                    ? <div className="grid h-full w-full grid-cols-2 gap-0.5">
                      {product.photos.slice(0, MAX_PRODUCT_PHOTO_COUNT).map((photo, index) => (
                        <img key={`${photo}-${index}`} src={photo} alt={`${product.name} photo ${index + 1}`} className="h-full w-full object-cover" />
                      ))}
                    </div>
                    : <span className="px-2 text-center text-xs text-slate-400">No photo</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{product.name}</h3>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      product.isActive === true
                        ? "bg-emerald-50 text-emerald-700"
                        : product.isActive === false
                          ? "bg-slate-100 text-slate-600"
                          : "bg-amber-50 text-amber-700"
                    }`}>{statusLabel(product)}</span>
                  </div>
                  {product.description && <p className="mt-1 line-clamp-2 text-sm text-slate-500">{product.description}</p>}
                  <p className="mt-2 text-sm font-semibold text-slate-800">{product.price.toLocaleString(undefined, { style: "currency", currency: "INR" })}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEdit(product)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Pencil size={15} /> Edit
                  </button>
                  <button type="button" onClick={() => void removeProduct(product)} disabled={deletingId === product.id} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    <Trash2 size={15} /> {deletingId === product.id ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <ProductFormModal
          key={editing?.id ?? "new-product"}
          product={editing}
          onClose={() => setShowForm(false)}
          onSave={saveProduct}
        />
      )}
    </div>
  );
}

function ProductFormModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (payload: ProductPayload) => Promise<void>;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const canManageAvailability = Boolean(product?.availabilityField);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    const parsedPrice = Number(price);
    const fileError = photoError(photos);
    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!price.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid non-negative price.");
      return;
    }
    if (fileError) {
      setError(fileError);
      return;
    }

    setSaving(true);
    try {
      await onSave({
        name,
        description,
        price: parsedPrice,
        photos,
        ...(canManageAvailability && product?.availabilityField
          ? { isActive, availabilityField: product.availabilityField }
          : {}),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-slate-950/45 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="product-form-title" className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Product catalogue</p>
            <h2 id="product-form-title" className="mt-1 text-lg font-bold text-slate-900">{product ? "Edit Product" : "Add Product"}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={saving} aria-label="Close product form" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
        </header>
        <form onSubmit={(event) => void submit(event)} className="space-y-4 p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Product name <span className="text-red-500">*</span>
              <input value={name} onChange={(event) => setName(event.target.value)} required maxLength={160} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-semibold text-slate-700">
              Price <span className="text-red-500">*</span>
              <input type="number" min="0" step="0.01" value={price} onChange={(event) => setPrice(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Description <span className="font-normal text-slate-400">(optional)</span>
              <textarea rows={3} value={description} onChange={(event) => setDescription(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 font-normal outline-none focus:border-emerald-600" />
            </label>
            <label className="block text-sm font-semibold text-slate-700 sm:col-span-2">
              Product photos <span className="font-normal text-slate-400">(up to 2 images; 5 MB each)</span>
              <input
                type="file"
                accept={PRODUCT_PHOTO_ACCEPT}
                multiple
                onChange={(event) => {
                  const selected = Array.from(event.target.files ?? []);
                  const validationError = photoError(selected);
                  if (validationError) {
                    setError(validationError);
                    event.target.value = "";
                    return;
                  }
                  setError("");
                  setPhotos(selected);
                }}
                className="mt-1.5 block w-full rounded-lg border border-slate-200 p-2 text-sm font-normal file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:font-semibold file:text-emerald-800"
              />
              {product?.photos.length ? (
                <span className="mt-2 flex gap-2">
                  {product.photos.slice(0, MAX_PRODUCT_PHOTO_COUNT).map((photo, index) => (
                    <img key={`${photo}-${index}`} src={photo} alt={`Current product photo ${index + 1}`} className="h-14 w-14 rounded-md object-cover" />
                  ))}
                  <span className="self-center text-xs font-normal text-slate-500">
                    Current photos are retained unless replacement photos are selected.
                  </span>
                </span>
              ) : null}
              {photos.length > 0 && (
                <span className="mt-1 flex items-center justify-between gap-2 text-xs font-normal text-slate-600">
                  <span>Replacement photos: {photos.map((photo) => photo.name).join(", ")}</span>
                  <button type="button" onClick={() => setPhotos([])} className="shrink-0 font-semibold text-emerald-800 hover:underline">Keep current</button>
                </span>
              )}
            </label>
            {canManageAvailability && (
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:col-span-2">
                <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} className="h-4 w-4 accent-emerald-700" />
                Available for selection
              </label>
            )}
          </div>
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <footer className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50">{saving ? "Saving…" : product ? "Save Changes" : "Create Product"}</button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
