import { EventStatus, LoginActor, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { DEFAULT_QUESTION_COUNTS, DEFAULT_ROUND_MARKS, readActiveQuestionIds, readLevelMap, selectConfiguredQuestions, totalConfiguredMarks } from "@/lib/event-config";
import { prisma } from "@/lib/prisma";
import { eventSettingsSchema } from "@/lib/validation";

const resetEventData = { status: EventStatus.DRAFT, startsAt: null, endsAt: null, activeQuestionIds: Prisma.JsonNull, resultsFinalized: false, finalizedAt: null, leaderboardReleased: false, liveLeaderboardVisible: false };

async function configuredSet(event: { questionCounts: Prisma.JsonValue | null; roundMarks: Prisma.JsonValue | null }) {
  const questionCounts = readLevelMap(event.questionCounts, DEFAULT_QUESTION_COUNTS);
  const roundMarks = readLevelMap(event.roundMarks, DEFAULT_ROUND_MARKS);
  const questions = await prisma.question.findMany({ where: { published: true }, select: { id: true, level: true, points: true, sortOrder: true } });
  return { roundMarks, selected: selectConfiguredQuestions(questions, questionCounts, roundMarks) };
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;
  try {
    const body = await request.json() as { action?: string; confirmation?: string };
    let event = await prisma.event.findUnique({ where: { id: "main" } });
    if (!event) return NextResponse.json({ error: "Event setup is missing. Run the database seed first." }, { status: 503 });
    if (event.status === EventStatus.RUNNING && event.endsAt && event.endsAt <= new Date()) {
      event = await prisma.event.update({ where: { id: "main" }, data: { status: EventStatus.ENDED } });
    }

    if (body.action === "settings") {
      if (event.status !== EventStatus.DRAFT) return NextResponse.json({ error: "Reset the event before changing its active configuration." }, { status: 409 });
      const settings = eventSettingsSchema.safeParse(body);
      if (!settings.success) return NextResponse.json({ error: settings.error.issues[0]?.message ?? "Invalid event settings." }, { status: 400 });
      const updated = await prisma.event.update({ where: { id: "main" }, data: { title: settings.data.title, durationMinutes: settings.data.durationMinutes, questionCounts: settings.data.questionCounts, roundMarks: settings.data.roundMarks, totalMarks: totalConfiguredMarks(settings.data.roundMarks), negativeMarkingEnabled: settings.data.negativeMarkingEnabled, negativeMarkingValue: settings.data.negativeMarkingEnabled ? settings.data.negativeMarkingValue : 0, allowAnswerRevision: settings.data.allowAnswerRevision, studentScoreVisible: settings.data.studentScoreVisible, correctnessFeedbackVisible: settings.data.correctnessFeedbackVisible, liveLeaderboardVisible: settings.data.liveLeaderboardVisible } });
      return NextResponse.json({ event: updated });
    }

    if (body.action === "start") {
      if (event.status !== EventStatus.DRAFT) return NextResponse.json({ error: "This event has already started or ended. Reset it before starting again." }, { status: 409 });
      const durationMinutes = event.durationMinutes;
      if (!Number.isInteger(durationMinutes) || !durationMinutes || durationMinutes < 1 || durationMinutes > 1440) return NextResponse.json({ error: "Configure a valid event time limit before starting." }, { status: 409 });
      const { roundMarks, selected } = await configuredSet(event);
      const startsAt = new Date();
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);
      const updated = await prisma.event.update({ where: { id: "main" }, data: { status: EventStatus.RUNNING, startsAt, endsAt, activeQuestionIds: selected, totalMarks: totalConfiguredMarks(roundMarks), resultsFinalized: false, finalizedAt: null, leaderboardReleased: false } });
      return NextResponse.json({ event: updated });
    }

    if (body.action === "end") {
      if (event.status !== EventStatus.RUNNING) return NextResponse.json({ error: "Only a running event can be ended." }, { status: 409 });
      const updated = await prisma.event.update({ where: { id: "main" }, data: { status: EventStatus.ENDED, endsAt: new Date() } });
      return NextResponse.json({ event: updated });
    }

    if (body.action === "advance") {
      if (event.status !== EventStatus.RUNNING) return NextResponse.json({ error: "Teams can only be advanced while the event is running." }, { status: 409 });
      const active = readActiveQuestionIds(event.activeQuestionIds);
      const advanced = await prisma.$transaction(async (tx) => {
        const teams = await tx.team.findMany({ where: { currentLevel: { lte: 5 } }, select: { id: true, currentLevel: true } });
        let count = 0;
        for (const team of teams) {
          const ids = active[team.currentLevel] ?? [];
          if (!ids.length) continue;
          const submitted = await tx.submission.count({ where: { teamId: team.id, questionId: { in: ids } } });
          if (submitted !== ids.length) continue;
          const levelScore = await tx.submission.aggregate({ where: { teamId: team.id, questionId: { in: ids } }, _sum: { awardedPoints: true } });
          await tx.levelProgress.upsert({ where: { teamId_level: { teamId: team.id, level: team.currentLevel } }, create: { teamId: team.id, level: team.currentLevel, score: levelScore._sum.awardedPoints ?? 0 }, update: { score: levelScore._sum.awardedPoints ?? 0 } });
          await tx.team.update({ where: { id: team.id }, data: { currentLevel: Math.min(team.currentLevel + 1, 6) } });
          count += 1;
        }
        return count;
      });
      return NextResponse.json({ advanced });
    }

    if (body.action === "finalize") {
      if (event.status !== EventStatus.ENDED) return NextResponse.json({ error: "End the event before finalizing results." }, { status: 409 });
      const finalized = await prisma.$transaction(async (tx) => {
        const scores = await tx.submission.groupBy({ by: ["teamId"], _sum: { awardedPoints: true } });
        const scoreByTeam = new Map(scores.map((score) => [score.teamId, score._sum.awardedPoints ?? 0]));
        const teams = await tx.team.findMany({ select: { id: true } });
        await Promise.all(teams.map((team) => tx.team.update({ where: { id: team.id }, data: { totalScore: scoreByTeam.get(team.id) ?? 0 } })));
        return tx.event.update({ where: { id: "main" }, data: { resultsFinalized: true, finalizedAt: new Date(), leaderboardReleased: false } });
      });
      return NextResponse.json({ event: finalized });
    }

    if (body.action === "release") {
      if (event.status !== EventStatus.ENDED) return NextResponse.json({ error: "End the event before releasing results." }, { status: 409 });
      if (!event.resultsFinalized) return NextResponse.json({ error: "Finalize results before releasing the public leaderboard." }, { status: 409 });
      const updated = await prisma.event.update({ where: { id: "main" }, data: { leaderboardReleased: true } });
      return NextResponse.json({ event: updated });
    }

    if (body.action === "hide") {
      const updated = await prisma.event.update({ where: { id: "main" }, data: { leaderboardReleased: false } });
      return NextResponse.json({ event: updated });
    }

    if (body.action === "reset") {
      if (body.confirmation !== "RESET EVENT") return NextResponse.json({ error: "Type RESET EVENT to confirm this operation." }, { status: 400 });
      await prisma.$transaction(async (tx) => {
        await tx.session.deleteMany({ where: { teamId: { not: null } } });
        await tx.submission.deleteMany();
        await tx.levelProgress.deleteMany();
        await tx.team.updateMany({ data: { totalScore: 0, currentLevel: 1, lastSubmissionAt: null } });
        await tx.event.update({ where: { id: "main" }, data: resetEventData });
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "clear") {
      if (body.confirmation !== "CLEAR ALL EVENT DATA") return NextResponse.json({ error: "Type CLEAR ALL EVENT DATA to confirm this operation." }, { status: 400 });
      await prisma.$transaction(async (tx) => {
        await tx.loginAudit.deleteMany({ where: { actorType: LoginActor.TEAM } });
        await tx.session.deleteMany({ where: { teamId: { not: null } } });
        await tx.submission.deleteMany();
        await tx.levelProgress.deleteMany();
        await tx.team.deleteMany();
        await tx.event.update({ where: { id: "main" }, data: resetEventData });
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown event action." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error && error.message.startsWith("Level ") ? error.message : "We could not update the event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
