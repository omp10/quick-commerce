import { useNavigate } from "react-router-dom";
import { useCart } from "@food/context/CartContext";
import { buildCartLineId } from "@food/utils/foodVariants";

/**
 * Cart actions for quick-commerce product cards, shared by every QC screen.
 * `store` is the store object from useQcStore().
 */
export default function useQcCart(store) {
  const { addToCart, updateQuantity, getCartItem, itemCount, total } = useCart();
  const navigate = useNavigate();
  const s = store || {};

  const qtyOf = (p) => getCartItem(p.id)?.quantity || 0;

  const add = (p) => {
    // Items with size/weight options pick a variant on the store page.
    if (p.hasVariants) { navigate(`/food/user/restaurants/${s.slug || s.mongoId}`); return; }
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
      restaurant: s.name,
      restaurantId: s.id,
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

  const inc = (p) => setQty(p, qtyOf(p) + 1);
  const dec = (p) => setQty(p, qtyOf(p) - 1);

  return { qtyOf, add, inc, dec, setQty, itemCount, total };
}
