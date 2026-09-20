"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLogin() {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); setMessage(""); setBusy(true);
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: form.get("email"), password: form.get("password") }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not sign in.");
      router.push("/admin/dashboard"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setBusy(false); }
  }
  return <main className="auth-shell"><Link className="wordmark" href="/">CYBER<span>HEIST</span></Link><section className="auth-card admin-login"><p className="eyebrow">ORGANIZER ACCESS</p><h1>Mission control.</h1><p className="muted">Sign in with the administrator account created during database setup.</p><form className="form-stack" onSubmit={submit}><label>Email<input type="email" name="email" required autoComplete="email" /></label><label>Password<input type="password" name="password" required autoComplete="current-password" /></label><button className="button button-primary" disabled={busy}>{busy ? "VERIFYING…" : "SIGN IN"}</button></form>{message && <p className="form-message error">{message}</p>}</section></main>;
}
