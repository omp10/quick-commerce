import { useEffect } from "react";
import { Clock, X } from "lucide-react";
import QcStepper from "./QcStepper";
import QcProductCard from "./QcProductCard";

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/**
 * Product detail as a bottom sheet (a centred dialog on desktop): image,
 * price block, description, ADD stepper, and similar products from the same
 * category. `cart` is the object from useQcCart().
 */
export default function QcProductSheet({ product, similar = [], cart, onClose, onOpen }) {
  useEffect(() => {
    if (!product) return undefined;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [product, onClose]);

  if (!product) return null;
  const { name, image, price, mrp, unit, available = true, eta } = product;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const description = String(product.raw?.description || "").trim();
  const others = similar.filter((p) => p.id !== product.id).slice(0, 10);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label={name}>
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/45" />

      <div className="relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-qc-bg md:max-w-lg md:rounded-3xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-qc-ink shadow"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="overflow-y-auto pb-24">
          <div className="flex aspect-[4/3] items-center justify-center bg-white p-6">
            {image ? (
              <img src={image} alt={name} className={`h-full w-full object-contain ${available ? "" : "opacity-40 grayscale"}`} />
            ) : (
              <div className="h-full w-full rounded-2xl bg-qc-bg" />
            )}
          </div>

          <div className="bg-white px-4 pb-4 pt-3">
            {eta && (
              <span className="inline-flex items-center gap-1 rounded bg-qc-bg px-1.5 py-0.5 text-[10px] font-bold uppercase text-qc-ink">
                <Clock className="h-3 w-3" strokeWidth={3} /> {eta}
              </span>
            )}
            <h2 className="mt-1.5 text-lg font-extrabold leading-snug text-qc-ink">{name}</h2>
            {unit && <p className="mt-0.5 text-sm text-qc-muted">{unit}</p>}
            <div className="mt-2 flex items-center gap-2">
              <span className="text-lg font-extrabold text-qc-ink">{rupees(price)}</span>
              {off > 0 && (
                <>
                  <span className="text-sm text-qc-muted line-through">MRP {rupees(mrp)}</span>
                  <span className="rounded bg-qc-brand px-1.5 py-0.5 text-[11px] font-bold text-white">{off}% OFF</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-[11px] text-qc-muted">(Inclusive of all taxes)</p>
          </div>

          {description && (
            <div className="mt-2 bg-white px-4 py-3">
              <h3 className="text-sm font-extrabold text-qc-ink">Product details</h3>
              <p className="mt-1 whitespace-pre-line text-[13px] leading-relaxed text-qc-muted">{description}</p>
            </div>
          )}

          {others.length > 0 && (
            <div className="mt-2 bg-white py-3">
              <h3 className="mb-2 px-4 text-sm font-extrabold text-qc-ink">Similar products</h3>
              <div className="scrollbar-hide flex gap-2.5 overflow-x-auto px-4">
                {others.map((p) => (
                  <div key={p.id} className="w-[38%] shrink-0 md:w-36">
                    <QcProductCard
                      product={p}
                      qty={cart.qtyOf(p)}
                      onAdd={() => cart.add(p)}
                      onInc={() => cart.inc(p)}
                      onDec={() => cart.dec(p)}
                      onOpen={() => onOpen?.(p)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 border-t border-qc-line bg-white px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))]">
          <div className="leading-tight">
            <p className="text-[11px] text-qc-muted">{unit || "1 unit"}</p>
            <p className="text-base font-extrabold text-qc-ink">{rupees(price)}</p>
          </div>
          <QcStepper
            size="lg"
            label="Add to cart"
            qty={cart.qtyOf(product)}
            onAdd={() => cart.add(product)}
            onInc={() => cart.inc(product)}
            onDec={() => cart.dec(product)}
            disabled={!available}
          />
        </div>
      </div>
    </div>
  );
}
