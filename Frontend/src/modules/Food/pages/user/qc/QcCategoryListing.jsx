import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocationSelector } from "@food/components/user/UserLayout";
import useQcStore from "@food/hooks/useQcStore";
import useQcCart from "@food/hooks/useQcCart";
import QcProductCard, { QcProductCardSkeleton } from "@food/components/qc/QcProductCard";
import QcProductSheet from "@food/components/qc/QcProductSheet";
import { QcCartBar, QcPageHeader, QcStoreStatus } from "@food/components/qc/QcChrome";

const SORTS = [
  { id: "relevance", label: "Relevance" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "discount", label: "Discount" },
];

const discountOf = (p) => (p.mrp && p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0);

/**
 * One category of the nearest store, in the split view quick-commerce apps
 * use: categories down the left, that category's products on the right.
 */
export default function QcCategoryListing() {
  const { category } = useParams();
  const navigate = useNavigate();
  const { openLocationSelector } = useLocationSelector();
  const { status, store, sections } = useQcStore();
  const cart = useQcCart(store);
  const [sort, setSort] = useState("relevance");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [open, setOpen] = useState(null);
  const gridRef = useRef(null);

  const loading = status === "loading" || status === "locating";
  const activeId = decodeURIComponent(category || "");
  const active = sections.find((s) => s.id === activeId) || sections[0] || null;

  // A link to a category that no longer exists falls back to the first one.
  useEffect(() => {
    if (status === "ready" && sections.length && active && active.id !== activeId) {
      navigate(`/food/user/category/${encodeURIComponent(active.id)}`, { replace: true });
    }
  }, [status, sections.length, active, activeId, navigate]);

  useEffect(() => {
    gridRef.current?.scrollTo?.({ top: 0 });
  }, [active?.id]);

  const products = useMemo(() => {
    let list = active ? [...active.products] : [];
    if (inStockOnly) list = list.filter((p) => p.available);
    if (sort === "price_asc") list.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") list.sort((a, b) => b.price - a.price);
    if (sort === "discount") list.sort((a, b) => discountOf(b) - discountOf(a));
    // Sold-out items sink to the bottom whatever the sort.
    return list.sort((a, b) => Number(b.available) - Number(a.available));
  }, [active, sort, inStockOnly]);

  const card = (p) => (
    <QcProductCard
      key={p.id}
      product={p}
      qty={cart.qtyOf(p)}
      onAdd={() => cart.add(p)}
      onInc={() => cart.inc(p)}
      onDec={() => cart.dec(p)}
      onOpen={() => setOpen(p)}
    />
  );

  return (
    <div className="flex h-[100dvh] flex-col bg-qc-bg font-[Poppins]">
      <QcPageHeader
        title={active?.name || "Category"}
        subtitle={active ? `${active.products.length} item${active.products.length === 1 ? "" : "s"}` : undefined}
      />

      {!loading && status !== "ready" && (
        <QcStoreStatus status={status} onChangeLocation={openLocationSelector} />
      )}
      {status === "ready" && sections.length === 0 && <QcStoreStatus status="empty" />}

      {(loading || (status === "ready" && sections.length > 0)) && (
        <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
          {/* Category rail */}
          <nav aria-label="Categories" className="scrollbar-hide w-[76px] shrink-0 overflow-y-auto border-r border-qc-line bg-white pb-28 md:w-28">
            {loading
              ? Array.from({ length: 7 }, (_, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 px-2 py-3">
                    <div className="h-12 w-12 animate-pulse rounded-xl bg-qc-bg" />
                    <div className="h-2 w-10 animate-pulse rounded bg-qc-bg" />
                  </div>
                ))
              : sections.map((s) => {
                  const on = s.id === active?.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/food/user/category/${encodeURIComponent(s.id)}`, { replace: true })}
                      aria-current={on ? "page" : undefined}
                      className={`relative flex w-full flex-col items-center gap-1 px-1.5 py-2.5 text-center ${on ? "bg-qc-brand-soft" : ""}`}
                    >
                      {on && <span className="absolute right-0 top-2 bottom-2 w-1 rounded-l bg-qc-brand" />}
                      <span className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl ${on ? "bg-white" : "bg-qc-bg"}`}>
                        {s.image ? (
                          <img src={s.image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                        ) : (
                          <span className="text-lg font-black text-qc-brand">{s.name?.[0]}</span>
                        )}
                      </span>
                      <span className={`line-clamp-2 text-[10.5px] leading-tight ${on ? "font-bold text-qc-brand-dark" : "font-medium text-qc-ink"}`}>
                        {s.name}
                      </span>
                    </button>
                  );
                })}
          </nav>

          {/* Products */}
          <div ref={gridRef} className="min-w-0 flex-1 overflow-y-auto pb-28">
            <div className="scrollbar-hide sticky top-0 z-10 flex gap-2 overflow-x-auto bg-qc-bg px-2.5 py-2.5">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="Sort"
                className="h-8 shrink-0 rounded-lg border border-qc-line bg-white px-2 text-xs font-semibold text-qc-ink"
              >
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <button
                type="button"
                onClick={() => setInStockOnly((v) => !v)}
                aria-pressed={inStockOnly}
                className={`h-8 shrink-0 rounded-lg border px-3 text-xs font-semibold ${inStockOnly ? "border-qc-brand bg-qc-brand-soft text-qc-brand-dark" : "border-qc-line bg-white text-qc-ink"}`}
              >
                In stock
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 px-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {loading
                ? Array.from({ length: 6 }, (_, i) => <QcProductCardSkeleton key={i} />)
                : products.map(card)}
            </div>

            {!loading && products.length === 0 && (
              <p className="px-6 py-16 text-center text-sm text-qc-muted">
                {inStockOnly ? "Nothing in stock here right now." : "No products in this category yet."}
              </p>
            )}
          </div>
        </div>
      )}

      <QcCartBar count={cart.itemCount} total={cart.total} onOpen={() => navigate("/food/user/cart")} raised={false} />
      <QcProductSheet
        product={open}
        similar={active?.products || []}
        cart={cart}
        onClose={() => setOpen(null)}
        onOpen={setOpen}
      />
    </div>
  );
}
