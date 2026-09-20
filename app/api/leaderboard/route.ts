import { NextResponse } from "next/server";
import { EventStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const event = await prisma.event.findUnique({ where: { id: "main" }, select: { status: true, resultsFinalized: true, leaderboardReleased: true, liveLeaderboardVisible: true } });
  const releasedResults = event?.status === EventStatus.ENDED && event.resultsFinalized && event.leaderboardReleased;
  const liveLeaderboard = event?.status === EventStatus.RUNNING && event.liveLeaderboardVisible;
  if (!releasedResults && !liveLeaderboard) {
    return NextResponse.json({ error: "The leaderboard is not available yet." }, { status: 403 });
  }
  const teams = await prisma.team.findMany({
    select: { name: true, teamId: true, totalScore: true, currentLevel: true, lastSubmissionAt: true },
    orderBy: [{ totalScore: "desc" }, { lastSubmissionAt: "asc" }, { name: "asc" }],
  });
  return NextResponse.json({
    teams: teams.map((team, index) => ({
      rank: index + 1,
      name: team.name,
      teamId: team.teamId,
      score: team.totalScore,
      progress: team.currentLevel > 5 ? "Mission complete" : `Level ${team.currentLevel} unlocked`,
    })),
  });
}
