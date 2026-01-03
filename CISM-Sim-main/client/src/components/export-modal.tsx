import { useState } from "react";
import { Download, FileText, FileJson, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useExam } from "@/lib/exam-context";
import { useToast } from "@/hooks/use-toast";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ExportType = "progress" | "incorrect";

export function ExportModal({ open, onOpenChange }: ExportModalProps) {
  const [exportType, setExportType] = useState<ExportType>("progress");
  const { getExportData, getIncorrectQuestions, questions, progress } = useExam();
  const { toast } = useToast();

  const handleExport = () => {
    try {
      if (exportType === "progress") {
        const data = getExportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], {
          type: "application/json",
        });
        downloadFile(blob, "cism-progress.json");
        toast({
          title: "Progress exported",
          description: "Your progress has been saved to a file",
        });
      } else {
        // Busca as questões onde a resposta selecionada é diferente da correta
        const incorrectQuestions = questions.filter(q => {
          const p = progress[q.id];
          // Verifica se existe resposta e se ela é diferente da correta (ignorando maiúsculas/minúsculas)
          return p?.selectedAnswer && 
                 p.selectedAnswer.trim().toUpperCase() !== q.correctAnswer.trim().toUpperCase();
        });

        if (incorrectQuestions.length === 0) {
          toast({
            title: "No incorrect answers",
            description: "You haven't missed any questions in this current session!",
          });
          return;
        }

        const content = incorrectQuestions
          .map((q) => {
            const p = progress[q.id];
            return `Question ${q.number}:\n${q.text}\n\nOptions:\n${q.options
              .map((o) => `${o.letter}. ${o.text}`)
              .join("\n")}\n\nYour Answer: ${p?.selectedAnswer || "N/A"}\nCorrect Answer: ${q.correctAnswer}\n\nExplanation:\n${q.explanation}\n\n${"─".repeat(50)}\n`;
          })
          .join("\n");

        const blob = new Blob([content], { type: "text/plain" });
        downloadFile(blob, "cism-incorrect-questions.txt");
        toast({
          title: "Incorrect questions exported",
          description: `${incorrectQuestions.length} questions exported for review`,
        });
      }
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Export failed",
        description: "There was an error exporting your data",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const incorrectCount = getIncorrectQuestions().length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            Choose what you want to export from your study session
          </DialogDescription>
        </DialogHeader>

        <RadioGroup
          value={exportType}
          onValueChange={(value) => setExportType(value as ExportType)}
          className="space-y-4 py-4"
        >
          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover-elevate cursor-pointer">
            <RadioGroupItem value="progress" id="progress" className="mt-1" />
            <Label htmlFor="progress" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <FileJson className="h-4 w-4 text-primary" />
                <span className="font-medium">Export Progress (JSON)</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Save your answers, comments, and current position to continue
                later
              </p>
            </Label>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-lg border border-border hover-elevate cursor-pointer">
            <RadioGroupItem value="incorrect" id="incorrect" className="mt-1" />
            <Label htmlFor="incorrect" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="h-4 w-4 text-destructive" />
                <span className="font-medium">
                  Export Incorrect Questions (TXT)
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {incorrectCount > 0
                  ? `Get a study sheet with ${incorrectCount} missed questions`
                  : "No incorrect answers to export yet"}
              </p>
            </Label>
          </div>
        </RadioGroup>

        {questions.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            No questions loaded. Upload a file first.
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={questions.length === 0}
            data-testid="button-export-confirm"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
