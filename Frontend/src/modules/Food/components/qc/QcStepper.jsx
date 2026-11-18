import { Minus, Plus } from "lucide-react";

/**
 * ADD button that becomes a − qty + stepper once the item is in the cart.
 * Pure UI: the caller owns the cart.
 */
export default function QcStepper({ qty = 0, onAdd, onInc, onDec, disabled = false, size = "sm", label = "ADD" }) {
  const h = size === "lg" ? "h-10 text-sm" : "h-8 text-xs";
  const w = size === "lg" ? "min-w-[96px]" : "min-w-[68px]";

  if (disabled) {
    return (
      <span className={`${h} ${w} inline-flex items-center justify-center rounded-lg border border-qc-line bg-qc-bg px-2 font-semibold text-qc-muted`}>
        Sold out
      </span>
    );
  }

  if (!qty) {
    return (
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAdd?.(); }}
        className={`${h} ${w} inline-flex items-center justify-center rounded-lg border border-qc-brand bg-qc-brand-soft px-3 font-bold tracking-wide text-qc-brand-dark transition active:scale-95`}
      >
        {label}
      </button>
    );
  }

  return (
    <div
      className={`${h} ${w} inline-flex items-center justify-between rounded-lg bg-qc-brand font-bold text-white`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
    >
      <button type="button" aria-label="Remove one" onClick={onDec} className="flex h-full items-center px-2 active:scale-90">
        <Minus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
      <span className="tabular-nums">{qty}</span>
      <button type="button" aria-label="Add one" onClick={onInc} className="flex h-full items-center px-2 active:scale-90">
        <Plus className="h-3.5 w-3.5" strokeWidth={3} />
      </button>
    </div>
  );
}
