import { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type EventState = "NOT_STARTED" | "RUNNING" | "ENDED";

export async function getEventState() {
  const event = await prisma.event.findUnique({ where: { id: "main" } });
  if (!event || event.status === EventStatus.DRAFT || !event.startsAt || !event.endsAt) {
    return { state: "NOT_STARTED" as EventState, event };
  }
  if (event.status === EventStatus.ENDED) {
    return { state: "ENDED" as EventState, event };
  }
  if (event.endsAt <= new Date()) {
    await prisma.event.updateMany({ where: { id: event.id, status: EventStatus.RUNNING, endsAt: { lte: new Date() } }, data: { status: EventStatus.ENDED } });
    return { state: "ENDED" as EventState, event: { ...event, status: EventStatus.ENDED } };
  }
  return { state: "RUNNING" as EventState, event };
}

export async function requireRunningEvent() {
  const result = await getEventState();
  if (result.state !== "RUNNING" || !result.event?.endsAt) return result;
  return result;
}
