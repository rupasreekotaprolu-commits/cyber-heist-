import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { LoginActor } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const TEAM_COOKIE = "cyber_heist_team";
const ADMIN_COOKIE = "cyber_heist_admin";
const SESSION_HOURS = 12;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieSettings(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

async function createSession(kind: "team" | "admin", ownerId: string) {
  const token = randomBytes(32).toString("base64url");
  const seconds = SESSION_HOURS * 60 * 60;
  await prisma.session.create({
    data: {
      tokenHash: tokenHash(token),
      expiresAt: new Date(Date.now() + seconds * 1000),
      ...(kind === "team" ? { teamId: ownerId } : { adminId: ownerId }),
    },
  });
  return { token, seconds };
}

export async function createTeamSession(teamId: string) {
  return createSession("team", teamId);
}

export async function createAdminSession(adminId: string) {
  return createSession("admin", adminId);
}

export async function recordLoginAttempt(actorType: LoginActor, succeeded: boolean, actorId?: string) {
  await prisma.loginAudit.create({
    data: {
      actorType,
      succeeded,
      ...(actorType === LoginActor.TEAM && actorId ? { teamId: actorId } : {}),
      ...(actorType === LoginActor.ADMIN && actorId ? { adminId: actorId } : {}),
    },
  });
}

export function setTeamSession(response: NextResponse, token: string, maxAge: number) {
  response.cookies.set(TEAM_COOKIE, token, cookieSettings(maxAge));
}

export function setAdminSession(response: NextResponse, token: string, maxAge: number) {
  response.cookies.set(ADMIN_COOKIE, token, cookieSettings(maxAge));
}

export function clearTeamSession(response: NextResponse) {
  response.cookies.set(TEAM_COOKIE, "", { ...cookieSettings(0), maxAge: 0 });
}

export function clearAdminSession(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", { ...cookieSettings(0), maxAge: 0 });
}

async function getSessionToken(cookieName: string) {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  return tokenHash(token);
}

export async function getCurrentTeam() {
  const hash = await getSessionToken(TEAM_COOKIE);
  if (!hash) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: hash },
    include: { team: { include: { members: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session?.team ?? null;
}

export async function getCurrentAdmin() {
  const hash = await getSessionToken(ADMIN_COOKIE);
  if (!hash) return null;
  const session = await prisma.session.findUnique({ where: { tokenHash: hash }, include: { admin: true } });
  if (!session || session.expiresAt <= new Date()) return null;
  return session?.admin ?? null;
}

export async function deleteSessionFromCookie(kind: "team" | "admin") {
  const cookieName = kind === "team" ? TEAM_COOKIE : ADMIN_COOKIE;
  const token = (await cookies()).get(cookieName)?.value;
  if (token) await prisma.session.deleteMany({ where: { tokenHash: tokenHash(token) } });
}
