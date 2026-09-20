import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminDashboard } from "@/components/admin-dashboard";
import { DEFAULT_QUESTION_COUNTS, DEFAULT_ROUND_MARKS, readLevelMap } from "@/lib/event-config";

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  const [event, teams, questions, recentSubmissions, allScoredSubmissions] = await Promise.all([
    prisma.event.findUnique({ where: { id: "main" } }),
    prisma.team.findMany({ include: { members: { orderBy: { createdAt: "asc" } } }, orderBy: [{ totalScore: "desc" }, { lastSubmissionAt: "asc" }, { name: "asc" }] }),
    prisma.question.findMany({ orderBy: [{ level: "asc" }, { sortOrder: "asc" }] }),
    prisma.submission.findMany({ take: 30, orderBy: { submittedAt: "desc" }, include: { team: { select: { name: true, teamId: true } }, question: { select: { code: true, level: true } } } }),
    prisma.submission.findMany({ where: { isCorrect: true }, select: { teamId: true, awardedPoints: true, question: { select: { level: true } } } }),
  ]);
  const roundScores = new Map<string, Record<string, number>>();
  for (const submission of allScoredSubmissions) {
    const scores = roundScores.get(submission.teamId) ?? {};
    const level = String(submission.question.level);
    scores[level] = (scores[level] ?? 0) + submission.awardedPoints;
    roundScores.set(submission.teamId, scores);
  }
  const safeQuestions = questions.map((question) => ({ ...question, options: Array.isArray(question.options) ? question.options.filter((option): option is string => typeof option === "string") : [] }));
  return <AdminDashboard adminEmail={admin.email} event={event ? { title: event.title, status: event.status, endsAt: event.endsAt?.toISOString() ?? null, durationMinutes: event.durationMinutes, questionCounts: readLevelMap(event.questionCounts, DEFAULT_QUESTION_COUNTS), roundMarks: readLevelMap(event.roundMarks, DEFAULT_ROUND_MARKS), totalMarks: event.totalMarks, resultsFinalized: event.resultsFinalized, leaderboardReleased: event.leaderboardReleased, negativeMarkingEnabled: event.negativeMarkingEnabled, negativeMarkingValue: event.negativeMarkingValue, allowAnswerRevision: event.allowAnswerRevision, studentScoreVisible: event.studentScoreVisible, correctnessFeedbackVisible: event.correctnessFeedbackVisible, liveLeaderboardVisible: event.liveLeaderboardVisible } : null} teams={teams.map((team, index) => ({ id: team.id, rank: index + 1, name: team.name, teamId: team.teamId, section: team.section, score: team.totalScore, currentLevel: team.currentLevel, members: team.members.map((member) => member.name), roundScores: roundScores.get(team.id) ?? {} }))} questions={safeQuestions} submissions={recentSubmissions.map((submission) => ({ id: submission.id, team: submission.team.name, teamId: submission.team.teamId, code: submission.question.code, level: submission.question.level, correct: submission.isCorrect, score: submission.awardedPoints, submittedAt: submission.submittedAt.toISOString() }))} />;
}
