import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight, Baby, BadgePercent, Bike, Carrot, Cookie, Croissant, CupSoda, Egg, Mail, MapPin,
  Milk, PackageCheck, Phone, Search, ShoppingBasket, SprayCan, Store, Timer, Wheat, Zap,
} from "lucide-react";
import apiClient from "../services/api";
import logo from "@food/assets/appzeto-logo.png";

/*
 * Public landing page for quick.appzeto.com: a short quick-commerce page
 * (hero, value props, categories, how it works, partner sign-ups, footer).
 *
 * The app-store links still point at the existing store listings, whose ids
 * were registered under the old name. Swap them here once the Appzeto
 * listings are live.
 */
const APP_LINKS = {
  user: {
    play: "https://play.google.com/store/apps/details?id=com.switcheats.user1",
    ios: "https://apps.apple.com/in/app/switcheats/id6766444150",
  },
  delivery: {
    play: "https://play.google.com/store/apps/details?id=com.switcheats.delivery1",
    ios: "https://apps.apple.com/in/app/switcheats-captain/id6766778164",
  },
};

const SHOP = "/food/user";

const CATEGORIES = [
  { name: "Fruits & vegetables", Icon: Carrot, tint: "bg-[#eaf6e1] text-[#3f7f1f]" },
  { name: "Dairy, bread & eggs", Icon: Milk, tint: "bg-[#e6f6f5] text-[#0f7f7a]" },
  { name: "Atta, rice & dal", Icon: Wheat, tint: "bg-[#fff4d6] text-[#8a6100]" },
  { name: "Snacks & biscuits", Icon: Cookie, tint: "bg-[#fdeee4] text-[#a2470d]" },
  { name: "Cold drinks & juices", Icon: CupSoda, tint: "bg-[#e8f1fd] text-[#1d5fb8]" },
  { name: "Bakery", Icon: Croissant, tint: "bg-[#fbf0e3] text-[#8a5413]" },
  { name: "Cleaning essentials", Icon: SprayCan, tint: "bg-[#efeafd] text-[#5b3cc4]" },
  { name: "Baby care", Icon: Baby, tint: "bg-[#fdeaf1] text-[#b0306a]" },
];

const VALUE_PROPS = [
  { Icon: Zap, title: "Delivered in minutes", body: "Stores near you pack your order as soon as you place it, and a rider brings it straight over." },
  { Icon: ShoppingBasket, title: "Your daily essentials", body: "Fresh produce, dairy, staples, snacks and household needs in one app." },
  { Icon: BadgePercent, title: "Prices that make sense", body: "Everyday low prices, offers and coupons, with no minimum order." },
];

const STEPS = [
  { Icon: MapPin, title: "Set your location", body: "We show the nearest store that delivers to you." },
  { Icon: Search, title: "Add what you need", body: "Browse categories or search, then tap ADD." },
  { Icon: Timer, title: "Get it in minutes", body: "Pay online or on delivery and track your rider live." },
];

function StoreBadges({ links, dark = false }) {
  const cls = `inline-flex h-12 items-center gap-2 rounded-xl px-4 text-left ${dark ? "bg-qc-ink text-white" : "bg-white text-qc-ink border border-qc-line"}`;
  return (
    <div className="flex flex-wrap gap-2.5">
      <a href={links.play} target="_blank" rel="noopener noreferrer" className={cls}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path fill="currentColor" d="M3.6 2.3c-.3.3-.4.7-.4 1.2v17c0 .5.1.9.4 1.2l9.6-9.7L3.6 2.3Zm10.7 10.8 2.8 2.8-11.6 6.6c-.3.2-.7.3-1 .2l9.8-9.6Zm0-2.2L4.5 1.3c.3-.1.7 0 1 .2l11.6 6.6-2.8 2.8Zm4.2-1.6 2.8 1.6c.8.5.8 1.7 0 2.2l-2.8 1.6-3-3 3-2.4Z" /></svg>
        <span className="leading-tight">
          <span className="block text-[10px] opacity-70">Get it on</span>
          <span className="block text-sm font-bold">Google Play</span>
        </span>
      </a>
      <a href={links.ios} target="_blank" rel="noopener noreferrer" className={cls}>
        <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true"><path fill="currentColor" d="M16.4 12.6c0-2.4 2-3.6 2.1-3.7-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.2-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4.9-1.3 1.3-2.7 1.3-2.7s-2.5-1-2.5-4ZM14 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4Z" /></svg>
        <span className="leading-tight">
          <span className="block text-[10px] opacity-70">Download on the</span>
          <span className="block text-sm font-bold">App Store</span>
        </span>
      </a>
    </div>
  );
}

