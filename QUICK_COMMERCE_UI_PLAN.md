# Appzeto Quick Commerce: customer app redesign plan

Goal: replace the food-delivery look (SwitchEats layout, restaurant cards, dining, "Switch 99", gourmet) with a
**10-minute grocery app** experience in the style of Blinkit and similar apps. The look is our own: Appzeto name,
Appzeto logo and our own colour palette. We do not copy any other app's logo, name, illustrations or exact colours.

Scope is the **customer web app** (`/food/user/*`). Admin, store (restaurant) and delivery panels keep working
as they are and only pick up the new name, logo and colours.

---

## 0. Clean up the half-done rebrand (first, ~0.5 day)

The working tree has an uncommitted find-and-replace rebrand. It touches 150 files, and part of it is already on
quick.appzeto.com.

- **Keep:** the name change (SwitchEats → Appzeto), the logo files, the favicon and `<title>`, and
  `companyName = "Appzeto"` in the database.
- **Revert:** the colour remap. That covers the hex swaps, the `red-*`/`rose-*`/`pink-*` → teal override in
  `global.css`, and the `danger-*` swaps. The new design system replaces all of it, and those global overrides
  would fight it.
- Commit the name and logo changes on their own branch, `rebrand/appzeto-name`.

## 1. Design system (~1–1.5 days)

New file `src/shared/styles/qc-theme.css`, imported by the customer layout only, so admin and store panels are
untouched.

| Token | Value | Use |
|---|---|---|
| `--qc-brand` | Appzeto teal `#14A39C` | primary buttons, ADD button border, prices accent |
| `--qc-brand-dark` | `#0F7F7A` | pressed states, header text |
| `--qc-accent` | logo lime `#8CC63F` | "10 MINS" delivery badge, success, savings |
| `--qc-highlight` | logo yellow `#FFE14D` | header background band, offer chips |
| `--qc-bg` | `#F4F6F8` | page background (grey canvas, white cards) |
| `--qc-card` | `#FFFFFF`, radius 12px, 1px `#E8EBEE` border | product and category cards |
| `--qc-danger` | real red | errors, out of stock, remove |

- **Type:** one family (Inter or Poppins, already loaded). Sizes 11/12/14/16/20/24. Prices bold, MRP struck
  through in grey.
- **Density:** small cards on mobile, 3 per row for products and 4 per row for categories. That is the
  quick-commerce look, and it differs from the big hero images food apps use.
- **Shared components** go in `src/modules/Food/components/qc/`:
  - `QcHeader`: delivery-time line ("Delivery in 10 minutes"), address dropdown, search bar, profile icon.
  - `QcSearchBar`: sticky, with rotating placeholder text ("Search milk", "Search bread", and so on).
  - `QcCategoryTile`: image on a soft tinted square, name below.
  - `QcProductCard`: image, weight/unit, name (2 lines), price + MRP + "% OFF" tag, ADD button that turns into a
    `− 1 +` stepper.
  - `QcStepper`: the shared quantity control, used on cards, product page and cart.
  - `QcCartBar`: floating bottom bar ("2 items · ₹148 · View cart →") shown whenever the cart has items.
  - `QcBottomNav`: Home, Categories, Order again, Profile.
  - `QcSectionHeader`: title plus "see all".
  - `QcBannerStrip`: horizontal offer banners from the existing banner API (image, GIF and video already supported).
  - Skeletons for every card type.

## 2. Screens (~5–7 days)

All screens reuse the existing APIs in `src/services/api` (categories, restaurants = stores,
foods = products, cart, orders, addresses, coupons, wallet). There is no backend change in the first pass.

