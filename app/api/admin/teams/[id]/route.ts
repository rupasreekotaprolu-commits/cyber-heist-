import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { teamAdminUpdateSchema } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  try {
    const parsed = teamAdminUpdateSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid team details." }, { status: 400 });
    const members = parsed.data.members.map((member) => member.trim());
    if (new Set(members.map((member) => member.toLocaleLowerCase())).size !== 4) return NextResponse.json({ error: "Enter four different member names." }, { status: 400 });
    const team = await prisma.$transaction(async (tx) => {
      await tx.teamMember.deleteMany({ where: { teamId: id } });
      return tx.team.update({
        where: { id },
        data: { name: parsed.data.name, section: parsed.data.section || null, totalScore: parsed.data.totalScore, currentLevel: parsed.data.currentLevel, members: { create: members.map((name) => ({ name })) } },
        include: { members: true },
      });
    });
    return NextResponse.json({ team });
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "P2002") return NextResponse.json({ error: "A team with that name already exists." }, { status: 409 });
    if (code === "P2025") return NextResponse.json({ error: "Team not found." }, { status: 404 });
    return NextResponse.json({ error: "We could not update the team." }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const { response } = await requireAdminApi();
  if (response) return response;
  const { id } = await params;
  try {
    const body = await request.json() as { confirmation?: string };
    if (body.confirmation !== "DELETE TEAM") return NextResponse.json({ error: "Type DELETE TEAM to confirm this operation." }, { status: 400 });
    await prisma.$transaction(async (tx) => {
      const found = await tx.team.findUnique({ where: { id }, select: { id: true } });
      if (!found) throw new Error("NOT_FOUND");
      await tx.loginAudit.deleteMany({ where: { teamId: id } });
      await tx.session.deleteMany({ where: { teamId: id } });
      await tx.submission.deleteMany({ where: { teamId: id } });
      await tx.levelProgress.deleteMany({ where: { teamId: id } });
      await tx.teamMember.deleteMany({ where: { teamId: id } });
      await tx.team.delete({ where: { id } });
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Team not found." }, { status: 404 });
    return NextResponse.json({ error: "We could not delete the team." }, { status: 500 });
  }
}
