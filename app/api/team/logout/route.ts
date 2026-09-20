import { NextResponse } from "next/server";
import { clearTeamSession, deleteSessionFromCookie } from "@/lib/auth";

export async function POST() {
  await deleteSessionFromCookie("team");
  const response = NextResponse.json({ ok: true });
  clearTeamSession(response);
  return response;
}
