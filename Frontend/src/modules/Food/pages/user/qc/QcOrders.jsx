import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, PackageOpen, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { orderAPI } from "@food/api";
import { useCart } from "@food/context/CartContext";
import { buildCartLineId } from "@food/utils/foodVariants";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";
import { QcBottomNav, QcCartBar, QcPageHeader } from "@food/components/qc/QcChrome";

const PAGE_SIZE = 20;

const STATUS = {
  created: { label: "Order placed", tone: "live" },
  confirmed: { label: "Confirmed", tone: "live" },
  preparing: { label: "Packing your order", tone: "live" },
  ready_for_pickup: { label: "Packed, waiting for rider", tone: "live" },
  ready: { label: "Packed, waiting for rider", tone: "live" },
  reached_pickup: { label: "Rider at store", tone: "live" },
  picked_up: { label: "On the way", tone: "live" },
  out_for_delivery: { label: "On the way", tone: "live" },
  reached_drop: { label: "Rider has arrived", tone: "live" },
  delivered: { label: "Delivered", tone: "done" },
  completed: { label: "Delivered", tone: "done" },
};
const statusOf = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s.startsWith("cancel")) return { label: "Cancelled", tone: "cancelled" };
  return STATUS[s] || { label: s ? s.replace(/_/g, " ") : "Placed", tone: "live" };
};

const toneClass = {
  live: "bg-qc-highlight-soft text-qc-ink",
  done: "bg-qc-brand-soft text-qc-brand-dark",
  cancelled: "bg-red-50 text-red-700",
};

const rupees = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
const when = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
};

/** API order → the fields this screen draws. */
const toRow = (o) => {
  const store = o.restaurantId && typeof o.restaurantId === "object" ? o.restaurantId : null;
  const items = (o.items || []).map((it) => ({
    itemId: String(it.itemId || it._id || it.id || ""),
    name: it.name || it.foodName || "Item",
    quantity: Math.max(1, Number(it.quantity) || 1),
    price: Number(it.price) || 0,
    image: resolveMediaUrl(it.image || ""),
    variantId: it.variantId || "",
    variantName: it.variantName || "",
  }));
  return {
    id: String(o._id || o.id),
    displayId: o.order_id || o.orderId || String(o._id || "").slice(-6),
    rawStatus: o.orderStatus || o.status,
    createdAt: o.createdAt,
    total: Number(o.pricing?.total ?? o.total ?? 0),
    storeId: store?._id || o.restaurantId,
    storeName: store?.restaurantName || o.restaurantName || "Store",
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
  };
};

const listFrom = (res) => {
  const d = res?.data?.data;
  if (Array.isArray(d)) return { list: d, pages: Number(res?.data?.data?.meta?.totalPages || res?.data?.meta?.totalPages) || 0 };
  if (Array.isArray(d?.data)) return { list: d.data, pages: Number(d.meta?.totalPages) || 0 };
  if (Array.isArray(d?.orders)) return { list: d.orders, pages: Number(d.pagination?.pages || d.pagination?.totalPages) || 0 };
  return { list: [], pages: 0 };
};

