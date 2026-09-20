import { Question } from "@prisma/client";

export const LEVELS = [1, 2, 3, 4, 5] as const;
export type LevelMap = Record<number, number>;

export const DEFAULT_QUESTION_COUNTS: LevelMap = { 1: 5, 2: 5, 3: 5, 4: 1, 5: 5 };
export const DEFAULT_ROUND_MARKS: LevelMap = { 1: 40, 2: 50, 3: 60, 4: 80, 5: 100 };

export function readLevelMap(value: unknown, fallback: LevelMap): LevelMap {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...fallback };
  const record = value as Record<string, unknown>;
  const result = {} as LevelMap;
  for (const level of LEVELS) {
    const candidate = record[String(level)];
    result[level] = typeof candidate === "number" && Number.isInteger(candidate) && candidate > 0 ? candidate : fallback[level];
  }
  return result;
}

export function readActiveQuestionIds(value: unknown): Record<number, string[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const record = value as Record<string, unknown>;
  const result: Record<number, string[]> = {};
  for (const level of LEVELS) {
    const ids = record[String(level)];
    result[level] = Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  }
  return result;
}

export function selectConfiguredQuestions(questions: Pick<Question, "id" | "level" | "points" | "sortOrder">[], questionCounts: LevelMap, roundMarks: LevelMap) {
  const selected: Record<number, string[]> = {};
  for (const level of LEVELS) {
    const choices = questions.filter((question) => question.level === level).sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id));
    if (choices.length < questionCounts[level]) throw new Error(`Level ${level} needs ${questionCounts[level]} published questions, but only ${choices.length} are available.`);
    const active = choices.slice(0, questionCounts[level]);
    const points = active.reduce((sum, question) => sum + question.points, 0);
    if (points !== roundMarks[level]) throw new Error(`Level ${level} selected questions total ${points} points, not the configured ${roundMarks[level]} points.`);
    selected[level] = active.map((question) => question.id);
  }
  return selected;
}

export function totalConfiguredMarks(roundMarks: LevelMap) {
  return LEVELS.reduce((total, level) => total + roundMarks[level], 0);
}
