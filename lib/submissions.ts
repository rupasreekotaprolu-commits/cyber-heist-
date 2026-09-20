import { Prisma } from "@prisma/client";
import { readActiveQuestionIds } from "@/lib/event-config";
import { prisma } from "@/lib/prisma";

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

export async function submitAnswer(teamId: string, questionId: string, answer: string) {
  const now = new Date();
  const event = await prisma.event.findUnique({ where: { id: "main" } });
  if (!event?.startsAt || !event.endsAt || event.status !== "RUNNING") {
    return { ok: false as const, error: "The event has not started." };
  }
  if (event.endsAt <= now) return { ok: false as const, error: "The event has ended. Submissions are closed." };

  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question?.published) return { ok: false as const, error: "That question is not available." };
  const active = readActiveQuestionIds(event.activeQuestionIds);
  if (!active[question.level]?.includes(question.id)) return { ok: false as const, error: "That question is not part of this event." };

  const processSubmission = () => prisma.$transaction(async (tx) => {
    const currentEvent = await tx.event.findUnique({ where: { id: "main" } });
    if (!currentEvent?.endsAt || currentEvent.status !== "RUNNING" || currentEvent.endsAt <= new Date()) {
      return { ok: false as const, error: "The event has ended. Submissions are closed." };
    }
    if (!readActiveQuestionIds(currentEvent.activeQuestionIds)[question.level]?.includes(question.id)) {
      return { ok: false as const, error: "That question is not part of this event." };
    }
    const team = await tx.team.findUnique({ where: { id: teamId } });
    if (!team) return { ok: false as const, error: "Your team session is no longer valid." };
    if (team.currentLevel !== question.level) {
      return { ok: false as const, error: "Complete the current level before submitting this question." };
    }

    const prior = await tx.submission.findUnique({ where: { teamId_questionId: { teamId, questionId } } });
    if (prior && !currentEvent.allowAnswerRevision) return { ok: false as const, error: "This answer has already been submitted." };
    const correct = normalize(answer) === normalize(question.correctAnswer);
    const awardedPoints = correct ? question.points : currentEvent.negativeMarkingEnabled ? -currentEvent.negativeMarkingValue : 0;
    await tx.submission.upsert({
      where: { teamId_questionId: { teamId, questionId } },
      create: { teamId, questionId, answer, isCorrect: correct, awardedPoints },
      update: { answer, isCorrect: correct, awardedPoints, submittedAt: now },
    });

    const [activeQuestions, correctSubmissions, total] = await Promise.all([
      tx.question.findMany({ where: { id: { in: active[question.level] }, published: true }, select: { id: true, points: true } }),
      tx.submission.findMany({ where: { teamId, questionId: { in: active[question.level] } }, select: { questionId: true } }),
      tx.submission.aggregate({ where: { teamId }, _sum: { awardedPoints: true } }),
    ]);
    const submittedIds = new Set(correctSubmissions.map((submission) => submission.questionId));
    const levelComplete = activeQuestions.length > 0 && activeQuestions.every((item) => submittedIds.has(item.id));
    if (levelComplete) {
      const levelScore = await tx.submission.aggregate({ where: { teamId, questionId: { in: active[question.level] } }, _sum: { awardedPoints: true } });
      await tx.levelProgress.upsert({
        where: { teamId_level: { teamId, level: question.level } },
        create: { teamId, level: question.level, score: levelScore._sum.awardedPoints ?? 0 },
        update: { score: levelScore._sum.awardedPoints ?? 0 },
      });
    }
    const updated = await tx.team.update({
      where: { id: teamId },
      data: { totalScore: total._sum.awardedPoints ?? 0, lastSubmissionAt: now },
      select: { totalScore: true, currentLevel: true },
    });

    return {
      ok: true as const,
      correct,
      levelComplete,
      totalScore: updated.totalScore,
      currentLevel: updated.currentLevel,
      message: levelComplete ? "Level submitted. Waiting for the administrator to unlock the next level." : "Answer submitted.",
    };
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await processSubmission();
    } catch (error) {
      if ((error as { code?: string }).code !== "P2034" || attempt === 2) throw error;
    }
  }
  return { ok: false as const, error: "A simultaneous team submission is being processed. Please try again." };
}
