import { NextResponse } from "next/server";
import { getCurrentTeam } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitAnswer } from "@/lib/submissions";
import { answerSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const team = await getCurrentTeam();
  if (!team) return NextResponse.json({ error: "Please sign in with your team first." }, { status: 401 });
  try {
    const parsed = answerSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid answer." }, { status: 400 });
    const result = await submitAnswer(team.id, parsed.data.questionId, parsed.data.answer);
    if (!result.ok) return NextResponse.json(result, { status: 400 });
    const event = await prisma.event.findUnique({ where: { id: "main" }, select: { correctnessFeedbackVisible: true, studentScoreVisible: true } });
    return NextResponse.json({
      ok: true,
      levelComplete: result.levelComplete,
      message: result.message,
      ...(event?.correctnessFeedbackVisible ? { correct: result.correct } : {}),
      ...(event?.studentScoreVisible ? { totalScore: result.totalScore } : {}),
    });
  } catch {
    return NextResponse.json({ error: "We could not save that answer. Please try again." }, { status: 500 });
  }
}
