import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { createTeamSession, setTeamSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerTeamSchema } from "@/lib/validation";

function makeTeamId() {
  return `CH-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function makeAccessCode() {
  return randomBytes(5).toString("base64url").slice(0, 8).toUpperCase();
}

export async function POST(request: Request) {
  try {
    const parsed = registerTeamSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid team details." }, { status: 400 });
    const memberNames = parsed.data.members.map((name) => name.trim());
    if (new Set(memberNames.map((name) => name.toLocaleLowerCase())).size !== 4) {
      return NextResponse.json({ error: "Enter four different member names." }, { status: 400 });
    }
    const event = await prisma.event.findUnique({ where: { id: "main" } });
    if (!event) return NextResponse.json({ error: "Event setup is incomplete. Ask an organizer to run the database seed." }, { status: 503 });
    if (event.status !== EventStatus.DRAFT) return NextResponse.json({ error: "Registration is locked because the event has started." }, { status: 403 });

    const accessCode = makeAccessCode();
    const accessCodeHash = await bcrypt.hash(accessCode, 12);
    let team = null;
    for (let attempt = 0; attempt < 3 && !team; attempt += 1) {
      try {
        team = await prisma.team.create({
          data: {
            name: parsed.data.name,
            teamId: makeTeamId(),
            accessCodeHash,
            section: parsed.data.section || null,
            members: { create: memberNames.map((name) => ({ name })) },
          },
        });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (code === "P2002") {
          const existing = await prisma.team.findUnique({ where: { name: parsed.data.name }, select: { id: true } });
          if (existing) return NextResponse.json({ error: "A team with that name is already registered." }, { status: 409 });
          continue;
        }
        throw error;
      }
    }
    if (!team) return NextResponse.json({ error: "Could not create a unique Team ID. Please try again." }, { status: 503 });
    const session = await createTeamSession(team.id);
    const response = NextResponse.json({ teamId: team.teamId, accessCode, teamName: team.name }, { status: 201 });
    setTeamSession(response, session.token, session.seconds);
    return response;
  } catch (error) {
    const failure = error as { code?: string; name?: string };
    console.error("Team registration failed.", { code: failure.code ?? null, name: failure.name ?? "UnknownError" });
    return NextResponse.json({ error: "We could not register the team. Please try again." }, { status: 500 });
  }
}
