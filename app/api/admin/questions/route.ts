import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validation";

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  const questions = await prisma.question.findMany({ orderBy: [{ level: "asc" }, { sortOrder: "asc" }] });
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;
  try {
    const event = await prisma.event.findUnique({ where: { id: "main" }, select: { status: true } });
    if (event?.status !== EventStatus.DRAFT) return NextResponse.json({ error: "Questions are locked after the event starts. Reset the event to edit them." }, { status: 409 });
    const parsed = questionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid question." }, { status: 400 });
    const question = await prisma.question.create({ data: { ...parsed.data, options: parsed.data.options ?? undefined } });
    return NextResponse.json({ question }, { status: 201 });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "Question code already exists." }, { status: 409 });
    return NextResponse.json({ error: "We could not save the question." }, { status: 500 });
  }
}
