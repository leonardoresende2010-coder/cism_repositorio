import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Question, QuestionProgress, QuestionBlock, Statistics, ExamState } from "@shared/schema";

interface ExamContextType {
  questions: Question[];
  blocks: QuestionBlock[];
  progress: Record<string, QuestionProgress>;
  currentQuestionId: string | null;
  selectedBlockId: string | null;
  isLoading: boolean;
  statistics: Statistics;
  
  setQuestions: (questions: Question[], blocks: QuestionBlock[]) => void;
  setCurrentQuestion: (id: string) => void;
  selectBlock: (blockId: string) => void;
  exitBlock: () => void;
  getBlockQuestions: (blockId: string) => Question[];
  getBlockProgress: (blockId: string) => { total: number; answered: number; correct: number; incorrect: number };
  submitAnswer: (questionId: string, answer: string) => void;
  toggleMarkForReview: (questionId: string) => void;
  updateComment: (questionId: string, comment: string) => void;
  resetQuestion: (questionId: string) => void;
  resetAllProgress: () => void;
  importProgress: (data: any) => void;
  getExportData: () => any;
  getIncorrectQuestions: () => Question[];
  goToNextQuestion: () => void;
  goToPreviousQuestion: () => void;
  filterMode: "all" | "flagged" | "incorrect" | "unanswered";
  setFilterMode: (mode: "all" | "flagged" | "incorrect" | "unanswered") => void;
  markQuestionDivergent: (questionId: string, isDivergent: boolean) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const STORAGE_KEY = "cism-exam-state";

function createInitialProgress(questionId: string): QuestionProgress {
  return {
    questionId,
    selectedAnswer: null,
    isCorrect: null,
    isMarkedForReview: false,
    comment: "",
    timeSpent: 0,
    answeredAt: null,
  };
}

function calculateStatistics(
  questions: Question[],
  progress: Record<string, QuestionProgress>
): Statistics {
  const totalQuestions = questions.length;
  let answeredQuestions = 0;
  let correctAnswers = 0;
  let incorrectAnswers = 0;
  let markedForReview = 0;
  let divergentQuestions = 0;
  let totalTime = 0;

  // Mapa de apoio para encontrar progresso por número de questão (caso o ID tenha mudado)
  const progressByNumber = new Map();
  Object.values(progress).forEach(p => {
    const q = questions.find(quest => quest.id === p.questionId);
    if (q) progressByNumber.set(q.number, p);
  });

  questions.forEach((q) => {
    if (q.isDivergent) divergentQuestions++;
    
    // Busca progresso por ID ou por Número da questão
    const p = progress[q.id] || progressByNumber.get(q.number);
    
    if (p && p.selectedAnswer !== null) {
      answeredQuestions++;
      
      // Validação em tempo real comparando o texto das respostas
      const isActuallyCorrect = p.selectedAnswer.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase();
      
      if (isActuallyCorrect) correctAnswers++;
      else incorrectAnswers++;
      
      if (p.isMarkedForReview) markedForReview++;
      totalTime += p.timeSpent;
    }
  });

  return {
    totalQuestions,
    answeredQuestions,
    correctAnswers,
    incorrectAnswers,
    markedForReview,
    divergentQuestions,
    averageTimePerQuestion: answeredQuestions > 0 ? totalTime / answeredQuestions : 0,
    percentCorrect: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    percentIncorrect: totalQuestions > 0 ? (incorrectAnswers / totalQuestions) * 100 : 0,
    percentUnanswered: totalQuestions > 0 ? ((totalQuestions - answeredQuestions) / totalQuestions) * 100 : 0,
  };
}

export function ExamProvider({ children }: { children: React.ReactNode }) {
  const [questions, setQuestionsState] = useState<Question[]>([]);
  const [blocks, setBlocks] = useState<QuestionBlock[]>([]);
  const [progress, setProgress] = useState<Record<string, QuestionProgress>>({});
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "flagged" | "incorrect" | "unanswered">("all");
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const statistics = calculateStatistics(questions, progress);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        setQuestionsState(state.questions || []);
        setBlocks(state.blocks || []);
        setProgress(state.progress || {});
        setCurrentQuestionId(state.currentQuestionId || null);
        setSelectedBlockId(state.selectedBlockId || null);
      }
    } catch (e) {
      console.error("Failed to load saved state:", e);
    }
  }, []);

  useEffect(() => {
    if (questions.length > 0) {
      const state = {
        questions,
        blocks,
        progress,
        currentQuestionId,
        selectedBlockId,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [questions, blocks, progress, currentQuestionId, selectedBlockId]);

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionId]);

  const setQuestions = useCallback((newQuestions: Question[], newBlocks: QuestionBlock[]) => {
    setQuestionsState(newQuestions);
    setBlocks(newBlocks);
    setSelectedBlockId(null);
    setCurrentQuestionId(null);
    
    const newProgress: Record<string, QuestionProgress> = {};
    newQuestions.forEach((q) => {
      newProgress[q.id] = progress[q.id] || createInitialProgress(q.id);
    });
    setProgress(newProgress);
  }, [progress]);

  const setCurrentQuestion = useCallback((id: string) => {
    if (currentQuestionId && progress[currentQuestionId]) {
      const timeSpent = (Date.now() - questionStartTime) / 1000;
      setProgress((prev) => ({
        ...prev,
        [currentQuestionId]: {
          ...prev[currentQuestionId],
          timeSpent: prev[currentQuestionId].timeSpent + timeSpent,
        },
      }));
    }
    setCurrentQuestionId(id);
  }, [currentQuestionId, progress, questionStartTime]);

  const submitAnswer = useCallback((questionId: string, answer: string) => {
    const question = questions.find((q) => q.id === questionId);
    if (!question) return;

    const isCorrect = question.correctAnswer.trim().toUpperCase() === answer.trim().toUpperCase();
    const timeSpent = (Date.now() - questionStartTime) / 1000;

    setProgress((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        selectedAnswer: answer,
        isCorrect,
        timeSpent: (prev[questionId]?.timeSpent || 0) + timeSpent,
        answeredAt: new Date().toISOString(),
      },
    }));
    setQuestionStartTime(Date.now());
  }, [questions, questionStartTime]);

  const toggleMarkForReview = useCallback((questionId: string) => {
    setProgress((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isMarkedForReview: !prev[questionId]?.isMarkedForReview,
      },
    }));
  }, []);

  const updateComment = useCallback((questionId: string, comment: string) => {
    setProgress((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        comment,
      },
    }));
  }, []);

  const resetQuestion = useCallback((questionId: string) => {
    setProgress((prev) => ({
      ...prev,
      [questionId]: createInitialProgress(questionId),
    }));
  }, []);

  const markQuestionDivergent = useCallback((questionId: string, isDivergent: boolean) => {
    setQuestionsState((prev) =>
      prev.map((q) =>
        q.id === questionId ? { ...q, isDivergent } : q
      )
    );
  }, []);

  const resetAllProgress = useCallback(() => {
    const newProgress: Record<string, QuestionProgress> = {};
    questions.forEach((q) => {
      newProgress[q.id] = createInitialProgress(q.id);
    });
    setProgress(newProgress);
    if (questions.length > 0) {
      setCurrentQuestionId(questions[0].id);
    }
  }, [questions]);

  const importProgress = useCallback((data: any) => {
    if (data.progress) {
      const newProgress: Record<string, QuestionProgress> = { ...progress };
      data.progress.forEach((p: any) => {
        // Tenta encontrar a questão por ID ou por Número para garantir compatibilidade Replit -> GitHub
        const targetQ = questions.find(q => q.id === p.questionId) || 
                        questions.find(q => q.number === p.questionNumber);

        if (targetQ) {
          newProgress[targetQ.id] = {
            ...createInitialProgress(targetQ.id),
            selectedAnswer: p.selectedAnswer,
            isCorrect: p.selectedAnswer?.trim().toUpperCase() === targetQ.correctAnswer.trim().toUpperCase(),
            comment: p.comment || "",
          };
        }
      });
      setProgress(newProgress);
    }
  }, [progress, questions]);

  const getExportData = useCallback(() => {
    return {
      version: "1.1",
      exportedAt: new Date().toISOString(),
      progress: questions.map((q) => {
        const p = progress[q.id];
        return {
          questionId: q.id,
          questionNumber: q.number,
          selectedAnswer: p?.selectedAnswer || null,
          isCorrect: p?.selectedAnswer?.trim().toUpperCase() === q.correctAnswer.trim().toUpperCase(),
          comment: p?.comment || "",
        };
      }),
      currentQuestionId,
    };
  }, [questions, progress, currentQuestionId]);

  const getIncorrectQuestions = useCallback(() => {
    return questions.filter((q) => {
      const p = progress[q.id];
      if (!p || p.selectedAnswer === null) return false;
      return p.selectedAnswer.trim().toUpperCase() !== q.correctAnswer.trim().toUpperCase();
    });
  }, [questions, progress]);

  const goToNextQuestion = useCallback(() => {
    if (!selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;
    const currentIndex = block.questionIds.indexOf(currentQuestionId || "");
    if (currentIndex >= 0 && currentIndex < block.questionIds.length - 1) {
      setCurrentQuestion(block.questionIds[currentIndex + 1]);
    }
  }, [blocks, selectedBlockId, currentQuestionId, setCurrentQuestion]);

  const goToPreviousQuestion = useCallback(() => {
    if (!selectedBlockId) return;
    const block = blocks.find((b) => b.id === selectedBlockId);
    if (!block) return;
    const currentIndex = block.questionIds.indexOf(currentQuestionId || "");
    if (currentIndex > 0) {
      setCurrentQuestion(block.questionIds[currentIndex - 1]);
    }
  }, [blocks, selectedBlockId, currentQuestionId, setCurrentQuestion]);

  const selectBlock = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block && block.questionIds.length > 0) {
      setSelectedBlockId(blockId);
      setCurrentQuestion(block.questionIds[0]);
    }
  }, [blocks, setCurrentQuestion]);

  const exitBlock = useCallback(() => {
    if (currentQuestionId && progress[currentQuestionId]) {
      const timeSpent = (Date.now() - questionStartTime) / 1000;
      setProgress((prev) => ({
        ...prev,
        [currentQuestionId]: {
          ...prev[currentQuestionId],
          timeSpent: prev[currentQuestionId].timeSpent + timeSpent,
        },
      }));
    }
    setSelectedBlockId(null);
    setCurrentQuestionId(null);
  }, [currentQuestionId, progress, questionStartTime]);

  const getBlockQuestions = useCallback((blockId: string): Question[] => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return [];
    const questionsMap = new Map(questions.map((q) => [q.id, q]));
    return block.questionIds.map((id) => questionsMap.get(id)).filter((q): q is Question => q !== undefined);
  }, [blocks, questions]);

  const getBlockProgress = useCallback((blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (!block) return { total: 0, answered: 0, correct: 0, incorrect: 0 };
    
    let answered = 0;
    let correct = 0;
    let incorrect = 0;
    
    block.questionIds.forEach((qId) => {
      const p = progress[qId];
      if (p && p.selectedAnswer !== null) {
        answered++;
        const isActuallyCorrect = p.selectedAnswer.trim().toUpperCase() === questions.find(q => q.id === qId)?.correctAnswer.trim().toUpperCase();
        if (isActuallyCorrect) correct++;
        else incorrect++;
      }
    });
    
    return { total: block.questionIds.length, answered, correct, incorrect };
  }, [blocks, progress, questions]);

  return (
    <ExamContext.Provider
      value={{
        questions,
        blocks,
        progress,
        currentQuestionId,
        selectedBlockId,
        isLoading,
        statistics,
        setQuestions,
        setCurrentQuestion,
        selectBlock,
        exitBlock,
        getBlockQuestions,
        getBlockProgress,
        submitAnswer,
        toggleMarkForReview,
        updateComment,
        resetQuestion,
        resetAllProgress,
        importProgress,
        getExportData,
        getIncorrectQuestions,
        goToNextQuestion,
        goToPreviousQuestion,
        filterMode,
        setFilterMode,
        markQuestionDivergent,
      }}
    >
      {children}
    </ExamContext.Provider>
  );
}

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error("useExam must be used within an ExamProvider");
  }
  return context;
}
