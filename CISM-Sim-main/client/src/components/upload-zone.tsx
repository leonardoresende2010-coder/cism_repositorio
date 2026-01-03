import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { CloudUpload, FileText, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface UploadZoneProps {
  onFileUpload: (file: File) => Promise<void>;
  isLoading?: boolean;
}

export function UploadZone({ onFileUpload, isLoading = false }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const fileName = file.name.toLowerCase();
    const validExtensions = [".docx", ".pdf", ".txt"];

    // Verifica se o nome do arquivo termina com uma das extensões permitidas
    const hasValidExtension = validExtensions.some((ext) => fileName.endsWith(ext));

    // Mantém a verificação de tipo como backup (opcional)
    const validTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/pdf",
      "text/plain",
      "application/msword", // DOCs mais antigos
    ];

    if (!hasValidExtension && !validTypes.includes(file.type)) {
      setError("Unsupported file type. Please upload DOCX, PDF, or TXT.");
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB");
      return false;
    }

    setError(null);
    return true;
  };

  const handleFile = useCallback(async (file: File) => {
    if (!validateFile(file)) return;
    
    try {
      await onFileUpload(file);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} has been processed`,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to process file";
      setError(message);
      toast({
        title: "Upload failed",
        description: message,
        variant: "destructive",
      });
    }
  }, [onFileUpload, toast]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
      e.target.value = "";
    },
    [handleFile]
  );

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed rounded-xl p-12 transition-all duration-200",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-muted-foreground/50",
        isLoading && "pointer-events-none opacity-70"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".docx,.pdf,.txt"
        onChange={handleInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isLoading}
        data-testid="input-file-upload"
      />

      <div className="flex flex-col items-center justify-center text-center">
        <motion.div
          animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <Loader2 className="h-16 w-16 text-primary animate-spin mb-4" />
          ) : (
            <CloudUpload
              className={cn(
                "h-16 w-16 mb-4 transition-colors",
                isDragging ? "text-primary" : "text-muted-foreground"
              )}
            />
          )}
        </motion.div>

        <h3 className="text-lg font-medium mb-2">
          {isLoading ? "Processing file..." : "Drag & drop your file here"}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          {isLoading
            ? "Please wait while we parse your questions"
            : "or click to browse"}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            DOCX
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            PDF
          </div>
          <div className="flex items-center gap-1">
            <FileText className="h-4 w-4" />
            TXT
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
      </div>
    </Card>
  );
}
