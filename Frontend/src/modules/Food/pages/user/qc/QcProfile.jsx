import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight, FileText, Gift, Heart, HelpCircle, Info, LogOut, MapPin, Package, Pencil,
  ShieldAlert, ShieldCheck, Ticket, Trash2, User, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { userAPI } from "@food/api";
import { useProfile } from "@food/context/ProfileContext";
import { useLocationSelector } from "@food/components/user/UserLayout";
import { clearModuleAuth } from "@food/utils/auth";
import { logoutUserSession } from "@food/utils/moduleLogout";
import { resolveMediaUrl } from "@/shared/utils/mediaUrl";
import DeleteAccountModal from "@food/components/DeleteAccountModal";
import { QcBottomNav, QcPageHeader } from "@food/components/qc/QcChrome";

const SESSION_KEYS = ["accessToken", "user_authenticated", "user_user", "user", "cart", "userVegMode", "food-under-250-filters"];

const clearLocalSession = () => {
  clearModuleAuth("user");
  SESSION_KEYS.forEach((k) => { try { localStorage.removeItem(k); } catch { /* storage unavailable */ } });
  window.dispatchEvent(new Event("userAuthChanged"));
};

function Row({ icon: Icon, label, hint, to, onClick, danger }) {
  const body = (
    <>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${danger ? "bg-red-50 text-red-600" : "bg-qc-bg text-qc-ink"}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-semibold ${danger ? "text-red-600" : "text-qc-ink"}`}>{label}</span>
        {hint && <span className="block truncate text-[11px] text-qc-muted">{hint}</span>}
      </span>
      {!danger && <ChevronRight className="h-4 w-4 shrink-0 text-qc-muted" />}
    </>
  );
  const cls = "flex w-full items-center gap-3 px-3 py-3 text-left active:bg-qc-bg";
  return to ? <Link to={to} className={cls}>{body}</Link> : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

function Group({ title, children }) {
  return (
    <section className="mt-4">
      {title && <h2 className="mb-1.5 px-1 text-[11px] font-extrabold uppercase tracking-wider text-qc-muted">{title}</h2>}
      <div className="divide-y divide-qc-line overflow-hidden rounded-2xl border border-qc-line bg-white">{children}</div>
    </section>
  );
}

/** Account screen in the quick-commerce look. Same routes and APIs as before. */
export default function QcProfile() {
  const navigate = useNavigate();
  const { userProfile = {}, getDefaultAddress } = useProfile();
  const { openLocationSelector } = useLocationSelector();
  const [wallet, setWallet] = useState(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    userAPI.getWallet()
      .then((res) => {
        const w = res?.data?.data?.wallet || res?.data?.wallet;
        const bal = Number(w?.balance);
        if (alive) setWallet(Number.isFinite(bal) ? bal : 0);
      })
      .catch(() => { if (alive) setWallet(null); });
    return () => { alive = false; };
  }, []);

  const name = String(userProfile?.name || "").trim();
  const phone = String(userProfile?.phone || "").trim();
  const avatar = resolveMediaUrl(userProfile?.profileImage || "");
  const address = getDefaultAddress?.();
  const addressText = address ? [address.label, address.street || address.area, address.city].filter(Boolean).join(", ") : "";

  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logoutUserSession({ navigate });
    } catch {
      clearLocalSession();
      navigate("/food/user/auth/login", { replace: true });
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  const deleteAccount = async () => {
    try {
      await userAPI.deleteCurrentUserAccount();
      toast.success("Account deleted");
      clearLocalSession();
      navigate("/food/user/auth/login", { replace: true });
    } catch (error) {
      toast.error(error?.response?.data?.message || "Couldn't delete the account. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-qc-bg pb-28 font-[Poppins] md:pb-10">
      <QcPageHeader title="Account" showSearch={false} />

      <div className="mx-auto max-w-2xl px-3 pt-3">
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-qc-highlight to-qc-highlight-soft p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-qc-ink">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <User className="h-7 w-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-extrabold text-qc-ink">{name || "Hello there"}</p>
            <p className="truncate text-[13px] text-qc-ink/70">{phone || "Add your details"}</p>
          </div>
          <Link to="/food/user/profile/edit" aria-label="Edit profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-qc-ink">
            <Pencil className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { to: "/food/user/orders", Icon: Package, label: "Orders" },
            { to: "/food/user/wallet", Icon: Wallet, label: wallet == null ? "Wallet" : `₹${Math.floor(wallet).toLocaleString("en-IN")}` },
            { onClick: openLocationSelector, Icon: MapPin, label: "Addresses" },
          ].map(({ to, onClick, Icon, label }) => {
            const inner = (
              <>
                <Icon className="h-5 w-5 text-qc-brand" />
                <span className="text-xs font-bold text-qc-ink">{label}</span>
              </>
            );
            const cls = "flex flex-col items-center gap-1.5 rounded-2xl border border-qc-line bg-white py-3";
            return to ? <Link key={label} to={to} className={cls}>{inner}</Link> : <button key={label} type="button" onClick={onClick} className={cls}>{inner}</button>;
          })}
        </div>

        <Group title="Your information">
          <Row icon={MapPin} label="Delivery addresses" hint={addressText || "Add or change an address"} onClick={openLocationSelector} />
          <Row icon={Heart} label="Saved items" to="/food/user/profile/favorites" />
          <Row icon={Ticket} label="Coupons" to="/food/user/profile/coupons" />
          <Row icon={Gift} label="Refer and earn" to="/food/user/profile/refer-earn" />
        </Group>

        <Group title="Help">
          <Row icon={HelpCircle} label="Help and support" to="/food/user/profile/support" />
          <Row icon={ShieldAlert} label="Report a safety concern" to="/food/user/profile/report-safety-emergency" />
          <Row icon={Info} label="About" to="/food/user/profile/about" />
        </Group>

        <Group title="Policies">
          <Row icon={FileText} label="Terms and conditions" to="/food/user/profile/terms" />
          <Row icon={ShieldCheck} label="Privacy policy" to="/food/user/profile/privacy" />
          <Row icon={FileText} label="Refund and cancellation" to="/food/user/profile/refund" />
        </Group>

        <Group>
          <Row icon={LogOut} label={loggingOut ? "Logging out…" : "Log out"} onClick={() => setConfirmLogout(true)} danger />
          <Row icon={Trash2} label="Delete account" onClick={() => setDeleteOpen(true)} danger />
        </Group>
      </div>

      {confirmLogout && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-label="Log out">
          <button type="button" aria-label="Cancel" onClick={() => setConfirmLogout(false)} className="absolute inset-0 bg-black/45" />
          <div className="relative w-full rounded-t-3xl bg-white p-5 pb-[max(20px,env(safe-area-inset-bottom))] md:max-w-sm md:rounded-3xl">
            <h2 className="text-lg font-extrabold text-qc-ink">Log out?</h2>
            <p className="mt-1 text-sm text-qc-muted">You'll need your phone number and an OTP to log back in.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setConfirmLogout(false)} className="rounded-xl border border-qc-line py-3 text-sm font-bold text-qc-ink">Cancel</button>
              <button type="button" onClick={logout} disabled={loggingOut} className="rounded-xl bg-red-600 py-3 text-sm font-bold text-white disabled:opacity-60">
                {loggingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      )}

      <DeleteAccountModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAccount}
        walletAmount={wallet || 0}
        moduleName="user"
      />
      <QcBottomNav />
    </div>
  );
}
