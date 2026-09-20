import { redirect } from "next/navigation";
import { getCurrentTeam } from "@/lib/auth";
import { getEventState } from "@/lib/event";
import { readActiveQuestionIds } from "@/lib/event-config";
import { prisma } from "@/lib/prisma";
import { MissionBoard } from "@/components/mission-board";

export default async function MissionPage() {
  const team = await getCurrentTeam();
  if (!team) redirect("/register");
  const { state, event } = await getEventState();
  const active = readActiveQuestionIds(event?.activeQuestionIds);
  const questions = team.currentLevel <= 5 ? await prisma.question.findMany({
    where: { id: { in: active[team.currentLevel] ?? [] }, level: team.currentLevel, published: true },
    select: { id: true, level: true, theme: true, category: true, topic: true, difficulty: true, questionText: true, options: true, points: true, type: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  }) : [];
  const submissions = questions.length ? await prisma.submission.findMany({
    where: { teamId: team.id, questionId: { in: questions.map((question) => question.id) } },
    select: { questionId: true },
  }) : [];
  const publicQuestions = questions.map((question) => ({ ...question, options: Array.isArray(question.options) ? question.options.filter((item): item is string => typeof item === "string") : [] }));
  const resultsReleased = Boolean(event?.resultsFinalized && event?.leaderboardReleased);
  const studentScoreVisible = event?.studentScoreVisible ?? false;
  return <MissionBoard team={{ name: team.name, teamId: team.teamId, currentLevel: team.currentLevel, totalScore: studentScoreVisible || resultsReleased ? team.totalScore : 0 }} eventState={state} endsAt={event?.endsAt?.toISOString() ?? null} totalMarks={event?.totalMarks ?? 330} studentScoreVisible={studentScoreVisible} correctnessFeedbackVisible={event?.correctnessFeedbackVisible ?? false} allowAnswerRevision={event?.allowAnswerRevision ?? false} resultsReleased={resultsReleased} questions={publicQuestions} submissions={submissions} />;
}
