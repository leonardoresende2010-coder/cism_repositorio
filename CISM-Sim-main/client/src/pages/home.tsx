import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PanelLeftClose,
  PanelLeft,
  BarChart3,
  Upload,
  Download,
  RotateCcw,
  FileUp,
  ArrowLeft,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { QuestionSidebar } from "@/components/question-sidebar";
import { QuestionPanel } from "@/components/question-panel";
import { StatsDashboard } from "@/components/stats-dashboard";
import { UploadZone } from "@/components/upload-zone";
import { BlockSelectionPanel } from "@/components/block-selection-panel";
import { ExportModal } from "@/components/export-modal";
import { ImportModal } from "@/components/import-modal";
import { ResetDialog } from "@/components/reset-dialog";
import { useExam } from "@/lib/exam-context";
import { useToast } from "@/hooks/use-toast";
import type { Question, QuestionBlock } from "@shared/schema";

type ViewMode = "blocks" | "study" | "stats" | "upload";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("upload");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { questions, blocks, selectedBlockId, setQuestions, setCurrentQuestion, exitBlock } = useExam();
  const { toast } = useToast();

  const handleFileUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/questions/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to process file");
      }

      const data = await response.json();
      const { questions: parsedQuestions, blocks: parsedBlocks } = data as {
        questions: Question[];
        blocks: QuestionBlock[];
      };

      if (parsedQuestions.length === 0) {
        throw new Error("No questions found in the file");
      }

      setQuestions(parsedQuestions, parsedBlocks);
      setViewMode("blocks");

      toast({
        title: "Questions loaded",
        description: `Successfully loaded ${parsedQuestions.length} questions from ${file.name}`,
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "Failed to process file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  }, [setQuestions, toast]);

  const handleBackToBlocks = useCallback(() => {
    exitBlock();
    setViewMode("blocks");
  }, [exitBlock]);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const isInStudyMode = selectedBlockId !== null;

  return (
    <div className="flex h-screen w-full bg-background">
      <AnimatePresence mode="wait">
        {sidebarOpen && !isFullscreen && isInStudyMode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="h-full bg-sidebar border-r border-sidebar-border flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 p-4 border-b border-sidebar-border">
              <h1 className="font-semibold text-lg truncate">CISM Simulator</h1>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                data-testid="button-close-sidebar"
              >
                <PanelLeftClose className="h-5 w-5" />
              </Button>
            </div>
            <QuestionSidebar />
          </motion.aside>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="sticky top-0 z-50 bg-background border-b border-border">
          <div className="flex items-center justify-between gap-4 p-3">
            <div className="flex items-center gap-2">
              {!sidebarOpen && !isFullscreen && isInStudyMode && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(true)}
                  data-testid="button-open-sidebar"
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              )}

              {isInStudyMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToBlocks}
                  data-testid="button-back-to-blocks"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Blocks
                </Button>
              )}

              {!isInStudyMode && (
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === "blocks" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("blocks")}
                    disabled={blocks.length === 0}
                    data-testid="button-view-blocks"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Blocks
                  </Button>
                  <Button
                    variant={viewMode === "stats" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("stats")}
                    disabled={questions.length === 0}
                    data-testid="button-view-stats"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Stats
                  </Button>
                  <Button
                    variant={viewMode === "upload" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("upload")}
                    data-testid="button-view-upload"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportModalOpen(true)}
                data-testid="button-import"
              >
                <FileUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Import</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExportModalOpen(true)}
                data-testid="button-export"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResetDialogOpen(true)}
                disabled={questions.length === 0}
                data-testid="button-reset"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {isInStudyMode ? (
              <motion.div
                key="study"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <QuestionPanel
                  isFullscreen={isFullscreen}
                  onToggleFullscreen={toggleFullscreen}
                />
              </motion.div>
            ) : (
              <>
                {viewMode === "blocks" && (
                  <motion.div
                    key="blocks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full overflow-auto"
                  >
                    <BlockSelectionPanel />
                  </motion.div>
                )}

                {viewMode === "stats" && (
                  <motion.div
                    key="stats"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full overflow-auto"
                  >
                    <StatsDashboard />
                  </motion.div>
                )}

                {viewMode === "upload" && (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="h-full p-8"
                  >
                    <div className="max-w-2xl mx-auto">
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold mb-2">
                          Upload Question File
                        </h2>
                        <p className="text-muted-foreground">
                          Upload a DOCX or TXT file containing CISM exam questions
                        </p>
                      </div>
                      <UploadZone
                        onFileUpload={handleFileUpload}
                        isLoading={isUploading}
                      />
                      {questions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="mt-6 p-4 bg-success/10 rounded-lg text-center"
                        >
                          <p className="text-success font-medium">
                            {questions.length} questions loaded in {blocks.length} blocks
                          </p>
                          <Button
                            variant="ghost"
                            className="text-success"
                            onClick={() => setViewMode("blocks")}
                            data-testid="button-go-to-blocks"
                          >
                            Go to block selection
                          </Button>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ExportModal open={exportModalOpen} onOpenChange={setExportModalOpen} />
      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} />
      <ResetDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen} />
    </div>
  );
}
