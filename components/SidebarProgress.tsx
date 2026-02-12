import React, { useState, useEffect } from 'react';
import { Question, UserSession } from '../types';

interface SidebarProgressProps {
  questions: Question[];
  currentQuestionIndex: number;
  session: UserSession;
  onJumpToQuestion: (index: number) => void;
}

export const SidebarProgress: React.FC<SidebarProgressProps> = ({
  questions,
  currentQuestionIndex,
  session,
  onJumpToQuestion
}) => {
  const [clearedRows, setClearedRows] = useState<number[]>([]);
  const [explodingIds, setExplodingIds] = useState<string[]>([]);
  const [collapsingRows, setCollapsingRows] = useState<number[]>([]);
  const [medals, setMedals] = useState<number[]>([]);
  const [showRowTrophy, setShowRowTrophy] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const soundRef = React.useRef<HTMLAudioElement>(null);

  // Calculate rows
  const reversedQuestions = React.useMemo(() => [...questions].reverse(), [questions]);

  const rows = React.useMemo(() => {
    const result: Question[][] = [];
    for (let i = 0; i < reversedQuestions.length; i += 5) {
      result.push(reversedQuestions.slice(i, i + 5));
    }
    return result;
  }, [reversedQuestions]);

  // Effect to detect full green rows
  useEffect(() => {
    if (!isInitialized) {
      const initialCleared: number[] = [];
      rows.forEach((row, idx) => {
        const isRowAllCorrect = row.every(q => {
          const progress = session[q.id];
          if (!progress || !progress.selectedAnswer) return false;
          const selectedLabel = q.options.find(o => o.id === progress.selectedAnswer)?.label;
          return q.correctAnswerLabel === selectedLabel;
        });
        if (isRowAllCorrect) initialCleared.push(idx);
      });
      setClearedRows(initialCleared);
      setMedals(initialCleared.map(() => Date.now()));
      setIsInitialized(true);
      return;
    }

    rows.forEach((row, rowIndex) => {
      if (clearedRows.includes(rowIndex) || collapsingRows.includes(rowIndex)) return;

      const isRowAllCorrect = row.every(q => {
        const progress = session[q.id];
        if (!progress || !progress.selectedAnswer) return false;
        return q.correctAnswerLabel === q.options.find(o => o.id === progress.selectedAnswer)?.label;
      });

      if (isRowAllCorrect) {
        startExplosionSequence(rowIndex, row);
      }
    });
  }, [session, clearedRows, collapsingRows, rows, isInitialized]);

  const startExplosionSequence = async (rowIndex: number, row: Question[]) => {
    // Play sound! (Advanced 1.5s to sync impact with explosions)
    if (soundRef.current) {
      soundRef.current.currentTime = 1.5;
      soundRef.current.play().catch(e => console.log("Sound play failed:", e));
    }

    // Explode one by one
    for (let i = 0; i < row.length; i++) {
      setExplodingIds(prev => [...prev, row[i].id]);
      await new Promise(resolve => setTimeout(resolve, 200)); // Delay between explosions
    }

    // After all explode, trigger row collapse
    setCollapsingRows(prev => [...prev, rowIndex]);

    await new Promise(resolve => setTimeout(resolve, 500)); // Animation duration

    // Finalize clearing
    setClearedRows(prev => [...prev, rowIndex]);
    setExplodingIds(prev => prev.filter(id => !row.some(rq => rq.id === id)));
    setCollapsingRows(prev => prev.filter(idx => idx !== rowIndex));
    setMedals(prev => [...prev, Date.now()]);

    // Show row trophy animation
    setShowRowTrophy(true);
    setTimeout(() => setShowRowTrophy(false), 3000);
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full flex flex-col shrink-0">
      {/* Hidden sound player */}
      <audio ref={soundRef} src="/trombeta.mp3" className="hidden" />

      <div className="p-4 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-800">Mapa de Progresso</h3>
            <p className="text-xs text-gray-500 mt-1">
              {questions.length} Questões neste bloco
            </p>
          </div>
          {medals.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-end max-w-[120px]">
              {medals.map((m, i) => (
                <div key={m} className="animate-scale-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <span className="text-xl" title="Linha de acertos completada!">🥇</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col justify-end min-h-full gap-4">
          {rows.map((row, rowIndex) => {
            if (clearedRows.includes(rowIndex)) return null;

            const isCollapsing = collapsingRows.includes(rowIndex);

            return (
              <div
                key={`row-${rowIndex}`}
                className={`grid grid-cols-5 gap-2 ${isCollapsing ? 'animate-row-collapse' : ''}`}
              >
                {row.map((q) => {
                  const rIdx = reversedQuestions.indexOf(q);
                  const idx = questions.length - 1 - rIdx;
                  const progress = session[q.id];
                  const isExploding = explodingIds.includes(q.id);

                  let statusClass = "bg-gray-100 text-gray-500 border-gray-200";
                  let flagIcon = null;

                  if (progress) {
                    if (progress.selectedAnswer) {
                      const isCorrect = q.correctAnswerLabel === q.options.find(o => o.id === progress.selectedAnswer)?.label;
                      statusClass = isCorrect
                        ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                        : "bg-rose-100 text-rose-700 border-rose-300";
                    } else if (progress.isFlaggedDisagreeAI || progress.isFlaggedDisagreeKey) {
                      statusClass = "bg-orange-50 text-orange-600 border-orange-300";
                    } else {
                      statusClass = "bg-amber-100 text-amber-700 border-amber-300";
                    }

                    if (progress.isFlaggedDisagreeKey || progress.isFlaggedDisagreeAI) {
                      flagIcon = (
                        <div className="absolute -top-1 -right-1">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                          </span>
                        </div>
                      );
                    }
                  }

                  const activeClass = idx === currentQuestionIndex ? "ring-2 ring-indigo-600 ring-offset-2" : "";

                  return (
                    <button
                      key={q.id}
                      onClick={() => onJumpToQuestion(idx)}
                      className={`
                        h-10 w-full rounded-md flex items-center justify-center text-sm font-bold border relative
                        transition-all duration-200 ${statusClass} ${activeClass}
                        ${isExploding ? 'animate-explode' : ''}
                      `}
                    >
                      {idx + 1}
                      {flagIcon}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></span> Correto</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-rose-500 mr-2"></span> Incorreto</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-400 mr-2"></span> Pulou</div>
          <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Marcada</div>
        </div>
      </div>

      {/* Row Victory Celebration */}
      {showRowTrophy && (
        <div className="absolute inset-0 z-50 bg-indigo-900/40 backdrop-blur-sm flex items-center justify-center animate-fade-in overflow-hidden pointer-events-none">
          <video
            autoPlay
            muted
            src="/img/trofeu_prepwise.webm"
            className="w-full h-auto max-h-full scale-150"
          />
        </div>
      )}
    </div>
  );
};