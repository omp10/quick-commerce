import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDeliveryLocation } from "@food/context/DeliveryLocationContext";
import { usePublicAppConfigOptional } from "@food/context/PublicAppConfigContext";
import { useLocationSelector } from "@food/components/user/UserLayout";
import { isVideoUrl } from "@food/utils/mediaType";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";
import useQcStore from "@food/hooks/useQcStore";
import useQcCart from "@food/hooks/useQcCart";
import QcProductCard, { QcProductCardSkeleton } from "@food/components/qc/QcProductCard";
import QcProductSheet from "@food/components/qc/QcProductSheet";
import { QcCategoryTile, QcCategoryTileSkeleton, QcRail, QcSectionHeader } from "@food/components/qc/QcBits";
import { QcBottomNav, QcCartBar, QcHeader, QcStoreStatus } from "@food/components/qc/QcChrome";

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

const RAIL_ITEMS = 15;

export default function QcHome() {
  const navigate = useNavigate();
  const { displayAddressText } = useDeliveryLocation();
  const { openLocationSelector } = useLocationSelector();
  const { status, store, sections, bestsellers } = useQcStore();
  const cart = useQcCart(store);
  const [open, setOpen] = useState(null);

  const loading = status === "loading" || status === "locating";
  const goCategory = (id) => navigate(`/food/user/category/${encodeURIComponent(id)}`);
  const similarFor = (p) => sections.find((s) => s.products.some((x) => x.id === p?.id))?.products || [];

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
    <div className="min-h-screen bg-qc-bg pb-36 font-[Poppins] md:pb-10">
      <QcHeader
        eta={store?.eta}
        address={displayAddressText}
        onAddress={openLocationSelector}
        onSearch={() => navigate("/food/user/search")}
      />

      <div className="mx-auto max-w-6xl">
        <QcStoreStatus
          status={status === "ready" && sections.length === 0 ? "empty" : status}
          onChangeLocation={openLocationSelector}
        />

        {(loading || status === "ready") && (
          <>
            {status === "ready" && <Banners />}

            {status === "ready" && store && !store.isOpen && (
              <div className="mx-4 mt-3 rounded-xl bg-qc-highlight-soft px-3 py-2 text-[13px] font-semibold text-qc-ink">
                {store.name} is closed right now. You can browse, and order when it opens.
              </div>
            )}

            {(loading || sections.length > 0) && (
              <section className="mt-5">
                <QcSectionHeader title="Shop by category" onSeeAll={sections.length > 8 ? () => navigate("/food/user/categories") : undefined} />
                <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 px-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                  {loading
                    ? Array.from({ length: 8 }, (_, i) => <QcCategoryTileSkeleton key={i} />)
                    : sections.slice(0, 12).map((s) => (
                        <QcCategoryTile key={s.id} name={s.name} image={s.image} onClick={() => goCategory(s.id)} />
                      ))}
                </div>
              </section>
            )}

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
              <section key={s.id} className="mt-7">
                <QcSectionHeader title={s.name} onSeeAll={() => goCategory(s.id)} />
                <QcRail>
                  {s.products.slice(0, RAIL_ITEMS).map((p) => <div key={p.id} className="w-[31%] shrink-0 snap-start md:w-44">{card(p)}</div>)}
                </QcRail>
              </section>
            ))}
          </>
        )}
      </div>

      <QcCartBar count={cart.itemCount} total={cart.total} onOpen={() => navigate("/food/user/cart")} />
      <QcBottomNav />
      <QcProductSheet product={open} similar={similarFor(open)} cart={cart} onClose={() => setOpen(null)} onOpen={setOpen} />
    </div>
  );
}
