import React from 'react';
import { QuizBlock, UserSession } from '../types';

interface RewardsProps {
    quizzes: QuizBlock[];
    session: UserSession;
}

interface QuizStats {
    id: string;
    title: string;
    correct: number;
    total: number;
    gabaritosCount: number;
    isFullyComplete: boolean;
}

export const Rewards: React.FC<RewardsProps> = ({ quizzes, session }) => {

    const calculateStats = () => {
        const stats: Record<string, QuizStats[]> = {};

        quizzes.forEach(quiz => {
            const provider = quiz.provider || 'Outros';
            if (!stats[provider]) {
                stats[provider] = [];
            }

            let quizCorrect = 0;
            const quizTotal = quiz.questions.length;
            let gabaritosCount = 0;

            // 1. Calculate Sequence Medals (Rows of 5)
            const reversedQuestions = [...quiz.questions].reverse();
            for (let i = 0; i < reversedQuestions.length; i += 5) {
                const row = reversedQuestions.slice(i, i + 5);
                if (row.length === 5) {
                    const isRowAllCorrect = row.every(q => {
                        const s = session[q.id];
                        if (!s || !s.selectedAnswer) return false;
                        const label = q.options.find(o => o.id === s.selectedAnswer)?.label;
                        return q.correctAnswerLabel === label;
                    });
                    if (isRowAllCorrect) {
                        gabaritosCount++;
                    }
                }
            }

            // 2. Total Correct
            quiz.questions.forEach(q => {
                const progress = session[q.id];
                if (progress && progress.selectedAnswer) {
                    const label = q.options.find(o => o.id === progress.selectedAnswer)?.label;
                    if (label === q.correctAnswerLabel) {
                        quizCorrect++;
                    }
                }
            });

            stats[provider].push({
                id: quiz.id,
                title: quiz.title,
                correct: quizCorrect,
                total: quizTotal,
                gabaritosCount: gabaritosCount,
                isFullyComplete: quizCorrect === quizTotal && quizTotal > 0
            });
        });

        return stats;
    };

    const groupedStats = calculateStats();
    const providers = Object.keys(groupedStats).sort();

    return (
        <div className="space-y-16 animate-slide-up pb-20">
            {/* Header */}
            <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h2 className="text-4xl font-black mb-3">Conquistas por Simulado</h2>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Acompanhe seu progresso individual em cada questionário.
                        Complete as linhas do gabarito para ganhar troféus e domine 100% das questões para o Troféu Mestre.
                    </p>
                </div>
            </div>

            {providers.length > 0 ? (
                <div className="space-y-20">
                    {providers.map(provider => (
                        <div key={provider} className="space-y-8">
                            <div className="flex items-center gap-4 px-2">
                                <div className="h-8 w-2 bg-indigo-600 rounded-full"></div>
                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">{provider}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {groupedStats[provider].map(quiz => {
                                    const progress = quiz.total > 0 ? (quiz.correct / quiz.total) * 100 : 0;

                                    return (
                                        <div key={quiz.id} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden">

                                            {/* Huge Trophy Background Glow */}
                                            {quiz.isFullyComplete && (
                                                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                            )}

                                            <div className="flex justify-between items-start mb-6">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-xl font-black text-slate-800 truncate uppercase tracking-tight group-hover:text-indigo-600 transition-colors">
                                                        {quiz.title}
                                                    </h4>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status do Treinamento</p>
                                                </div>
                                                {quiz.isFullyComplete ? (
                                                    <div className="text-4xl animate-bounce">🏆</div>
                                                ) : (
                                                    <div className="text-3xl opacity-10 filter grayscale">🏆</div>
                                                )}
                                            </div>

                                            {/* Progress Section */}
                                            <div className="space-y-3 mb-8">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Aproveitamento</span>
                                                    <span className="text-lg font-black text-indigo-600">{quiz.correct} / {quiz.total} <span className="text-xs text-slate-400">questões</span></span>
                                                </div>
                                                <div className="h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ease-out ${quiz.isFullyComplete ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            {/* Medals List */}
                                            <div className="flex-1">
                                                <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">Troféus de Gabarito</h5>
                                                {quiz.gabaritosCount > 0 ? (
                                                    <div className="flex flex-wrap gap-2">
                                                        {Array.from({ length: quiz.gabaritosCount }).map((_, i) => (
                                                            <div key={i} className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 hover:scale-110 transition-transform cursor-help" title="Gabarito Master - Sequência 5/5">
                                                                <span className="text-xl">🏆</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="py-4 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-100">
                                                        <p className="text-[10px] font-bold text-slate-300 uppercase">Nenhuma sequência 5/5 ainda</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Huge Award Overlay for 100% */}
                                            {quiz.isFullyComplete && (
                                                <div className="mt-6 pt-6 border-t border-amber-50">
                                                    <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-2xl text-center shadow-lg shadow-amber-100">
                                                        <div className="text-white text-xs font-black uppercase tracking-widest">Simulado Concluído</div>
                                                        <div className="text-amber-50 text-[10px] font-bold uppercase opacity-90">100% MESTRE</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border-2 border-dashed border-gray-100">
                    <div className="text-8xl mb-8">🏆</div>
                    <h3 className="text-2xl font-black text-gray-800">Sua jornada começa aqui</h3>
                    <p className="text-gray-500 mt-3 max-w-md mx-auto text-lg leading-relaxed">
                        Complete linhas no mapa de progresso para ganhar seus primeiros troféus de mestre!
                    </p>
                </div>
            )}
        </div>
    );
};
