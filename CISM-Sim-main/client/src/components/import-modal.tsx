import { useState, useCallback } from "react";
import { Upload, FileJson, AlertCircle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useExam } from "@/lib/exam-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportModal({ open, onOpenChange }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { importProgress, questions } = useExam();
  const { toast } = useToast();

  const handleFile = useCallback(async (selectedFile: File) => {
    setError(null);
    setFile(selectedFile);

    if (!selectedFile.name.endsWith(".json")) {
      setError("Please select a JSON file");
      setFileContent(null);
      return;
    }

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      if (!data.version || !data.progress) {
        setError("Invalid progress file format");
        setFileContent(null);
        return;
      }

      setFileContent(data);
    } catch {
      setError("Failed to parse file");
      setFileContent(null);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleImport = () => {
    if (!fileContent) return;

    try {
      importProgress(fileContent);
      toast({
        title: "Progress imported",
        description: `Restored ${fileContent.progress.length} question states`,
      });
      onOpenChange(false);
      setFile(null);
      setFileContent(null);
    } catch {
      toast({
        title: "Import failed",
        description: "There was an error importing your progress",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setFile(null);
    setFileContent(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Progress</DialogTitle>
          <DialogDescription>
            Load a previously saved progress file to continue your study session
          </DialogDescription>
        </DialogHeader>

        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg p-8 transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-muted-foreground/50"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".json"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                handleFile(files[0]);
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            data-testid="input-import-file"
          />

          <div className="flex flex-col items-center text-center">
            {fileContent ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center"
              >
                <CheckCircle className="h-12 w-12 text-success mb-3" />
                <p className="font-medium text-sm mb-1">{file?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {fileContent.progress.length} questions •{" "}
                  {new Date(fileContent.exportedAt).toLocaleDateString()}
                </p>
              </motion.div>
            ) : (
              <>
                <FileJson className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm font-medium mb-1">
                  Drop your progress file here
                </p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </>
            )}
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}

        {questions.length === 0 && (
          <div className="flex items-center gap-2 p-3 bg-warning/10 text-warning rounded-lg text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            Upload a question file first before importing progress
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!fileContent || questions.length === 0}
            data-testid="button-import-confirm"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
