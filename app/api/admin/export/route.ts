import { requireAdminApi } from "@/lib/admin";
import { prisma } from "@/lib/prisma";

function escapeCsv(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;
  const teams = await prisma.team.findMany({
    include: { members: { orderBy: { createdAt: "asc" } } },
    orderBy: [{ totalScore: "desc" }, { lastSubmissionAt: "asc" }, { name: "asc" }],
  });
  const rows = [
    ["Rank", "Team name", "Team ID", "Score", "Current level", "Members"],
    ...teams.map((team, index) => [index + 1, team.name, team.teamId, team.totalScore, team.currentLevel > 5 ? "Complete" : team.currentLevel, team.members.map((member) => member.name).join(" | ")]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=cyber-heist-results.csv",
    },
  });
}
