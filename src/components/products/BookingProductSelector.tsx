import { useEffect, useMemo, useState } from "react";
import { listProducts, type Product } from "../../services/Products";

export interface SelectedBookingProduct {
  productId: string;
  quantity: number;
}

export default function BookingProductSelector({
  value,
  onChange,
}: {
  value: SelectedBookingProduct[];
  onChange: (selection: SelectedBookingProduct[]) => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const selectedIds = new Set(value.map((item) => item.productId));
  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) =>
      product.isActive !== false
      && (!query || `${product.name} ${product.description}`.toLowerCase().includes(query)),
    );
  }, [products, search]);
  const activeProductCount = products.filter((product) => product.isActive !== false).length;

  useEffect(() => {
    let active = true;
    void listProducts()
      .then((items) => {
        if (active) setProducts(items);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Unable to load products.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const selectProduct = (productId: string) => {
    if (selectedIds.has(productId)) {
      onChange(value.filter((item) => item.productId !== productId));
    } else {
      onChange([...value, { productId, quantity: 1 }]);
    }
  };

  const changeQuantity = (productId: string, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    onChange(value.map((item) => item.productId === productId ? { ...item, quantity } : item));
  };

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 p-4" aria-label="Optional products">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Products <span className="font-normal text-slate-400">(optional)</span></h3>
          <p className="mt-1 text-xs text-slate-500">Choose products and quantities to include with this booking.</p>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search available products"
          placeholder="Search products..."
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-600 sm:max-w-56"
        />
      </div>

      {loading && <p className="text-sm text-slate-500">Loading available products…</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!loading && !error && activeProductCount === 0 && (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">No available products. You can continue without products.</p>
      )}
      {!loading && !error && activeProductCount > 0 && filteredProducts.length === 0 && (
        <p className="text-sm text-slate-500">No products match your search.</p>
      )}

      {filteredProducts.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {filteredProducts.map((product) => {
            const selected = value.find((item) => item.productId === product.id);
            return (
              <div key={product.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-100 p-3">
                {product.photos[0] && <img src={product.photos[0]} alt="" className="h-12 w-12 rounded-md object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{product.name}</p>
                  {product.description && <p className="line-clamp-1 text-xs text-slate-500">{product.description}</p>}
                  <p className="mt-1 text-xs font-medium text-slate-700">{product.price.toLocaleString(undefined, { style: "currency", currency: "INR" })}</p>
                </div>
                {selected ? (
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 text-xs text-slate-600">
                      Qty
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={selected.quantity}
                        onChange={(event) => changeQuantity(product.id, Number(event.target.value))}
                        aria-label={`Quantity of ${product.name}`}
                        className="w-16 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
                      />
                    </label>
                    <button type="button" onClick={() => selectProduct(product.id)} className="text-xs font-semibold text-red-700 hover:underline">Remove</button>
                  </div>
                ) : (
                  <button type="button" onClick={() => selectProduct(product.id)} className="rounded-lg border border-emerald-700 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50">Add</button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {value.length > 0 && (
        <p className="text-xs font-medium text-slate-600">
          {value.length} product{value.length === 1 ? "" : "s"} selected
        </p>
      )}
    </section>
  );
}
