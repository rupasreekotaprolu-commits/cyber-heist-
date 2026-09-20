import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { questionSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({ where: { id: "main" }, select: { status: true } });
    if (event?.status !== EventStatus.DRAFT) return NextResponse.json({ error: "Questions are locked after the event starts. Reset the event to edit them." }, { status: 409 });
    const parsed = questionSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid question." }, { status: 400 });
    const question = await prisma.question.update({ where: { id }, data: { ...parsed.data, options: parsed.data.options ?? undefined } });
    return NextResponse.json({ question });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") return NextResponse.json({ error: "Question not found." }, { status: 404 });
    if ((error as { code?: string }).code === "P2002") return NextResponse.json({ error: "Question code already exists." }, { status: 409 });
    return NextResponse.json({ error: "We could not update the question." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  try {
    const event = await prisma.event.findUnique({ where: { id: "main" }, select: { status: true } });
    if (event?.status !== EventStatus.DRAFT) return NextResponse.json({ error: "Questions are locked after the event starts. Reset the event to edit them." }, { status: 409 });
    await prisma.question.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "P2025") return NextResponse.json({ error: "Question not found." }, { status: 404 });
    return NextResponse.json({ error: "We could not delete the question." }, { status: 500 });
  }
}
