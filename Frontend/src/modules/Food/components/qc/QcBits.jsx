import { ChevronRight } from "lucide-react";

/** Section title with optional "see all" link. */
export function QcSectionHeader({ title, onSeeAll }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-4">
      <h2 className="text-[17px] font-extrabold tracking-tight text-qc-ink">{title}</h2>
      {onSeeAll && (
        <button type="button" onClick={onSeeAll} className="flex items-center text-[13px] font-bold text-qc-brand">
          see all <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

/** Category tile: image on a soft tinted square, name below. */
export function QcCategoryTile({ name, image, onClick }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 text-center">
      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl bg-qc-brand-soft p-1.5">
        {image ? (
          <img src={image} alt="" loading="lazy" className="h-full w-full object-contain" />
        ) : (
          <span className="text-2xl font-black text-qc-brand">{name?.[0] || "?"}</span>
        )}
      </div>
      <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-qc-ink">{name}</span>
    </button>
  );
}

export function QcCategoryTileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="aspect-square w-full animate-pulse rounded-xl bg-qc-line/60" />
      <div className="h-2.5 w-3/4 animate-pulse rounded bg-qc-line/60" />
    </div>
  );
}

/** Horizontal scroller used for product rails. */
export function QcRail({ children }) {
  return (
    <div className="scrollbar-hide flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
      {children}
    </div>
  );
}
