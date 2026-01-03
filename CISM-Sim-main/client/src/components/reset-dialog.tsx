import { RotateCcw, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useExam } from "@/lib/exam-context";
import { useToast } from "@/hooks/use-toast";

interface ResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResetDialog({ open, onOpenChange }: ResetDialogProps) {
  const { resetAllProgress, statistics } = useExam();
  const { toast } = useToast();

  const handleReset = () => {
    resetAllProgress();
    toast({
      title: "Progress reset",
      description: "All your answers and notes have been cleared",
    });
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Reset All Progress
          </AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>{statistics.answeredQuestions} answered questions</li>
              <li>All personal notes and comments</li>
              <li>All flagged questions</li>
              <li>Time tracking data</li>
            </ul>
            <p className="mt-3 font-medium text-foreground">
              This action cannot be undone.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleReset}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-reset-confirm"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Everything
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
