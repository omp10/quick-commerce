import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Clock, Search, X } from "lucide-react";
import { useLocationSelector } from "@food/components/user/UserLayout";
import useQcStore from "@food/hooks/useQcStore";
import useQcCart from "@food/hooks/useQcCart";
import QcProductCard, { QcProductCardSkeleton } from "@food/components/qc/QcProductCard";
import QcProductSheet from "@food/components/qc/QcProductSheet";
import { QcCartBar, QcStoreStatus } from "@food/components/qc/QcChrome";

const RECENT_KEY = "qc_recent_searches";
const MAX_RECENT = 8;

const readRecent = () => {
  try {
    const v = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(v) ? v.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
};
const writeRecent = (list) => {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* storage unavailable */ }
};

const norm = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N} ]/gu, " ").replace(/\s+/g, " ").trim();

/** Search across the nearest store's catalogue, with ADD in the results. */
export default function QcSearch() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { openLocationSelector } = useLocationSelector();
  const { status, store, sections, bestsellers } = useQcStore();
  const cart = useQcCart(store);
  const [q, setQ] = useState(params.get("q") || "");
  const [recent, setRecent] = useState(readRecent);
  const [open, setOpen] = useState(null);
  const inputRef = useRef(null);

  const loading = status === "loading" || status === "locating";

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Keep ?q= in the URL so back/forward and shared links land on the same results.
  useEffect(() => {
    const t = setTimeout(() => {
      const next = q.trim();
      if ((params.get("q") || "") !== next) setParams(next ? { q: next } : {}, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [q, params, setParams]);

  const index = useMemo(
    () => sections.flatMap((s) => s.products.map((p) => ({ p, section: s, text: norm(`${p.name} ${s.name} ${p.raw?.description || ""}`), name: norm(p.name) }))),
    [sections]
  );

  const query = norm(q);
  const results = useMemo(() => {
    if (!query) return [];
    const words = query.split(" ");
    const seen = new Set();
    return index
      .filter(({ text }) => words.every((w) => text.includes(w)))
      // Name matches first, then name-starts-with, then everything else.
      .map((e) => ({ ...e, score: (e.name.startsWith(query) ? 2 : 0) + (e.name.includes(query) ? 1 : 0) + (e.p.available ? 0.5 : 0) }))
      .sort((a, b) => b.score - a.score)
      .filter(({ p }) => (seen.has(p.id) ? false : seen.add(p.id)))
      .map(({ p }) => p);
  }, [index, query]);

  const remember = (term) => {
    const t = term.trim();
    if (!t) return;
    const next = [t, ...recent.filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, MAX_RECENT);
    setRecent(next);
    writeRecent(next);
  };

  const openProduct = (p) => {
    remember(q);
    setOpen(p);
  };

  const similarFor = (p) => sections.find((s) => s.products.some((x) => x.id === p?.id))?.products || [];

  const card = (p) => (
    <QcProductCard
      key={p.id}
      product={p}
      qty={cart.qtyOf(p)}
      onAdd={() => { remember(q); cart.add(p); }}
      onInc={() => cart.inc(p)}
      onDec={() => cart.dec(p)}
      onOpen={() => openProduct(p)}
    />
  );

  return (
    <div className="min-h-screen bg-qc-bg pb-28 font-[Poppins]">
      <header className="sticky top-0 z-30 border-b border-qc-line bg-white">
        <form
          role="search"
          onSubmit={(e) => { e.preventDefault(); remember(q); inputRef.current?.blur(); }}
          className="mx-auto flex h-14 max-w-6xl items-center gap-1 px-2"
        >
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/food/user"))}
            aria-label="Back"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-qc-ink active:bg-qc-bg"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-qc-line bg-qc-bg px-3">
            <Search className="h-4 w-4 shrink-0 text-qc-ink" strokeWidth={2.5} />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={store ? `Search in ${store.name}` : "Search for products"}
              enterKeyHint="search"
              aria-label="Search products"
              className="min-w-0 flex-1 bg-transparent text-sm text-qc-ink outline-none placeholder:text-qc-muted"
            />
            {q && (
              <button type="button" onClick={() => { setQ(""); inputRef.current?.focus(); }} aria-label="Clear search" className="text-qc-muted">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>
        </form>
      </header>

      <div className="mx-auto max-w-6xl">
        {!loading && status !== "ready" && <QcStoreStatus status={status} onChangeLocation={openLocationSelector} />}

        {(loading || status === "ready") && !query && (
          <>
            {recent.length > 0 && (
              <section className="px-4 pt-4">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-extrabold text-qc-ink">Recent searches</h2>
                  <button type="button" onClick={() => { setRecent([]); writeRecent([]); }} className="text-xs font-bold text-qc-brand">Clear</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button key={r} type="button" onClick={() => setQ(r)} className="inline-flex items-center gap-1.5 rounded-full border border-qc-line bg-white px-3 py-1.5 text-xs font-semibold text-qc-ink">
                      <Clock className="h-3.5 w-3.5 text-qc-muted" /> {r}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {sections.length > 0 && (
              <section className="px-4 pt-5">
                <h2 className="mb-2 text-sm font-extrabold text-qc-ink">Browse categories</h2>
                <div className="flex flex-wrap gap-2">
                  {sections.slice(0, 12).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => navigate(`/food/user/category/${encodeURIComponent(s.id)}`)}
                      className="rounded-full bg-qc-brand-soft px-3 py-1.5 text-xs font-bold text-qc-brand-dark"
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </section>
            )}

            {(loading || bestsellers.length > 0) && (
              <section className="pt-5">
                <h2 className="mb-2 px-4 text-sm font-extrabold text-qc-ink">Popular right now</h2>
                <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-4 lg:grid-cols-6">
                  {loading
                    ? Array.from({ length: 6 }, (_, i) => <QcProductCardSkeleton key={i} />)
                    : bestsellers.slice(0, 12).map(card)}
                </div>
              </section>
            )}
          </>
        )}

        {status === "ready" && query && (
          <section className="pt-3">
            <p className="mb-2 px-4 text-xs font-semibold text-qc-muted">
              {results.length ? `${results.length} result${results.length === 1 ? "" : "s"} for “${q.trim()}”` : ""}
            </p>
            {results.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 px-4 sm:grid-cols-4 lg:grid-cols-6">{results.map(card)}</div>
            ) : (
              <div className="px-8 py-16 text-center">
                <p className="text-base font-extrabold text-qc-ink">No results for “{q.trim()}”</p>
                <p className="mt-1 text-sm text-qc-muted">Check the spelling, or try a more general word.</p>
              </div>
            )}
          </section>
        )}
      </div>

      <QcCartBar count={cart.itemCount} total={cart.total} onOpen={() => navigate("/food/user/cart")} raised={false} />
      <QcProductSheet product={open} similar={similarFor(open)} cart={cart} onClose={() => setOpen(null)} onOpen={setOpen} />
    </div>
  );
}
