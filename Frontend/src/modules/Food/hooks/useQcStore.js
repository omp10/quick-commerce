import { useEffect, useMemo, useState } from "react";
import { restaurantAPI } from "@food/api";
import { useDeliveryLocation } from "@food/context/DeliveryLocationContext";
import { getRestaurantAvailabilityStatus } from "@food/utils/restaurantAvailability";
import { getFoodDisplayPrice, getFoodDisplayOtherPrice, hasFoodVariants } from "@food/utils/foodVariants";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";

const pickImage = (r) =>
  resolveMediaUrl(
    r?.profileImage?.url || r?.profileImage || r?.image || r?.imageUrl ||
    (Array.isArray(r?.coverImages) && (r.coverImages[0]?.url || r.coverImages[0])) || r?.coverImage || ""
  );

const etaOf = (r) => {
  const raw = r?.estimatedDeliveryTimeMinutes ?? r?.estimatedDeliveryTime ?? r?.deliveryTime;
  const n = parseInt(String(raw ?? ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/** Normalise a menu item into the shape QcProductCard expects. */
export const toQcProduct = (item, store) => {
  const price = Number(getFoodDisplayPrice(item)) || 0;
  const other = Number(getFoodDisplayOtherPrice(item)) || 0;
  return {
    id: String(item.id || item._id),
    name: item.name,
    image: resolveMediaUrl(item.image || item.imageUrl || (Array.isArray(item.images) ? item.images[0] : "")),
    price,
    mrp: other > price ? other : null,
    unit: item.unit || item.weight || item.quantityLabel || "",
    available: item.isAvailable !== false,
    hasVariants: hasFoodVariants(item),
    eta: store?.eta ? `${store.eta} mins` : "",
    raw: item,
  };
};

/**
 * Plan A of the quick-commerce redesign: the nearest open store in the
 * user's zone becomes the whole catalogue.
 * Returns { status, store, sections, error } where status is one of
 * "locating" | "out_of_zone" | "loading" | "no_store" | "ready" | "error".
 */
// Every quick-commerce screen reads the same store, so moving between Home,
// Categories, a category and Search should not refetch it each time.
const CACHE_TTL_MS = 60_000;
let cache = null; // { key, at, store, sections }
const cacheKey = (zoneId, lat, lng) =>
  `${zoneId}|${Number(lat).toFixed(3)}|${Number(lng).toFixed(3)}`;

export default function useQcStore() {
  const { effectiveLocation, zoneId, zoneLoading, isOutOfService } = useDeliveryLocation();
  const lat = effectiveLocation?.latitude;
  const lng = effectiveLocation?.longitude;

  const fresh = cache && cache.key === cacheKey(zoneId, lat, lng) && Date.now() - cache.at < CACHE_TTL_MS ? cache : null;
  const [store, setStore] = useState(fresh?.store ?? null);
  const [sections, setSections] = useState(fresh?.sections ?? []);
  const [status, setStatus] = useState(fresh ? "ready" : "locating");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (zoneLoading) return;
    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng)) || (!lat && !lng)) { setStatus("no_location"); return; }
    if (isOutOfService) { setStatus("out_of_zone"); return; }
    if (!zoneId) { setStatus("locating"); return; }

    const key = cacheKey(zoneId, lat, lng);
    if (cache && cache.key === key && Date.now() - cache.at < CACHE_TTL_MS) {
      setStore(cache.store);
      setSections(cache.sections);
      setStatus(cache.store ? "ready" : "no_store");
      return;
    }

    let cancelled = false;
    (async () => {
      setStatus("loading");
      setError(null);
      try {
        const res = await restaurantAPI.getRestaurants({ zoneId, lat, lng });
        const list = res?.data?.data?.restaurants || [];
        const ranked = list
          .map((r) => ({ r, avail: getRestaurantAvailabilityStatus(r) }))
          .sort((a, b) =>
            (b.avail.isOpen ? 1 : 0) - (a.avail.isOpen ? 1 : 0) ||
            (Number(a.r.distanceInKm) || 9e9) - (Number(b.r.distanceInKm) || 9e9)
          );
        const best = ranked[0];
        if (!best) { if (!cancelled) { setStore(null); setSections([]); setStatus("no_store"); } return; }

        const r = best.r;
        const s = {
          id: r.restaurantId || r._id || r.id,
          mongoId: r._id || r.id,
          name: r.restaurantName || r.name,
          slug: r.slug,
          image: pickImage(r),
          eta: etaOf(r),
          isOpen: best.avail.isOpen,
          raw: r,
        };

        const menuRes = await restaurantAPI.getMenuByRestaurantId(s.mongoId);
        const rawSections = menuRes?.data?.data?.menu?.sections || [];
        const out = [];
        for (const sec of rawSections) {
          const items = [...(sec.items || []), ...(sec.subsections || []).flatMap((ss) => ss.items || [])];
          const products = items.map((it) => toQcProduct(it, s)).filter((p) => p.name);
          if (products.length) {
            out.push({
              id: String(sec.id || sec._id || sec.name),
              name: sec.name || sec.title || "Products",
              image: products.find((p) => p.image)?.image || "",
              products,
            });
          }
        }
        cache = { key, at: Date.now(), store: s, sections: out };
        if (!cancelled) { setStore(s); setSections(out); setStatus("ready"); }
      } catch (e) {
        if (!cancelled) { setError(e); setStatus("error"); }
      }
    })();
    return () => { cancelled = true; };
  }, [zoneId, zoneLoading, isOutOfService, lat, lng]);

  const bestsellers = useMemo(
    () => sections.flatMap((s) => s.products).filter((p) => p.raw?.isRecommended && p.available).slice(0, 12),
    [sections]
  );

  return { status, store, sections, bestsellers, error };
}
