import { z } from "zod";

export const questionSchema = z.object({
  id: z.string(),
  number: z.number(),
  text: z.string(),
  options: z.array(z.object({
    letter: z.string(),
    text: z.string(),
  })),
  correctAnswer: z.string(),
  explanation: z.string(),
  sourceFile: z.string(),
  blockIndex: z.number(),
  isDivergent: z.boolean().optional(),
  explanationAnswer: z.string().nullable().optional(),
});

export type Question = z.infer<typeof questionSchema>;

export const questionProgressSchema = z.object({
  questionId: z.string(),
  selectedAnswer: z.string().nullable(),
  isCorrect: z.boolean().nullable(),
  isMarkedForReview: z.boolean(),
  comment: z.string(),
  timeSpent: z.number(),
  answeredAt: z.string().nullable(),
});

export type QuestionProgress = z.infer<typeof questionProgressSchema>;

export const questionBlockSchema = z.object({
  id: z.string(),
  sourceFile: z.string(),
  startIndex: z.number(),
  endIndex: z.number(),
  questionIds: z.array(z.string()),
});

export type QuestionBlock = z.infer<typeof questionBlockSchema>;

export const examStateSchema = z.object({
  questions: z.array(questionSchema),
  blocks: z.array(questionBlockSchema),
  progress: z.record(z.string(), questionProgressSchema),
  currentQuestionId: z.string().nullable(),
  lastUpdated: z.string(),
});

export type ExamState = z.infer<typeof examStateSchema>;

export const statisticsSchema = z.object({
  totalQuestions: z.number(),
  answeredQuestions: z.number(),
  correctAnswers: z.number(),
  incorrectAnswers: z.number(),
  markedForReview: z.number(),
  divergentQuestions: z.number(),
  averageTimePerQuestion: z.number(),
  percentCorrect: z.number(),
  percentIncorrect: z.number(),
  percentUnanswered: z.number(),
});

export type Statistics = z.infer<typeof statisticsSchema>;

export const exportProgressSchema = z.object({
  version: z.string(),
  exportedAt: z.string(),
  progress: z.array(z.object({
    questionId: z.string(),
    questionNumber: z.number(),
    selectedAnswer: z.string().nullable(),
    isCorrect: z.boolean().nullable(),
    comment: z.string(),
  })),
  currentQuestionId: z.string().nullable(),
});

export type ExportProgress = z.infer<typeof exportProgressSchema>;

export const insertQuestionSchema = questionSchema.omit({ id: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;

export const users = {} as any;
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
