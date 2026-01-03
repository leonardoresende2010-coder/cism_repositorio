import { motion } from "framer-motion";
import { BarChart3, Clock, Check, X, HelpCircle, Flag, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressRing } from "@/components/progress-ring";
import { useExam } from "@/lib/exam-context";

export function StatsDashboard() {
  const { statistics, questions } = useExam();

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <BarChart3 className="h-16 w-16 text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Statistics Yet</h2>
        <p className="text-muted-foreground">
          Upload a question file to start tracking your progress
        </p>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const statCards = [
    {
      title: "Total Questions",
      value: statistics.totalQuestions,
      icon: HelpCircle,
      color: "text-foreground",
    },
    {
      title: "Answered",
      value: statistics.answeredQuestions,
      icon: Check,
      color: "text-primary",
    },
    {
      title: "Correct",
      value: statistics.correctAnswers,
      icon: Check,
      color: "text-success",
    },
    {
      title: "Incorrect",
      value: statistics.incorrectAnswers,
      icon: X,
      color: "text-destructive",
    },
    {
      title: "Flagged",
      value: statistics.markedForReview,
      icon: Flag,
      color: "text-warning",
    },
    {
      title: "Divergent",
      value: statistics.divergentQuestions,
      icon: AlertTriangle,
      color: "text-warning",
    },
    {
      title: "Avg Time",
      value: formatTime(statistics.averageTimePerQuestion),
      icon: Clock,
      color: "text-muted-foreground",
      isTime: true,
    },
  ];

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h1 className="text-2xl font-bold mb-8" data-testid="text-stats-title">
            Performance Dashboard
          </h1>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        {stat.title}
                      </span>
                    </div>
                    <p
                      className={`text-2xl font-bold ${stat.color}`}
                      data-testid={`text-stat-${stat.title.toLowerCase().replace(" ", "-")}`}
                    >
                      {stat.value}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Accuracy Rate</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <ProgressRing
                    progress={statistics.answeredQuestions > 0
                      ? (statistics.correctAnswers / statistics.answeredQuestions) * 100
                      : 0}
                    size={140}
                    strokeWidth={12}
                    color="hsl(var(--success))"
                    value={`${statistics.answeredQuestions > 0
                      ? Math.round((statistics.correctAnswers / statistics.answeredQuestions) * 100)
                      : 0}%`}
                    label="Accuracy"
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Completion Rate</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center pb-6">
                  <ProgressRing
                    progress={100 - statistics.percentUnanswered}
                    size={140}
                    strokeWidth={12}
                    color="hsl(var(--primary))"
                    value={`${Math.round(100 - statistics.percentUnanswered)}%`}
                    label="Complete"
                  />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Score Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="pb-6">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Correct</span>
                        <span className="text-sm font-medium text-success">
                          {Math.round(statistics.percentCorrect)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-success rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${statistics.percentCorrect}%` }}
                          transition={{ duration: 0.8, delay: 0.6 }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Incorrect</span>
                        <span className="text-sm font-medium text-destructive">
                          {Math.round(statistics.percentIncorrect)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-destructive rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${statistics.percentIncorrect}%` }}
                          transition={{ duration: 0.8, delay: 0.7 }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Unanswered</span>
                        <span className="text-sm font-medium">
                          {Math.round(statistics.percentUnanswered)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-muted-foreground/30 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${statistics.percentUnanswered}%` }}
                          transition={{ duration: 0.8, delay: 0.8 }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
