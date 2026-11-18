import { Clock } from "lucide-react";
import QcStepper from "./QcStepper";

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/**
 * Compact grocery product card: image, ETA chip, unit, name, price/MRP, ADD stepper.
 * `product` is a normalised item: { id, name, image, price, mrp, unit, available, eta }.
 */
export default function QcProductCard({ product, qty, onAdd, onInc, onDec, onOpen }) {
  const { name, image, price, mrp, unit, available = true, eta } = product;
  const off = mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen?.()}
      className="relative flex h-full flex-col rounded-xl border border-qc-line bg-qc-card p-2 text-left"
    >
      {off > 0 && (
        <span className="absolute left-2 top-0 z-10 rounded-b-md bg-qc-brand px-1.5 py-0.5 text-[10px] font-bold leading-tight text-white">
          {off}%<br />OFF
        </span>
      )}
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-white">
        {image ? (
          <img src={image} alt={name} loading="lazy" className={`h-full w-full object-contain ${available ? "" : "opacity-40 grayscale"}`} />
        ) : (
          <div className="h-full w-full rounded-lg bg-qc-bg" />
        )}
      </div>

      {eta && (
        <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded bg-qc-bg px-1.5 py-0.5 text-[9px] font-bold uppercase text-qc-ink">
          <Clock className="h-2.5 w-2.5" strokeWidth={3} /> {eta}
        </span>
      )}

      <p className="mt-1 line-clamp-2 min-h-[2.5em] text-[13px] font-semibold leading-tight text-qc-ink">{name}</p>
      <p className="mt-0.5 min-h-[1.25em] text-xs text-qc-muted">{unit || ""}</p>

      <div className="mt-auto flex items-end justify-between gap-1 pt-2">
        <div className="leading-tight">
          <p className="text-[13px] font-bold text-qc-ink">{rupees(price)}</p>
          {off > 0 && <p className="text-[11px] text-qc-muted line-through">{rupees(mrp)}</p>}
        </div>
        <QcStepper qty={qty} onAdd={onAdd} onInc={onInc} onDec={onDec} disabled={!available} />
      </div>
    </div>
  );
}

export function QcProductCardSkeleton() {
  return (
    <div className="flex flex-col rounded-xl border border-qc-line bg-qc-card p-2">
      <div className="aspect-square animate-pulse rounded-lg bg-qc-bg" />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-qc-bg" />
      <div className="mt-1 h-3 w-1/2 animate-pulse rounded bg-qc-bg" />
      <div className="mt-3 flex justify-between">
        <div className="h-4 w-10 animate-pulse rounded bg-qc-bg" />
        <div className="h-8 w-16 animate-pulse rounded-lg bg-qc-bg" />
      </div>
    </div>
  );
}
