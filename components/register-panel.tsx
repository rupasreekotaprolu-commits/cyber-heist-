"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Credentials = { teamId: string; accessCode: string; teamName: string };

async function postJson(url: string, body: unknown) {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Something went wrong.");
  return data;
}

export function RegisterPanel() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "join">("register");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [credentials, setCredentials] = useState<Credentials | null>(null);

  async function register(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(""); setBusy(true);
    try {
      const data = await postJson("/api/team/register", {
        name: form.get("name"), section: form.get("section"),
        members: [form.get("member1"), form.get("member2"), form.get("member3"), form.get("member4")],
      });
      setCredentials(data);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not register your team."); }
    finally { setBusy(false); }
  }

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage(""); setBusy(true);
    try {
      await postJson("/api/team/login", { teamId: form.get("teamId"), accessCode: form.get("accessCode") });
      router.push("/mission"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not sign in."); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <Link className="wordmark" href="/">CYBER<span>HEIST</span></Link>
    <section className="auth-card">
      {credentials ? <div className="credential-card">
        <p className="eyebrow">TEAM CREATED</p><h1>Secure your access code.</h1>
        <p>Share these details privately with your four members. The code is shown only once.</p>
        <dl><div><dt>TEAM</dt><dd>{credentials.teamName}</dd></div><div><dt>TEAM ID</dt><dd>{credentials.teamId}</dd></div><div><dt>ACCESS CODE</dt><dd className="access-code">{credentials.accessCode}</dd></div></dl>
        <button className="button button-primary" onClick={() => router.push("/mission")}>ENTER MISSION</button>
      </div> : <>
        <p className="eyebrow">TEAM ACCESS</p>
        <h1>{mode === "register" ? "Register your crew." : "Rejoin your mission."}</h1>
        <p className="muted">{mode === "register" ? "One team, exactly four members. Registration closes when the event starts." : "Use the Team ID and access code issued during registration."}</p>
        <div className="tabs"><button className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setMessage(""); }}>Register team</button><button className={mode === "join" ? "active" : ""} onClick={() => { setMode("join"); setMessage(""); }}>Join team</button></div>
        {mode === "register" ? <form onSubmit={register} className="form-stack">
          <label>Team name<input name="name" required minLength={3} maxLength={60} placeholder="e.g. Byte Bandits" /></label>
          <label>Section / college <span>(optional)</span><input name="section" maxLength={80} placeholder="e.g. CSE–B" /></label>
          <fieldset><legend>Four members</legend><div className="member-grid">{[1, 2, 3, 4].map((number) => <input key={number} name={`member${number}`} required minLength={2} maxLength={80} placeholder={`Member ${number} name`} />)}</div></fieldset>
          <button className="button button-primary" disabled={busy}>{busy ? "CREATING TEAM…" : "CREATE TEAM"}</button>
        </form> : <form onSubmit={join} className="form-stack">
          <label>Team ID<input name="teamId" required placeholder="CH-ABC123" autoCapitalize="characters" /></label>
          <label>Access code<input name="accessCode" required placeholder="8-character code" autoCapitalize="characters" /></label>
          <button className="button button-primary" disabled={busy}>{busy ? "VERIFYING…" : "ENTER MISSION"}</button>
        </form>}
        {message && <p className="form-message error">{message}</p>}
      </>}
    </section>
  </main>;
}
