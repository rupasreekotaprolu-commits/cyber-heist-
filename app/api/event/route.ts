import { NextResponse } from "next/server";
import { getEventState } from "@/lib/event";

export async function GET() {
  const { state, event } = await getEventState();
  return NextResponse.json({
    state,
    endsAt: event?.endsAt?.toISOString() ?? null,
    durationMinutes: event?.durationMinutes ?? null,
  });
}
