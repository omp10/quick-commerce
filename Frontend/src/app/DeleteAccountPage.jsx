import { useEffect } from "react"
import { Link } from "react-router-dom"
import logo from "@food/assets/appzeto-logo.png"

/**
 * Public account-deletion page (the URL given to Google Play as the app's
 * "delete account" link). Readable without signing in; the actual deletion
 * happens in the signed-in Account screen.
 *
 * The data lists must match what the backend does in
 * userProfile.service.js#deleteCurrentUserAccount.
 */
export default function DeleteAccountPage() {
  useEffect(() => {
    document.title = "Delete your Appzeto account"
  }, [])

  return (
    <div className="min-h-screen bg-qc-bg font-[Poppins] text-qc-ink">
      <header className="border-b border-qc-line bg-white">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <img src={logo} alt="Appzeto" className="h-9 w-auto" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight">Delete your Appzeto account</h1>
        <p className="mt-2 text-sm leading-relaxed text-qc-muted">
          This page explains how to delete your account in the Appzeto app (groceries and essentials delivered
          in minutes) and what happens to your data when you do.
        </p>

        <section className="mt-6 rounded-2xl border border-qc-line bg-white p-5">
          <h2 className="text-base font-extrabold">How to delete your account</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>Open the Appzeto app, or this website, and sign in with your mobile number and OTP.</li>
            <li>Go to <strong>Account</strong> (the profile icon).</li>
            <li>Scroll down and tap <strong>Delete account</strong>.</li>
            <li>Confirm. Your account is deleted straight away.</li>
          </ol>
          <Link
            to="/food/user/profile"
            className="mt-5 inline-flex items-center justify-center rounded-xl bg-qc-brand px-5 py-3 text-sm font-bold text-white"
          >
            Sign in and delete my account
          </Link>
        </section>

        <section className="mt-4 rounded-2xl border border-qc-line bg-white p-5">
          <h2 className="text-base font-extrabold">What is deleted</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            <li>Your profile: name, mobile number, email address and profile photo.</li>
            <li>Your saved delivery addresses.</li>
            <li>Your Appzeto wallet, including any balance in it. Use or withdraw it before deleting.</li>
            <li>The device tokens we use to send you notifications.</li>
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-qc-line bg-white p-5">
          <h2 className="text-base font-extrabold">What is kept</h2>
          <p className="mt-3 text-sm leading-relaxed">
            Records of orders you have already placed (items, amounts, payment details and the delivery address
            used for that order) are kept, because we need them for tax, accounting, refunds and disputes, as the
            law requires. They are no longer linked to an active account.
          </p>
        </section>

        <p className="mt-6 text-xs leading-relaxed text-qc-muted">
          Deleting your account cannot be undone. If you sign up again later with the same mobile number, you
          will get a new, empty account.
        </p>
      </main>
    </div>
  )
}
