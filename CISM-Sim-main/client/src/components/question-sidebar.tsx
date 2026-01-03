import { useMemo } from "react";
import { motion } from "framer-motion";
import { Flag } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useExam } from "@/lib/exam-context";
import { cn } from "@/lib/utils";
import type { Question } from "@shared/schema";

export function QuestionSidebar() {
  const {
    blocks,
    progress,
    currentQuestionId,
    selectedBlockId,
    setCurrentQuestion,
    getBlockQuestions,
  } = useExam();

  const currentBlock = useMemo(() => {
    return blocks.find((b) => b.id === selectedBlockId);
  }, [blocks, selectedBlockId]);

  const blockQuestions = useMemo(() => {
    if (!selectedBlockId) return [];
    return getBlockQuestions(selectedBlockId);
  }, [selectedBlockId, getBlockQuestions]);

  const getQuestionStatus = (question: Question) => {
    const p = progress[question.id];
    const isFlagged = p?.isMarkedForReview || false;
    const isDivergent = question.isDivergent || false;
    
    if (isDivergent) {
      return { status: "divergent", isFlagged };
    }
    
    if (!p || p.selectedAnswer === null) {
      return { status: "unanswered", isFlagged };
    }
    return { 
      status: p.isCorrect ? "correct" : "incorrect", 
      isFlagged 
    };
  };

  if (!currentBlock || blockQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <div className="text-muted-foreground text-sm">
          Select a block to view questions.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-border">
        <p className="text-xs text-muted-foreground truncate" title={currentBlock.sourceFile}>
          {currentBlock.sourceFile}
        </p>
        <p className="text-sm font-medium mt-1">
          Q{currentBlock.startIndex + 1} - Q{currentBlock.endIndex + 1}
        </p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="grid grid-cols-5 gap-2">
            {blockQuestions.map((question) => {
              const { status, isFlagged } = getQuestionStatus(question);
              const isActive = currentQuestionId === question.id;

              return (
                <motion.button
                  key={question.id}
                  onClick={() => setCurrentQuestion(question.id)}
                  className={cn(
                    "aspect-square flex items-center justify-center rounded-md text-sm font-mono font-medium transition-all relative",
                    isActive && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    status === "correct" && "bg-success text-success-foreground",
                    status === "incorrect" && "bg-destructive text-destructive-foreground",
                    status === "divergent" && "bg-warning text-warning-foreground",
                    status === "unanswered" && "bg-unanswered text-unanswered-foreground hover-elevate"
                  )}
                  whileTap={{ scale: 0.95 }}
                  data-testid={`button-question-${question.number}`}
                >
                  {question.number}
                  {isFlagged && (
                    <Flag className="absolute -top-1 -right-1 h-3 w-3 text-warning fill-warning" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-sidebar-border">
        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-unanswered" />
            <span>Unanswered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-success" />
            <span>Correct</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-destructive" />
            <span>Incorrect</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-warning" />
            <span>Divergent</span>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Flag className="w-3 h-3 text-warning fill-warning" />
            <span>Flagged for Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