| Screen | Route | Replaces | Notes |
|---|---|---|---|
| Home | `/food/user` | `pages/user/Home.jsx` (4.5k lines) | Header → search → banner strip → "Shop by category" grid → product rails per category ("Dairy, bread & eggs", "Snacks", …) → "Bestsellers" rail. New file `pages/user/qc/QcHome.jsx`; the old Home stays until cut-over. |
| Categories | `/food/user/categories` | `Categories.jsx` | All categories grouped by parent, 4 per row. |
| Category listing | `/food/user/category/:category` | `CategoryPage.jsx` | Blinkit-style split view: sub-category rail on the left, product grid on the right, filter/sort chips on top. |
| Search | `/food/user/search` | `SearchOverlay` + `SearchResults` | Recent searches, trending chips, instant product results with ADD in-line. |
| Product detail | `/food/user/product/:id` | `ProductDetail.jsx` | Image carousel, unit variants as pills, price block, description and highlights, "similar products" rail, sticky ADD bar. |
| Cart | `/food/user/cart` | `cart/Cart.jsx` | Delivery-time card, item list with steppers, "you might have missed" rail, coupon row, bill details, tip, address and payment footer. Reuses the existing coupon, wallet and Razorpay logic. |
| Address select | `cart/select-address` | restyle only | Bottom sheet styling. |
| Order tracking | `/food/user/orders/:orderId` | restyle | Status timeline + map (existing `DeliveryTrackingMap`), rider card. |
| Orders / Order again | `/food/user/orders` | restyle | Past orders with "Reorder" button that adds the items back to the cart. |
| Profile | `/food/user/profile` | restyle | List layout, wallet, addresses, coupons, help, logout. |
| Login / OTP | `auth/*` | restyle | Logo, phone input, OTP boxes in the new tokens. |

**Removed from the customer navigation:** Dining, Switch 99 / Under 250, Gourmet, Coffee, Collections and table
bookings. The routes stay in the code and are only hidden. Removing them can come later.

## 3. The one real product question: single store vs. many stores

Quick-commerce apps show **one catalogue from the nearest dark store**. The current backend is
restaurant-based: one cart per store, and `CartReplaceDialog` warns when you switch.

- **Plan A, recommended for v1:** on location set, pick the nearest open store (existing zone and distance
  logic) and make the whole app that store's catalogue. Store cards never appear. This needs no backend change.
- **Plan B, later:** a merged catalogue across sellers with split fulfilment. This needs backend cart and order
  changes, so it is out of scope for this redesign.

If no store serves the address, show a clean "Not delivering here yet" screen (restyled `OutOfZoneScreen`).

## 4. Landing page (~1 day)

Rewrite `src/app/LandingPage.jsx` (1.8k lines of food copy) as a short quick-commerce page:
- a hero ("Groceries delivered in minutes") with app download buttons;
- three value props;
- category strip;
- partner pages for stores and delivery partners;
- footer.

All of it uses the same tokens.

## 5. Other panels: light touch (~0.5 day)

Admin, store and delivery apps only get the logo, the name and the brand colour on their primary buttons and
sidebar active states. Their layout is not redesigned.

## 6. Delivery and rollout

1. Branch `feature/qc-customer-ui`, built behind a flag `VITE_QC_UI=1` so old and new screens can be compared.
2. Order: design system → Home → Category listing → Product → Cart/checkout → Search → Orders/Tracking →
   Profile/Auth → Landing.
3. Checks per screen: mobile 375px and desktop, empty, loading and error states, an add-to-cart → checkout →
   track run against the live API, and a Lighthouse score of at least 85 on mobile.
4. Deploy: build on the server (or upload `dist`) to `/opt/quick-commerce/Frontend/dist`, keeping the previous
   `dist.prev-*` for one-command rollback. The nginx setup from today stays as is.
5. Turn the flag on, then delete the old food screens in a follow-up.

**Estimate:** about 9–12 working days for the customer app, plus 1–2 for the landing page and panel touch-ups.

## Decisions needed before starting

1. Colours: the teal, lime and yellow from the Appzeto logo, as above, or a different palette?
2. Single nearest-store catalogue (Plan A) for v1?
3. Hide Dining, Gourmet, Switch 99 and Collections from customers. OK?
4. Real product and category images: are they already in the admin, or do we need placeholders?
