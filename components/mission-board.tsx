"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Question = { id: string; level: number; theme: string; category: string; topic: string; difficulty: string; questionText: string; options: string[]; points: number; type: "MCQ" | "SHORT_ANSWER"; sortOrder: number };
type Submission = { questionId: string };
type EventState = "NOT_STARTED" | "RUNNING" | "ENDED";
const levelNames = ["CRACK THE CODE", "FIND THE PATTERN", "BREAK THE CODE", "CONNECT THE CLUES", "SOLVE THE CHALLENGE"];

function Countdown({ endsAt, state }: { endsAt: string | null; state: EventState }) {
  const endTime = endsAt ? new Date(endsAt).getTime() : 0;
  const [remaining, setRemaining] = useState(() => Math.max(0, endTime - Date.now()));
  useEffect(() => { if (state !== "RUNNING") return; const tick = () => setRemaining(Math.max(0, endTime - Date.now())); tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer); }, [endTime, state]);
  if (state === "NOT_STARTED") return <div className="timer timer-waiting"><b>AWAITING LAUNCH</b><span>The organizer will set the event time limit before launch.</span></div>;
  if (state === "ENDED" || remaining === 0) return <div className="timer timer-ended"><b>MISSION ENDED</b><span>Submissions are closed.</span></div>;
  const hours = Math.floor(remaining / 3_600_000); const minutes = Math.floor((remaining % 3_600_000) / 60_000); const seconds = Math.floor((remaining % 60_000) / 1000);
  return <div className="timer"><span>TIME REMAINING</span><b>{`${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`}</b></div>;
}

function QuestionCard({ question, submission, disabled, endsAt, allowAnswerRevision, correctnessFeedbackVisible }: { question: Question; submission?: Submission; disabled: boolean; endsAt: string | null; allowAnswerRevision: boolean; correctnessFeedbackVisible: boolean }) {
  const router = useRouter(); const [answer, setAnswer] = useState(""); const [message, setMessage] = useState(""); const [sending, setSending] = useState(false);
  const [expired, setExpired] = useState(() => Boolean(endsAt && new Date(endsAt).getTime() <= Date.now()));
  useEffect(() => { if (!endsAt) return; const check = () => setExpired(new Date(endsAt).getTime() <= Date.now()); check(); const timer = window.setInterval(check, 1000); return () => window.clearInterval(timer); }, [endsAt]);
  const submitted = Boolean(submission);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!answer || disabled || expired || (submitted && !allowAnswerRevision)) return;
    setSending(true); setMessage("");
    try {
      const response = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ questionId: question.id, answer }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error ?? "Could not submit your answer.");
      setMessage(correctnessFeedbackVisible && typeof data.correct === "boolean" ? (data.correct ? "Answer submitted as correct." : "Answer submitted as incorrect.") : (data.message ?? "Answer submitted."));
      window.setTimeout(() => router.refresh(), 450);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not submit your answer."); } finally { setSending(false); }
  }
  return <article className={`question-card ${submitted ? "solved" : ""}`}><div className="question-head"><span>QUESTION {question.sortOrder}</span></div><p className="question-topic">{question.topic} · {question.difficulty}</p><p className="question-text">{question.questionText}</p>{submitted && !allowAnswerRevision ? <p className="answer-state">ANSWER SUBMITTED</p> : <form onSubmit={submit} className="answer-form">{question.type === "MCQ" ? <div className="options">{question.options.map((option) => <label key={option} className={answer === option ? "selected" : ""}><input type="radio" name={question.id} value={option} checked={answer === option} onChange={() => setAnswer(option)} disabled={disabled || expired} />{option}</label>)}</div> : <input value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={disabled || expired} placeholder="Enter your answer" maxLength={500} autoComplete="off" />}<button className="button button-primary button-small" disabled={disabled || expired || sending || !answer}>{sending ? "SUBMITTING…" : submitted ? "UPDATE ANSWER" : "SUBMIT ANSWER"}</button>{message && <p className="answer-state">{message}</p>}</form>}</article>;
}

