export interface Option {
  id: string;
  text: string;
  label: string; // 'A', 'B', 'C', 'D'
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswerLabel: string; // 'A'
  explanation?: string;
}

export interface QuizBlock {
  id: string;
  provider?: string;
  fileName: string;
  timestamp: number;
  questions: Question[];
  title: string;
  description?: string;
  workplace_id?: string;
}

export interface Workplace {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  quizzes: QuizBlock[];
}

export interface UserProgress {
  selectedAnswer: string | null; // Option ID
  isFlaggedDisagreeKey: boolean;
  isFlaggedDisagreeAI: boolean;
  aiAnalysis: string | null;
}

// Map questionId -> Progress
export type UserSession = Record<string, UserProgress>;

export enum AppView {
  QUIZ = 'QUIZ',
  UPLOAD = 'UPLOAD',
  EXAM_SELECT = 'EXAM_SELECT',
  REWARDS = 'REWARDS',
  STUDY_GROUPS = 'STUDY_GROUPS',
  LANDING = 'LANDING',
  MY_EXAMS = 'MY_EXAMS',
  QUADRO_GERAL = 'QUADRO_GERAL',
  PRICING = 'PRICING',
}

export interface User {
  id: string;
  username: string;
  email?: string;
  full_name?: string;
  is_premium: boolean;
  premium_until?: string;
}

export interface Stats {
  correct: number;
  incorrect: number;
  skipped: number;
  flagged: number;
  total: number;
}

export interface CommunityNote {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  visibility?: 'public' | 'group';
  shared_with?: string[];
}
