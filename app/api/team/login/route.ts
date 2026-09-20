import bcrypt from "bcryptjs";
import { LoginActor } from "@prisma/client";
import { NextResponse } from "next/server";
import { createTeamSession, recordLoginAttempt, setTeamSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teamLoginSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = teamLoginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter your Team ID and access code." }, { status: 400 });
    const team = await prisma.team.findUnique({ where: { teamId: parsed.data.teamId.toUpperCase() } });
    if (!team || !(await bcrypt.compare(parsed.data.accessCode.toUpperCase(), team.accessCodeHash))) {
      await recordLoginAttempt(LoginActor.TEAM, false, team?.id);
      return NextResponse.json({ error: "The Team ID or access code is incorrect." }, { status: 401 });
    }
    await recordLoginAttempt(LoginActor.TEAM, true, team.id);
    const session = await createTeamSession(team.id);
    const response = NextResponse.json({ teamName: team.name, teamId: team.teamId });
    setTeamSession(response, session.token, session.seconds);
    return response;
  } catch (error) {
    const failure = error as { code?: string; name?: string };
    console.error("Team login failed.", { code: failure.code ?? null, name: failure.name ?? "UnknownError" });
    return NextResponse.json({ error: "We could not sign your team in. Please try again." }, { status: 500 });
  }
}