function OrderCard({ order, onOpen, onReorder }) {
  const st = statusOf(order.rawStatus);
  const shown = order.items.slice(0, 4);
  return (
    <div className="rounded-2xl border border-qc-line bg-white p-3">
      <button type="button" onClick={onOpen} className="flex w-full items-start justify-between gap-2 text-left">
        <div className="min-w-0">
          <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-bold ${toneClass[st.tone]}`}>{st.label}</span>
          <p className="mt-1.5 truncate text-[13px] font-bold text-qc-ink">{order.storeName}</p>
          <p className="text-[11px] text-qc-muted">
            #{order.displayId} · {when(order.createdAt)}
          </p>
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-qc-muted" />
      </button>

      <div className="mt-2.5 flex items-center gap-1.5">
        {shown.map((it, i) => (
          <div key={`${it.itemId}-${i}`} className="h-11 w-11 overflow-hidden rounded-lg border border-qc-line bg-qc-bg">
            {it.image ? <img src={it.image} alt={it.name} loading="lazy" className="h-full w-full object-contain" /> : null}
          </div>
        ))}
        {order.items.length > shown.length && (
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-qc-bg text-xs font-bold text-qc-muted">
            +{order.items.length - shown.length}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-dashed border-qc-line pt-2.5">
        <p className="text-[13px] text-qc-muted">
          {order.count} item{order.count === 1 ? "" : "s"} · <span className="font-bold text-qc-ink">{rupees(order.total)}</span>
        </p>
        {st.tone === "live" ? (
          <button type="button" onClick={onOpen} className="rounded-lg bg-qc-brand px-3 py-1.5 text-xs font-bold text-white">
            Track order
          </button>
        ) : (
          <button
            type="button"
            onClick={onReorder}
            className="inline-flex items-center gap-1 rounded-lg border border-qc-brand bg-qc-brand-soft px-3 py-1.5 text-xs font-bold text-qc-brand-dark"
          >
            <RotateCcw className="h-3.5 w-3.5" strokeWidth={2.75} /> Reorder
          </button>
        )}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-qc-line bg-white p-3">
      <div className="h-4 w-24 animate-pulse rounded bg-qc-bg" />
      <div className="mt-2 h-3 w-40 animate-pulse rounded bg-qc-bg" />
      <div className="mt-3 flex gap-1.5">{Array.from({ length: 3 }, (_, i) => <div key={i} className="h-11 w-11 animate-pulse rounded-lg bg-qc-bg" />)}</div>
      <div className="mt-3 h-7 w-full animate-pulse rounded bg-qc-bg" />
    </div>
  );
}

/** "Order again": live orders pinned on top, past orders with one-tap reorder. */
export default function QcOrders() {
  const navigate = useNavigate();
  const { replaceCart, itemCount, total } = useCart();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async (target) => {
    target === 1 ? setLoading(true) : setLoadingMore(true);
    setError(null);
    try {
      const res = await orderAPI.getOrders({ page: target, limit: PAGE_SIZE });
      const { list, pages: totalPages } = listFrom(res);
      const rows = list.map(toRow);
      setOrders((prev) => {
        if (target === 1) return rows;
        const seen = new Set(prev.map((o) => o.id));
        return [...prev, ...rows.filter((o) => !seen.has(o.id))];
      });
      setPage(target);
      setPages(totalPages || (rows.length < PAGE_SIZE ? target : target + 1));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const reorder = (o) => {
    const items = o.items
      .filter((it) => it.itemId)
      .map((it) => {
        const lineItemId = buildCartLineId(it.itemId, it.variantId);
        return {
          id: lineItemId,
          lineItemId,
          itemId: it.itemId,
          name: it.name,
          price: it.price,
          variantId: it.variantId,
          variantName: it.variantName,
          variantPrice: it.price,
          image: it.image,
          restaurant: o.storeName,
          restaurantId: o.storeId,
          quantity: it.quantity,
        };
      });
    if (!items.length || !o.storeId) {
      toast.error("These items can't be reordered.");
      return;
    }
    replaceCart(items);
    toast.success("Items added to your cart");
    navigate("/food/user/cart");
  };

  const live = orders.filter((o) => statusOf(o.rawStatus).tone === "live");
  const past = orders.filter((o) => statusOf(o.rawStatus).tone !== "live");
  const card = (o) => (
    <OrderCard key={o.id} order={o} onOpen={() => navigate(`/food/user/orders/${o.id}`)} onReorder={() => reorder(o)} />
  );

  return (
    <div className="min-h-screen bg-qc-bg pb-36 font-[Poppins] md:pb-10">
      <QcPageHeader title="Your orders" showSearch={false} />

      <div className="mx-auto max-w-2xl space-y-3 px-3 pt-3">
        {loading && Array.from({ length: 3 }, (_, i) => <CardSkeleton key={i} />)}

        {!loading && error && orders.length === 0 && (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-extrabold text-qc-ink">Couldn't load your orders</p>
            <p className="mt-1 text-sm text-qc-muted">Check your connection and try again.</p>
            <button type="button" onClick={() => load(1)} className="mt-5 rounded-xl bg-qc-brand px-5 py-2.5 text-sm font-bold text-white">Retry</button>
          </div>
        )}

        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-qc-brand-soft text-qc-brand">
              <PackageOpen className="h-8 w-8" />
            </div>
            <p className="text-base font-extrabold text-qc-ink">No orders yet</p>
            <p className="mt-1 text-sm text-qc-muted">Your groceries are a few taps away.</p>
            <button type="button" onClick={() => navigate("/food/user")} className="mt-5 rounded-xl bg-qc-brand px-5 py-2.5 text-sm font-bold text-white">Start shopping</button>
          </div>
        )}

        {live.length > 0 && (
          <section className="space-y-3">
            <h2 className="px-1 text-sm font-extrabold text-qc-ink">In progress</h2>
            {live.map(card)}
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-3 pt-1">
            <h2 className="px-1 text-sm font-extrabold text-qc-ink">Past orders</h2>
            {past.map(card)}
          </section>
        )}

        {!loading && page < pages && (
          <button
            type="button"
            onClick={() => load(page + 1)}
            disabled={loadingMore}
            className="w-full rounded-xl border border-qc-line bg-white py-3 text-sm font-bold text-qc-brand-dark disabled:opacity-60"
          >
            {loadingMore ? "Loading…" : "Show older orders"}
          </button>
        )}
        {!loading && error && orders.length > 0 && (
          <p className="text-center text-xs text-red-600">Couldn't load more orders. Tap "Show older orders" to retry.</p>
        )}
      </div>

      <QcCartBar count={itemCount} total={total} onOpen={() => navigate("/food/user/cart")} />
      <QcBottomNav />
    </div>
  );
}
