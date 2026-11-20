import { ArrowLeft, ChevronDown, ChevronRight, Home, LayoutGrid, MapPin, RotateCcw, Search, Store, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import logo from "@food/assets/appzeto-logo.png";

const SEARCH_HINTS = ["milk", "bread", "eggs", "fruits", "chips", "atta", "cold drinks", "chocolate"];

/** Top header: delivery promise, address, profile; sticky search below. */
export function QcHeader({ eta, address, onAddress, onSearch }) {
  const [hint, setHint] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setHint((h) => (h + 1) % SEARCH_HINTS.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <header className="bg-gradient-to-b from-qc-highlight to-qc-highlight-soft px-4 pb-3 pt-4">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-3">
          <button type="button" onClick={onAddress} className="min-w-0 text-left">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-qc-ink/70">Appzeto in</p>
            <p className="text-[26px] font-black leading-none tracking-tight text-qc-ink">
              {eta ? `${eta} minutes` : "minutes"}
            </p>
            <p className="mt-1 flex items-center gap-0.5 truncate text-[13px] font-semibold text-qc-ink">
              <span className="truncate">{address || "Select delivery location"}</span>
              <ChevronDown className="h-4 w-4 shrink-0" strokeWidth={3} />
            </p>
          </button>
          <div className="flex shrink-0 items-center gap-2">
            <img src={logo} alt="Appzeto" className="hidden h-9 w-auto md:block" />
            <Link to="/food/user/profile" aria-label="Profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-qc-ink">
              <User className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      <div className="sticky top-0 z-30 bg-qc-highlight-soft px-4 pb-3 pt-1 shadow-[0_6px_12px_-10px_rgba(0,0,0,0.25)]">
        <button
          type="button"
          onClick={onSearch}
          className="mx-auto flex h-11 w-full max-w-6xl items-center gap-2 rounded-xl border border-qc-line bg-white px-3 text-left text-sm text-qc-muted"
        >
          <Search className="h-4 w-4 text-qc-ink" strokeWidth={2.5} />
          Search “{SEARCH_HINTS[hint]}”
        </button>
      </div>
    </>
  );
}

/** Header for inner screens: back, title, optional subtitle, search shortcut. */
export function QcPageHeader({ title, subtitle, showSearch = true, right }) {
  const navigate = useNavigate();
  const back = () => (window.history.length > 1 ? navigate(-1) : navigate("/food/user"));
  return (
    <header className="sticky top-0 z-30 border-b border-qc-line bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-2">
        <button type="button" onClick={back} aria-label="Back" className="flex h-10 w-10 items-center justify-center rounded-full text-qc-ink active:bg-qc-bg">
          <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
        </button>
        <div className="min-w-0 flex-1 leading-tight">
          <h1 className="truncate text-base font-extrabold text-qc-ink">{title}</h1>
          {subtitle && <p className="truncate text-[11px] text-qc-muted">{subtitle}</p>}
        </div>
        {right}
        {showSearch && (
          <Link to="/food/user/search" aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full text-qc-ink active:bg-qc-bg">
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </Link>
        )}
      </div>
    </header>
  );
}

function StateScreen({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center px-8 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qc-brand-soft text-qc-brand">
        <Icon className="h-8 w-8" />
      </div>
      <h2 className="text-lg font-extrabold text-qc-ink">{title}</h2>
      <p className="mt-1 max-w-xs text-sm text-qc-muted">{body}</p>
      {action}
    </div>
  );
}

/**
 * The non-catalogue states every QC screen shares (from useQcStore().status).
 * Renders nothing while loading or ready, so callers draw their own skeletons.
 */
export function QcStoreStatus({ status, onChangeLocation }) {
  const btn = (label, onClick) => (
    <button type="button" onClick={onClick} className="mt-5 rounded-xl bg-qc-brand px-5 py-2.5 text-sm font-bold text-white">{label}</button>
  );
  switch (status) {
    case "out_of_zone":
      return <StateScreen icon={MapPin} title="Not delivering here yet" body="We're not in your area yet. Try another address nearby." action={onChangeLocation && btn("Change location", onChangeLocation)} />;
    case "no_location":
      return <StateScreen icon={MapPin} title="Where should we deliver?" body="Set your delivery location to see the store and products near you." action={onChangeLocation && btn("Set location", onChangeLocation)} />;
    case "no_store":
      return <StateScreen icon={Store} title="No store open nearby" body="Stores in your area are closed right now. Please check back soon." />;
    case "error":
      return <StateScreen icon={Store} title="Couldn't load the store" body="Check your connection and try again." action={btn("Retry", () => window.location.reload())} />;
    case "empty":
      return <StateScreen icon={Store} title="Shelves are being stocked" body="This store hasn't added products yet." />;
    default:
      return null;
  }
}

/** Floating cart summary shown whenever the cart has items. */
export function QcCartBar({ count, total, onOpen, raised = true }) {
  if (!count) return null;
  return (
    <div className={`pointer-events-none fixed inset-x-0 z-40 px-3 ${raised ? "bottom-[68px] md:bottom-4" : "bottom-4"}`}>
      <button
        type="button"
        onClick={onOpen}
        className="pointer-events-auto mx-auto flex w-full max-w-md items-center justify-between rounded-xl bg-qc-brand px-4 py-3 text-white shadow-lg shadow-qc-brand/30 active:scale-[0.99]"
      >
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-bold">{count} item{count > 1 ? "s" : ""}</span>
          <span className="block text-[13px] font-semibold opacity-90">₹{Number(total || 0).toLocaleString("en-IN")}</span>
        </span>
        <span className="flex items-center gap-1 text-[15px] font-bold">
          View cart <ChevronRight className="h-5 w-5" strokeWidth={3} />
        </span>
      </button>
    </div>
  );
}

const NAV = [
  { to: "/food/user", label: "Home", Icon: Home, exact: true },
  { to: "/food/user/categories", label: "Categories", Icon: LayoutGrid },
  { to: "/food/user/orders", label: "Order again", Icon: RotateCcw },
  { to: "/food/user/profile", label: "Profile", Icon: User },
];

export function QcBottomNav() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-qc-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="grid grid-cols-4">
        {NAV.map(({ to, label, Icon, exact }) => {
          const active = exact ? pathname.replace(/\/$/, "") === to : pathname.startsWith(to);
          return (
            <button
              key={to}
              type="button"
              onClick={() => navigate(to)}
              className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${active ? "text-qc-brand-dark" : "text-qc-muted"}`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.75 : 2} />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
