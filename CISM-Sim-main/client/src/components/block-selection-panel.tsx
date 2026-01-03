import { motion } from "framer-motion";
import { FileText, CheckCircle, XCircle, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProgressRing } from "@/components/progress-ring";
import { useExam } from "@/lib/exam-context";

export function BlockSelectionPanel() {
  const { blocks, selectBlock, getBlockProgress } = useExam();

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Questions Loaded</h2>
        <p className="text-muted-foreground max-w-md">
          Upload a DOCX or TXT file to start practicing. Questions will be
          automatically organized into blocks of 50.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Choose a Question Block</h2>
          <p className="text-muted-foreground">
            Select a block to start practicing. Each block contains up to 50 questions.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {blocks.map((block, index) => {
            const { total, answered, correct, incorrect } = getBlockProgress(block.id);
            const completionPercent = total > 0 ? (answered / total) * 100 : 0;
            const accuracyPercent = answered > 0 ? (correct / answered) * 100 : 0;

            return (
              <motion.div
                key={block.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="p-4 cursor-pointer hover-elevate active-elevate-2 transition-all"
                  onClick={() => selectBlock(block.id)}
                  data-testid={`card-block-${index + 1}`}
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                      <Badge variant="secondary" className="mb-2">
                        Block {index + 1}
                      </Badge>
                      <h3
                        className="font-medium text-sm truncate"
                        title={block.sourceFile}
                      >
                        {block.sourceFile}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Questions {block.startIndex + 1} - {block.endIndex + 1}
                      </p>
                    </div>
                    <ProgressRing
                      progress={completionPercent}
                      size={48}
                      strokeWidth={4}
                      color={completionPercent === 100 ? "success" : "primary"}
                    />
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Circle className="h-3 w-3" />
                      <span>{total - answered} left</span>
                    </div>
                    <div className="flex items-center gap-1 text-success">
                      <CheckCircle className="h-3 w-3" />
                      <span>{correct}</span>
                    </div>
                    <div className="flex items-center gap-1 text-destructive">
                      <XCircle className="h-3 w-3" />
                      <span>{incorrect}</span>
                    </div>
                  </div>

                  {answered > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span
                          className={
                            accuracyPercent >= 70
                              ? "text-success font-medium"
                              : accuracyPercent >= 50
                              ? "text-warning font-medium"
                              : "text-destructive font-medium"
                          }
                        >
                          {accuracyPercent.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
