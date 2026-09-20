import { z } from "zod";

export const registerTeamSchema = z.object({
  name: z.string().trim().min(3, "Team name must have at least 3 characters.").max(60),
  section: z.string().trim().max(80).optional().or(z.literal("")),
  members: z.array(z.string().trim().min(2, "Each member name must have at least 2 characters.").max(80)).length(4),
});

export const teamLoginSchema = z.object({
  teamId: z.string().trim().min(4).max(24),
  accessCode: z.string().trim().min(6).max(32),
});

export const answerSchema = z.object({
  questionId: z.string().cuid(),
  answer: z.string().trim().min(1, "Select or enter an answer.").max(500),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(200),
});

export const questionSchema = z.object({
  code: z.string().trim().min(3).max(48).regex(/^[A-Za-z0-9_-]+$/, "Use only letters, numbers, hyphens, and underscores in the code."),
  level: z.coerce.number().int().min(1).max(5),
  theme: z.string().trim().min(2).max(100),
  category: z.string().trim().min(2).max(100),
  topic: z.string().trim().min(2).max(100),
  difficulty: z.string().trim().min(2).max(40),
  questionText: z.string().trim().min(10).max(6000),
  options: z.array(z.string().trim().min(1).max(500)).min(2).max(8).optional(),
  correctAnswer: z.string().trim().min(1).max(500),
  points: z.coerce.number().int().min(1).max(100),
  type: z.enum(["MCQ", "SHORT_ANSWER"]),
  sortOrder: z.coerce.number().int().min(1).max(99),
  published: z.boolean(),
});

const levelMapSchema = z.object({
  "1": z.coerce.number().int().min(1).max(50),
  "2": z.coerce.number().int().min(1).max(50),
  "3": z.coerce.number().int().min(1).max(50),
  "4": z.coerce.number().int().min(1).max(50),
  "5": z.coerce.number().int().min(1).max(50),
});

const roundMarksSchema = z.object({
  "1": z.coerce.number().int().min(1).max(500),
  "2": z.coerce.number().int().min(1).max(500),
  "3": z.coerce.number().int().min(1).max(500),
  "4": z.coerce.number().int().min(1).max(500),
  "5": z.coerce.number().int().min(1).max(500),
});

export const eventSettingsSchema = z.object({
  title: z.string().trim().min(3).max(120),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  questionCounts: levelMapSchema,
  roundMarks: roundMarksSchema,
  negativeMarkingEnabled: z.boolean(),
  negativeMarkingValue: z.coerce.number().int().min(0).max(100),
  allowAnswerRevision: z.boolean(),
  studentScoreVisible: z.boolean(),
  correctnessFeedbackVisible: z.boolean(),
  liveLeaderboardVisible: z.boolean(),
}).superRefine((settings, context) => {
  if (settings.negativeMarkingEnabled && settings.negativeMarkingValue < 1) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "Set a negative-mark value greater than zero, or disable negative marking.", path: ["negativeMarkingValue"] });
  }
});

export const teamAdminUpdateSchema = z.object({
  name: z.string().trim().min(3).max(60),
  section: z.string().trim().max(80).nullable(),
  members: z.array(z.string().trim().min(2).max(80)).length(4),
  totalScore: z.coerce.number().int().min(0).max(10000),
  currentLevel: z.coerce.number().int().min(1).max(6),
});