/** Hero artwork drawn in code: a phone-sized card with an ETA pill and a basket. */
function HeroArt() {
  const items = [
    { Icon: Milk, label: "Milk", price: "₹28" },
    { Icon: Egg, label: "Eggs", price: "₹42" },
    { Icon: Croissant, label: "Bread", price: "₹35" },
    { Icon: Carrot, label: "Carrots", price: "₹24" },
  ];
  return (
    <div className="relative mx-auto w-full max-w-sm">
      <div className="absolute -inset-6 rounded-[2.5rem] bg-white/40 blur-2xl" aria-hidden="true" />
      <div className="relative rounded-[2rem] border border-qc-line bg-white p-4 shadow-xl shadow-qc-brand/10">
        <div className="flex items-center justify-between rounded-2xl bg-qc-highlight-soft px-4 py-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-qc-ink/60">Arriving in</p>
            <p className="text-2xl font-black text-qc-ink">10 minutes</p>
          </div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-qc-brand text-white">
            <Bike className="h-6 w-6" />
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {items.map(({ Icon, label, price }) => (
            <div key={label} className="rounded-xl border border-qc-line p-2.5">
              <div className="flex aspect-[4/3] items-center justify-center rounded-lg bg-qc-bg text-qc-brand">
                <Icon className="h-8 w-8" />
              </div>
              <p className="mt-1.5 text-[13px] font-semibold text-qc-ink">{label}</p>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-[13px] font-bold text-qc-ink">{price}</span>
                <span className="rounded-md border border-qc-brand bg-qc-brand-soft px-2 py-0.5 text-[11px] font-bold text-qc-brand-dark">ADD</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-qc-brand px-4 py-3 text-white">
          <span className="text-[13px] font-bold">4 items · ₹129</span>
          <span className="flex items-center gap-1 text-sm font-bold">View cart <ArrowRight className="h-4 w-4" /></span>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [support, setSupport] = useState({ email: "", mobile: "" });

  useEffect(() => {
    document.title = "Appzeto: groceries and essentials delivered in minutes";
    let alive = true;
    apiClient
      .get("/food/pages/support", { params: { module: "USER" } })
      .then((res) => {
        const d = res?.data?.data || res?.data || {};
        if (alive) setSupport({ email: String(d.email || "").trim(), mobile: String(d.mobile || "").trim() });
      })
      .catch(() => { /* footer simply omits contact details */ });
    return () => { alive = false; };
  }, []);

  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-white font-[Poppins] text-qc-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-qc-line/70 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex items-center" aria-label="Appzeto home">
            <img src={logo} alt="Appzeto" className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#partners" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-qc-ink/80 hover:bg-qc-bg sm:block">Partner with us</a>
            <Link to={SHOP} className="inline-flex items-center gap-1.5 rounded-xl bg-qc-brand px-4 py-2.5 text-sm font-bold text-white shadow-sm shadow-qc-brand/30 hover:bg-qc-brand-dark">
              Order now <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="overflow-hidden bg-gradient-to-b from-qc-highlight via-qc-highlight-soft to-white">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-10 md:grid-cols-2 md:pb-20 md:pt-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-xs font-bold text-qc-brand-dark">
              <Zap className="h-3.5 w-3.5" /> Quick commerce, near you
            </span>
            <h1 className="mt-4 text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Groceries and essentials, delivered in minutes.
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-qc-ink/75 md:text-lg">
              Milk, fruits, snacks, staples and household needs from a store near you, at your door before you know it.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link to={SHOP} className="inline-flex h-12 items-center gap-2 rounded-xl bg-qc-brand px-6 text-base font-bold text-white shadow-lg shadow-qc-brand/30 hover:bg-qc-brand-dark">
                Start shopping <ArrowRight className="h-5 w-5" />
              </Link>
            </div>
            <div className="mt-6">
              <p className="mb-2 text-xs font-semibold text-qc-ink/60">Or get the app</p>
              <StoreBadges links={APP_LINKS.user} dark />
            </div>
          </div>
          <HeroArt />
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <div className="grid gap-4 md:grid-cols-3">
          {VALUE_PROPS.map(({ Icon, title, body }) => (
            <div key={title} className="rounded-2xl border border-qc-line bg-qc-bg/60 p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-qc-brand text-white">
                <Icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-extrabold">{title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-qc-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-qc-bg py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black tracking-tight md:text-3xl">Everything for your home</h2>
              <p className="mt-1 text-sm text-qc-muted">What's available depends on the store near you.</p>
            </div>
            <Link to="/food/user/categories" className="hidden shrink-0 items-center gap-1 text-sm font-bold text-qc-brand-dark sm:inline-flex">
              See all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-4 gap-3 md:grid-cols-8">
            {CATEGORIES.map(({ name, Icon, tint }) => (
              <Link key={name} to="/food/user/categories" className="group flex flex-col items-center gap-2 text-center">
                <span className={`flex aspect-square w-full items-center justify-center rounded-2xl transition group-hover:scale-[1.03] ${tint}`}>
                  <Icon className="h-8 w-8 md:h-10 md:w-10" />
                </span>
                <span className="text-[11px] font-semibold leading-tight md:text-xs">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14 md:py-20">
        <h2 className="text-center text-2xl font-black tracking-tight md:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative rounded-2xl border border-qc-line p-6">
              <span className="absolute right-5 top-4 text-4xl font-black text-qc-line">{i + 1}</span>
              <Icon className="h-7 w-7 text-qc-brand" />
              <h3 className="mt-3 text-base font-extrabold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-qc-muted">{body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <Link to={SHOP} className="inline-flex h-12 items-center gap-2 rounded-xl bg-qc-brand px-6 text-base font-bold text-white hover:bg-qc-brand-dark">
            Start shopping <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Partners */}
      <section id="partners" className="scroll-mt-20 bg-qc-ink py-14 text-white md:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-2xl font-black tracking-tight md:text-3xl">Grow with Appzeto</h2>
          <p className="mt-1 text-sm text-white/70">Run a store or ride with us. Sign up in a few minutes.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-qc-highlight text-qc-ink">
                <Store className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold">Sell on Appzeto</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                List your grocery or convenience store, get orders from customers nearby, and manage stock and payouts from the seller panel.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Link to="/seller/signup" className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-qc-highlight px-5 text-sm font-bold text-qc-ink">
                  Register your store <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/seller/login" className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold text-white/80 ring-1 ring-white/20 hover:bg-white/5">
                  Seller login
                </Link>
              </div>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-qc-brand text-white">
                <PackageCheck className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-xl font-extrabold">Deliver with Appzeto</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/70">
                Short trips from nearby stores, flexible hours and weekly payouts. Download the delivery partner app to get started.
              </p>
              <div className="mt-5">
                <StoreBadges links={APP_LINKS.delivery} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-qc-line bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div>
            <img src={logo} alt="Appzeto" className="h-9 w-auto" />
            <p className="mt-3 max-w-xs text-sm text-qc-muted">Groceries and essentials delivered in minutes from stores near you.</p>
          </div>
          <nav aria-label="Company" className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Link to="/food/user/profile/about" className="text-qc-ink/80 hover:text-qc-brand-dark">About</Link>
            <Link to="/food/user/profile/help-content" className="text-qc-ink/80 hover:text-qc-brand-dark">Help</Link>
            <Link to="/food/user/profile/terms" className="text-qc-ink/80 hover:text-qc-brand-dark">Terms</Link>
            <Link to="/food/user/profile/privacy" className="text-qc-ink/80 hover:text-qc-brand-dark">Privacy</Link>
            <Link to="/food/user/profile/refund" className="text-qc-ink/80 hover:text-qc-brand-dark">Refunds</Link>
            <Link to="/delete-account" className="text-qc-ink/80 hover:text-qc-brand-dark">Delete account</Link>
          </nav>
          <div className="space-y-2 text-sm">
            {support.email && (
              <a href={`mailto:${support.email}`} className="flex items-center gap-2 text-qc-ink/80 hover:text-qc-brand-dark">
                <Mail className="h-4 w-4" /> {support.email}
              </a>
            )}
            {support.mobile && (
              <a href={`tel:${support.mobile.replace(/\s+/g, "")}`} className="flex items-center gap-2 text-qc-ink/80 hover:text-qc-brand-dark">
                <Phone className="h-4 w-4" /> {support.mobile}
              </a>
            )}
          </div>
        </div>
        <div className="border-t border-qc-line py-4 text-center text-xs text-qc-muted">© {year} Appzeto. All rights reserved.</div>
      </footer>
    </div>
  );
}
