import { useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Store } from "lucide-react";
import { useCart } from "@food/context/CartContext";
import { useDeliveryLocation } from "@food/context/DeliveryLocationContext";
import { usePublicAppConfigOptional } from "@food/context/PublicAppConfigContext";
import { useLocationSelector, useSearchOverlay } from "@food/components/user/UserLayout";
import { buildCartLineId } from "@food/utils/foodVariants";
import { isVideoUrl } from "@food/utils/mediaType";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";
import useQcStore from "@food/hooks/useQcStore";
import QcProductCard, { QcProductCardSkeleton } from "@food/components/qc/QcProductCard";
import { QcCategoryTile, QcCategoryTileSkeleton, QcRail, QcSectionHeader } from "@food/components/qc/QcBits";
import { QcBottomNav, QcCartBar, QcHeader } from "@food/components/qc/QcChrome";

function useQcCartActions(store) {
  const { addToCart, updateQuantity, getCartItem, itemCount, total } = useCart();
  const navigate = useNavigate();

  const qtyOf = (p) => getCartItem(p.id)?.quantity || 0;

  const add = (p) => {
    // Items with size/weight options pick a variant on the store page.
    if (p.hasVariants) { navigate(`/food/user/restaurants/${store.slug || store.mongoId}`); return; }
    const lineItemId = buildCartLineId(p.id);
    addToCart({
      id: lineItemId,
      lineItemId,
      itemId: p.id,
      name: p.name,
      price: p.price,
      otherPrice: p.mrp || 0,
      variantId: "",
      variantName: "",
      variantPrice: p.price,
      image: p.image,
      restaurant: store.name,
      restaurantId: store.id,
      description: p.raw?.description,
      originalPrice: p.raw?.originalPrice,
      foodType: p.raw?.foodType,
      isVeg: p.raw?.foodType === "Veg",
      preparationTime: p.raw?.preparationTime,
    });
  };

  const setQty = (p, q) => {
    const line = getCartItem(p.id);
    if (line) updateQuantity(line.id, q);
  };

  return { qtyOf, add, setQty, itemCount, total };
}

function Banners() {
  const cfg = usePublicAppConfigOptional?.();
  const banners = useMemo(
    () => (cfg?.heroBanners || []).map((b) => resolveMediaUrl(b?.imageUrl || b?.image || "")).filter(Boolean),
    [cfg?.heroBanners]
  );
  if (!banners.length) return null;
  return (
    <div className="scrollbar-hide mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4">
      {banners.map((src, i) => (
        <div key={i} className="aspect-[2/1] w-[86%] shrink-0 snap-center overflow-hidden rounded-2xl bg-qc-line md:w-[32%]">
          {isVideoUrl(src) ? (
            <video src={src} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : (
            <img src={src} alt="" className="h-full w-full object-cover" loading={i ? "lazy" : "eager"} />
          )}
        </div>
      ))}
    </div>
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

export default function QcHome() {
  const navigate = useNavigate();
  const { displayAddressText } = useDeliveryLocation();
  const { openLocationSelector } = useLocationSelector();
  const { openSearch } = useSearchOverlay();
  const { status, store, sections, bestsellers } = useQcStore();
  const cart = useQcCartActions(store || {});
  const railRefs = useRef({});

  const loading = status === "loading" || status === "locating";
  const card = (p) => (
    <QcProductCard
      key={p.id}
      product={p}
      qty={cart.qtyOf(p)}
      onAdd={() => cart.add(p)}
      onInc={() => cart.setQty(p, cart.qtyOf(p) + 1)}
      onDec={() => cart.setQty(p, cart.qtyOf(p) - 1)}
      onOpen={() => store && navigate(`/food/user/restaurants/${store.slug || store.mongoId}`)}
    />
  );

  return (
    <div className="min-h-screen bg-qc-bg pb-36 font-[Poppins] md:pb-10">
      <QcHeader eta={store?.eta} address={displayAddressText} onAddress={openLocationSelector} onSearch={openSearch} />

      <div className="mx-auto max-w-6xl">
        {status === "out_of_zone" && (
          <StateScreen
            icon={MapPin}
            title="Not delivering here yet"
            body="We're not in your area yet. Try another address nearby."
            action={<button onClick={openLocationSelector} className="mt-5 rounded-xl bg-qc-brand px-5 py-2.5 text-sm font-bold text-white">Change location</button>}
          />
        )}
        {status === "no_location" && (
          <StateScreen
            icon={MapPin}
            title="Where should we deliver?"
            body="Set your delivery location to see the store and products near you."
            action={<button onClick={openLocationSelector} className="mt-5 rounded-xl bg-qc-brand px-5 py-2.5 text-sm font-bold text-white">Set location</button>}
          />
        )}
        {status === "no_store" && (
          <StateScreen icon={Store} title="No store open nearby" body="Stores in your area are closed right now. Please check back soon." />
        )}
        {status === "error" && (
          <StateScreen
            icon={Store}
            title="Couldn't load the store"
            body="Check your connection and try again."
            action={<button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-qc-brand px-5 py-2.5 text-sm font-bold text-white">Retry</button>}
          />
        )}

        {(loading || status === "ready") && (
          <>
            {status === "ready" && <Banners />}

            {status === "ready" && store && !store.isOpen && (
              <div className="mx-4 mt-3 rounded-xl bg-qc-highlight-soft px-3 py-2 text-[13px] font-semibold text-qc-ink">
                {store.name} is closed right now. You can browse, and order when it opens.
              </div>
            )}

            <section className="mt-5">
              <QcSectionHeader title="Shop by category" />
              <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 px-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                {loading
                  ? Array.from({ length: 8 }, (_, i) => <QcCategoryTileSkeleton key={i} />)
                  : sections.map((s) => (
                      <QcCategoryTile
                        key={s.id}
                        name={s.name}
                        image={s.image}
                        onClick={() => railRefs.current[s.id]?.scrollIntoView({ behavior: "smooth", block: "start" })}
                      />
                    ))}
              </div>
            </section>

            {bestsellers.length > 0 && (
              <section className="mt-7">
                <QcSectionHeader title="Bestsellers" />
                <QcRail>
                  {bestsellers.map((p) => <div key={p.id} className="w-[31%] shrink-0 snap-start md:w-44">{card(p)}</div>)}
                </QcRail>
              </section>
            )}

            {loading && (
              <section className="mt-7">
                <div className="mb-2.5 ml-4 h-4 w-40 animate-pulse rounded bg-qc-line" />
                <QcRail>
                  {Array.from({ length: 4 }, (_, i) => <div key={i} className="w-[31%] shrink-0 md:w-44"><QcProductCardSkeleton /></div>)}
                </QcRail>
              </section>
            )}

            {sections.map((s) => (
              <section key={s.id} ref={(el) => (railRefs.current[s.id] = el)} className="mt-7 scroll-mt-20">
                <QcSectionHeader title={s.name} />
                <QcRail>
                  {s.products.slice(0, 15).map((p) => <div key={p.id} className="w-[31%] shrink-0 snap-start md:w-44">{card(p)}</div>)}
                </QcRail>
              </section>
            ))}

            {status === "ready" && sections.length === 0 && (
              <StateScreen icon={Store} title="Shelves are being stocked" body="This store hasn't added products yet." />
            )}
          </>
        )}
      </div>

      <QcCartBar count={cart.itemCount} total={cart.total} onOpen={() => navigate("/food/user/cart")} />
      <QcBottomNav />
    </div>
  );
}
