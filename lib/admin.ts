import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";

export async function requireAdminApi() {
  const admin = await getCurrentAdmin();
  if (!admin) return { admin: null, response: NextResponse.json({ error: "Unauthorized administrator request." }, { status: 401 }) };
  return { admin, response: null };
}
