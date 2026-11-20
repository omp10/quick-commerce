import { useNavigate } from "react-router-dom";
import { useLocationSelector } from "@food/components/user/UserLayout";
import useQcStore from "@food/hooks/useQcStore";
import useQcCart from "@food/hooks/useQcCart";
import { QcCategoryTile, QcCategoryTileSkeleton } from "@food/components/qc/QcBits";
import { QcBottomNav, QcCartBar, QcPageHeader, QcStoreStatus } from "@food/components/qc/QcChrome";

/** Every category of the nearest store, four to a row. */
export default function QcCategories() {
  const navigate = useNavigate();
  const { openLocationSelector } = useLocationSelector();
  const { status, store, sections } = useQcStore();
  const cart = useQcCart(store);
  const loading = status === "loading" || status === "locating";

  return (
    <div className="min-h-screen bg-qc-bg pb-36 font-[Poppins] md:pb-10">
      <QcPageHeader title="All categories" subtitle={store ? `From ${store.name}` : undefined} />

      <div className="mx-auto max-w-6xl">
        <QcStoreStatus
          status={status === "ready" && sections.length === 0 ? "empty" : status}
          onChangeLocation={openLocationSelector}
        />

        {(loading || (status === "ready" && sections.length > 0)) && (
          <div className="mx-3 mt-3 rounded-2xl bg-white p-3">
            <div className="grid grid-cols-4 gap-x-2.5 gap-y-4 sm:grid-cols-6 md:grid-cols-8">
              {loading
                ? Array.from({ length: 12 }, (_, i) => <QcCategoryTileSkeleton key={i} />)
                : sections.map((s) => (
                    <QcCategoryTile
                      key={s.id}
                      name={s.name}
                      image={s.image}
                      onClick={() => navigate(`/food/user/category/${encodeURIComponent(s.id)}`)}
                    />
                  ))}
            </div>
          </div>
        )}
      </div>

      <QcCartBar count={cart.itemCount} total={cart.total} onOpen={() => navigate("/food/user/cart")} />
      <QcBottomNav />
    </div>
  );
}
