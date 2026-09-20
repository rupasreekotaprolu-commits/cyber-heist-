import bcrypt from "bcryptjs";
import { LoginActor } from "@prisma/client";
import { NextResponse } from "next/server";
import { createAdminSession, recordLoginAttempt, setAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminLoginSchema } from "@/lib/validation";

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function POST(request: Request) {
  const key = clientAddress(request);
  const now = Date.now();
  const record = attempts.get(key);
  if (record && record.resetAt > now && record.count >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts. Wait 10 minutes and try again." }, { status: 429 });
  }
  try {
    const parsed = adminLoginSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });
    const admin = await prisma.admin.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    if (!admin || !(await bcrypt.compare(parsed.data.password, admin.passwordHash))) {
      await recordLoginAttempt(LoginActor.ADMIN, false, admin?.id);
      attempts.set(key, { count: record?.resetAt && record.resetAt > now ? record.count + 1 : 1, resetAt: now + WINDOW_MS });
      return NextResponse.json({ error: "Invalid administrator credentials." }, { status: 401 });
    }
    attempts.delete(key);
    await recordLoginAttempt(LoginActor.ADMIN, true, admin.id);
    const session = await createAdminSession(admin.id);
    const response = NextResponse.json({ ok: true });
    setAdminSession(response, session.token, session.seconds);
    return response;
  } catch (error) {
    const failure = error as { code?: string; name?: string };
    console.error("Administrator login failed.", { code: failure.code ?? null, name: failure.name ?? "UnknownError" });
    return NextResponse.json({ error: "We could not sign you in. Please try again." }, { status: 500 });
  }
}
