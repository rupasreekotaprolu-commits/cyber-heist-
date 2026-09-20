import Link from "next/link";
import { getCurrentTeam } from "@/lib/auth";

export default async function HomePage() {
  const team = await getCurrentTeam();
  return (
    <main className="landing-shell">
      <div className="grid-glow" />
      <section className="landing-content">
        <p className="eyebrow">CSE TECHNICAL EVENT · MISSION CONTROL</p>
        <div className="breach-mark"><span /> BREACH DETECTED</div>
        <h1>THE SYSTEM<br />HAS BEEN BREACHED.</h1>
        <p className="landing-copy">The organizer sets the event time limit before the mission begins.</p>
        <div className="landing-actions">
          <Link className="button button-primary" href={team ? "/mission" : "/register"}>{team ? "RETURN TO MISSION" : "ENTER THE HEIST"}</Link>
          <Link className="button button-quiet" href="/admin/login">Organizer access</Link>
        </div>
        <div className="mission-meta">
          <span>05 LEVELS</span><i /> <span>330 POINTS</span><i /> <span>TEAMS OF 04</span>
        </div>
      </section>
      <aside className="landing-panel">
        <div className="panel-label">MISSION SEQUENCE</div>
        {[
          ["01", "CRACK THE CODE", "Aptitude"],
          ["02", "FIND THE PATTERN", "Data & logical reasoning"],
          ["03", "BREAK THE CODE", "Programming"],
          ["04", "CONNECT THE CLUES", "Digital puzzle"],
          ["05", "SOLVE THE CHALLENGE", "Final protocol"],
        ].map(([number, title, detail]) => <div className="sequence-row" key={number}><b>{number}</b><div><strong>{title}</strong><small>{detail}</small></div></div>)}
      </aside>
    </main>
  );
}