function Leaderboard() {
  const [open, setOpen] = useState(false); const [teams, setTeams] = useState<Array<{ rank: number; name: string; teamId: string; score: number; progress: string }>>([]); const [error, setError] = useState("");
  useEffect(() => { if (!open) return; const load = async () => { try { const response = await fetch("/api/leaderboard", { cache: "no-store" }); const data = await response.json(); if (!response.ok) throw new Error(); setTeams(data.teams); setError(""); } catch { setError("The leaderboard has not been released."); } }; void load(); const timer = window.setInterval(load, 30_000); return () => window.clearInterval(timer); }, [open]);
  return <section className="leaderboard"><button className="button button-quiet" onClick={() => setOpen(!open)}>{open ? "HIDE LEADERBOARD" : "VIEW LEADERBOARD"}</button>{open && <div className="leaderboard-table"><h2>Central leaderboard</h2>{error ? <p className="form-message error">{error}</p> : <table><thead><tr><th>Rank</th><th>Team</th><th>Score</th><th>Progress</th></tr></thead><tbody>{teams.map((team) => <tr key={team.teamId}><td>#{team.rank}</td><td><strong>{team.name}</strong><small>{team.teamId}</small></td><td>{team.score}</td><td>{team.progress}</td></tr>)}</tbody></table>}</div>}</section>;
}

export function MissionBoard({ team, eventState, endsAt, totalMarks, studentScoreVisible, correctnessFeedbackVisible, allowAnswerRevision, resultsReleased, questions, submissions }: { team: { name: string; teamId: string; currentLevel: number; totalScore: number }; eventState: EventState; endsAt: string | null; totalMarks: number; studentScoreVisible: boolean; correctnessFeedbackVisible: boolean; allowAnswerRevision: boolean; resultsReleased: boolean; questions: Question[]; submissions: Submission[] }) {
  const router = useRouter(); const byQuestion = useMemo(() => new Map(submissions.map((submission) => [submission.questionId, submission])), [submissions]); const completed = team.currentLevel > 5; const showScore = studentScoreVisible || resultsReleased; const levelSubmitted = !allowAnswerRevision && questions.length > 0 && questions.every((question) => byQuestion.has(question.id));
  async function signOut() { await fetch("/api/team/logout", { method: "POST" }); router.push("/"); router.refresh(); }
  return <main className="mission-shell"><header className="mission-header"><a className="wordmark" href="/">CYBER<span>HEIST</span></a><div className="team-summary"><span>{team.name}</span><small>{team.teamId}</small></div><button className="text-button" onClick={signOut}>Sign out</button></header><section className="mission-top"><div><p className="eyebrow">LIVE MISSION</p><h1>{completed ? "MISSION COMPLETE" : `LEVEL ${team.currentLevel} — ${levelNames[team.currentLevel - 1]}`}</h1><p className="muted">{completed ? "All five levels have been completed." : levelSubmitted ? "Level submitted. Waiting for the administrator to unlock the next level." : "Submit every answer in this level, then wait for the organizer to unlock the next one."}</p></div>{eventState !== "RUNNING" && <Countdown endsAt={endsAt} state={eventState} />}{showScore && <div className="score-card"><span>{resultsReleased ? "FINAL SCORE" : "CURRENT SCORE"}</span><b>{team.totalScore}<small>/ {totalMarks}</small></b></div>}</section><nav className="progress-track" aria-label="Mission progress">{levelNames.map((name, index) => { const level = index + 1; const state = completed || level < team.currentLevel ? "complete" : level === team.currentLevel ? "current" : "locked"; return <div className={state} key={name}><b>{level}</b><span>{name}</span></div>; })}</nav>{eventState === "NOT_STARTED" && <div className="state-card"><h2>Mission access confirmed.</h2><p>The mission questions will activate when the organizer launches the event.</p></div>}{eventState === "ENDED" && <div className="state-card ended"><h2>MISSION ENDED</h2><p>No further answers can be accepted. Results will appear when released by the organizer.</p></div>}{completed && <div className="state-card complete"><h2>MISSION COMPLETE</h2>{resultsReleased && <p>Final score: <strong>{team.totalScore} / {totalMarks}</strong>.</p>}</div>}{!completed && eventState === "RUNNING" && (levelSubmitted ? <div className="state-card"><h2>LEVEL SUBMITTED</h2><p>Waiting for the administrator to unlock the next level.</p></div> : <section className="questions-section"><div className="section-heading"><p className="eyebrow">{questions[0]?.category ?? "LEVEL"}</p><h2>{questions[0]?.theme ?? "Question set unavailable"}</h2></div>{questions.length ? questions.map((question) => <QuestionCard key={question.id} question={question} submission={byQuestion.get(question.id)} disabled={false} endsAt={endsAt} allowAnswerRevision={allowAnswerRevision} correctnessFeedbackVisible={correctnessFeedbackVisible} />) : <div className="state-card"><p>No published questions are currently available for this level. Ask an organizer for help.</p></div>}</section>)}<Leaderboard /></main>;
}
