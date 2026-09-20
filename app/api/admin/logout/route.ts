import { NextResponse } from "next/server";
import { clearAdminSession, deleteSessionFromCookie } from "@/lib/auth";

export async function POST() {
  await deleteSessionFromCookie("admin");
  const response = NextResponse.json({ ok: true });
  clearAdminSession(response);
  return response;
}
