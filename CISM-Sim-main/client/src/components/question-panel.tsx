import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useExam } from "@/lib/exam-context";
import { cn } from "@/lib/utils";

interface QuestionPanelProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function QuestionPanel({ isFullscreen, onToggleFullscreen }: QuestionPanelProps) {
  const {
    questions,
    progress,
    currentQuestionId,
    submitAnswer,
    toggleMarkForReview,
    updateComment,
    resetQuestion,
    goToNextQuestion,
    goToPreviousQuestion,
    markQuestionDivergent,
  } = useExam();

  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [localComment, setLocalComment] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    isDivergent: boolean;
    explanationAnswer: string | null;
    reason: string | null;
  } | null>(null);

  const currentQuestion = useMemo(
    () => questions.find((q) => q.id === currentQuestionId),
    [questions, currentQuestionId]
  );

  const currentProgress = currentQuestionId ? progress[currentQuestionId] : null;
  const currentIndex = questions.findIndex((q) => q.id === currentQuestionId);
  const isFirstQuestion = currentIndex === 0;
  const isLastQuestion = currentIndex === questions.length - 1;

  useEffect(() => {
    if (currentProgress) {
      setSelectedAnswer(currentProgress.selectedAnswer);
      setShowExplanation(currentProgress.selectedAnswer !== null);
      setLocalComment(currentProgress.comment || "");
    } else {
      setSelectedAnswer(null);
      setShowExplanation(false);
      setLocalComment("");
    }
    setAiAnalysis(null);
  }, [currentQuestionId, currentProgress]);

  const handleAiAnalysis = async () => {
    if (!currentQuestion) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    
    try {
      const response = await fetch("/api/analyze-divergence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          correctAnswer: currentQuestion.correctAnswer,
          explanation: currentQuestion.explanation,
	          text: currentQuestion.text,
          options: currentQuestion.options,
        }),
      });

	      const result = await response.json().catch(() => ({}));
	      if (!response.ok) {
	        throw new Error((result as any)?.message || "AI analysis request failed");
	      }

      setAiAnalysis(result);
      
      if (result.isDivergent) {
        markQuestionDivergent(currentQuestion.id, true);
      }
    } catch (error) {
      console.error("AI analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectAnswer = (letter: string) => {
    if (currentProgress?.selectedAnswer !== null) return;
    setSelectedAnswer(letter);
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestionId || !selectedAnswer) return;
    submitAnswer(currentQuestionId, selectedAnswer);
    setShowExplanation(true);
  };

  const handleResetQuestion = () => {
    if (!currentQuestionId) return;
    resetQuestion(currentQuestionId);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  const handleCommentBlur = () => {
    if (currentQuestionId && localComment !== currentProgress?.comment) {
      updateComment(currentQuestionId, localComment);
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium mb-2">No question selected</p>
          <p className="text-sm">Upload a file or select a question from the sidebar</p>
        </div>
      </div>
    );
  }

  const isAnswered = currentProgress?.selectedAnswer !== null;
  const isCorrect = currentProgress?.isCorrect;
  const isFlagged = currentProgress?.isMarkedForReview;
  const isDivergent = currentQuestion?.isDivergent || false;
  const explanationAnswer = currentQuestion?.explanationAnswer;

  return (
    <div className="flex flex-col h-full">
      <div className="sticky top-0 z-10 bg-background border-b border-border p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="font-mono text-sm">
            Q{currentQuestion.number}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1} of {questions.length}
          </span>
          {isFlagged && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              <Flag className="h-3 w-3 mr-1" />
              Flagged
            </Badge>
          )}
          {isDivergent && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Divergent
            </Badge>
          )}
          {isAnswered && (
            <Badge
              variant="secondary"
              className={cn(
                isCorrect
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {isCorrect ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Correct
                </>
              ) : (
                <>
                  <X className="h-3 w-3 mr-1" />
                  Incorrect
                </>
              )}
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleFullscreen}
          data-testid="button-fullscreen"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <h2
                className="text-xl leading-relaxed mb-8"
                data-testid="text-question"
              >
                {currentQuestion.text}
              </h2>

              <div className="space-y-3 mb-8">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedAnswer === option.letter;
                  const isCorrectOption = option.letter === currentQuestion.correctAnswer;
                  const showResult = isAnswered;

                  let optionStyles = "relative p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer";

                  if (showResult) {
                    if (isCorrectOption) {
                      optionStyles = cn(optionStyles, "border-success bg-success/5");
                    } else if (isSelected && !isCorrectOption) {
                      optionStyles = cn(optionStyles, "border-destructive bg-destructive/5");
                    } else {
                      optionStyles = cn(optionStyles, "border-border opacity-50");
                    }
                  } else {
                    if (isSelected) {
                      optionStyles = cn(optionStyles, "border-primary bg-primary/5");
                    } else {
                      optionStyles = cn(optionStyles, "border-border hover-elevate");
                    }
                  }

                  return (
                    <motion.button
                      key={option.letter}
                      onClick={() => handleSelectAnswer(option.letter)}
                      disabled={isAnswered}
                      className={cn(optionStyles, "w-full text-left")}
                      whileTap={!isAnswered ? { scale: 0.99 } : undefined}
                      data-testid={`button-option-${option.letter}`}
                    >
                      <div className="flex items-start gap-4">
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className={cn(
                            "shrink-0 font-mono",
                            showResult && isCorrectOption && "bg-success text-success-foreground",
                            showResult && isSelected && !isCorrectOption && "bg-destructive text-destructive-foreground"
                          )}
                        >
                          {option.letter}
                        </Badge>
                        <span className="text-base">{option.text}</span>
                      </div>
                      {showResult && isCorrectOption && (
                        <Check className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-success" />
                      )}
                      {showResult && isSelected && !isCorrectOption && (
                        <X className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-destructive" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-3 mb-8">
                {!isAnswered && (
                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer}
                    data-testid="button-submit-answer"
                  >
                    Submit Answer
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() =>
                    currentQuestionId && toggleMarkForReview(currentQuestionId)
                  }
                  className={cn(isFlagged && "border-warning text-warning")}
                  data-testid="button-mark-review"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  {isFlagged ? "Remove Flag" : "Mark for Review"}
                </Button>
                {isAnswered && (
                  <Button
                    variant="outline"
                    onClick={handleResetQuestion}
                    data-testid="button-redo"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Redo Question
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={handleAiAnalysis}
                  disabled={isAnalyzing}
                  data-testid="button-ai-analyze"
                >
                  {isAnalyzing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  {isAnalyzing ? "Analyzing..." : "AI Analysis"}
                </Button>
              </div>

              {isDivergent && (
                <Alert className="border-warning bg-warning/10 mb-6">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertTitle className="text-warning">Divergence Detected</AlertTitle>
                  <AlertDescription className="text-warning/80">
                    The answer key indicates <strong>{currentQuestion.correctAnswer}</strong> as correct, 
                    but the explanation suggests <strong>{explanationAnswer}</strong> may be the correct answer.
                    Please verify this question using official CISM study materials.
                  </AlertDescription>
                </Alert>
              )}

              {aiAnalysis && (
                <Alert className={cn(
                  "mb-6",
                  aiAnalysis.isDivergent 
                    ? "border-warning bg-warning/10" 
                    : "border-success bg-success/10"
                )}>
                  <Sparkles className={cn(
                    "h-4 w-4",
                    aiAnalysis.isDivergent ? "text-warning" : "text-success"
                  )} />
                  <AlertTitle className={aiAnalysis.isDivergent ? "text-warning" : "text-success"}>
                    AI Analysis Result
                  </AlertTitle>
                  <AlertDescription className={aiAnalysis.isDivergent ? "text-warning/80" : "text-success/80"}>
                    {aiAnalysis.isDivergent ? (
                      <>
                        Divergence found: The explanation suggests <strong>{aiAnalysis.explanationAnswer}</strong> instead of <strong>{currentQuestion.correctAnswer}</strong>.
                        {aiAnalysis.reason && <div className="mt-1 text-sm">{aiAnalysis.reason}</div>}
                      </>
                    ) : (
                      <>
                        No divergence detected. The answer key and explanation appear to be consistent.
                        {aiAnalysis.reason && <div className="mt-1 text-sm">{aiAnalysis.reason}</div>}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <AnimatePresence>
                {showExplanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Separator className="my-6" />
                    <Card className="bg-card">
                      <CardContent className="p-6">
                        <h3 className="font-semibold text-lg mb-3">Explanation</h3>
                        <p
                          className="text-sm leading-relaxed text-muted-foreground"
                          data-testid="text-explanation"
                        >
                          {currentQuestion.explanation}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <Separator className="my-6" />

              <div>
                <h3 className="font-medium text-sm mb-2">Your Notes</h3>
                <Textarea
                  placeholder="Add your personal notes for this question..."
                  value={localComment}
                  onChange={(e) => setLocalComment(e.target.value)}
                  onBlur={handleCommentBlur}
                  className="min-h-[100px] resize-none"
                  data-testid="textarea-notes"
                />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border p-4 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goToPreviousQuestion}
          disabled={isFirstQuestion}
          data-testid="button-previous"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button
          onClick={goToNextQuestion}
          disabled={isLastQuestion}
          data-testid="button-next"
        >
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
