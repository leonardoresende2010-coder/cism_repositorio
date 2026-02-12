import React from 'react';
import { QuizBlock, UserSession } from '../types';

interface RewardsProps {
    quizzes: QuizBlock[];
    session: UserSession;
}

export const Rewards: React.FC<RewardsProps> = ({ quizzes, session }) => {

    const calculateProviderStats = () => {
        const stats: Record<string, {
            correct: number,
            total: number,
            medals: { gabaritos: any[] },
            isFullyComplete: boolean
        }> = {};

        quizzes.forEach(quiz => {
            const provider = quiz.provider || 'Outros';
            if (!stats[provider]) {
                stats[provider] = {
                    correct: 0,
                    total: 0,
                    medals: { gabaritos: [] },
                    isFullyComplete: false
                };
            }

            let quizCorrect = 0;
            const quizTotal = quiz.questions.length;
            stats[provider].total += quizTotal;

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
                        stats[provider].medals.gabaritos.push({
                            title: quiz.title,
                            type: 'Gabarito'
                        });
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
                        stats[provider].correct++;
                    }
                }
            });
        });

        // Determine if any provider is fully complete
        Object.keys(stats).forEach(p => {
            stats[p].isFullyComplete = stats[p].correct === stats[p].total && stats[p].total > 0;
        });

        return stats;
    };

    const providerStats = calculateProviderStats();
    const providers = Object.keys(providerStats).sort();

    return (
        <div className="space-y-10 animate-slide-up pb-20">
            {/* Header */}
            <div className="bg-slate-900 rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 text-center md:text-left">
                    <h2 className="text-4xl font-black mb-3">Mapa de Conquistas</h2>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Acompanhe seu progresso real em cada instituição.
                        Acerte questões para avançar a barra e ganhe troféus por cada linha completa do gabarito.
                    </p>
                </div>
            </div>

            {providers.length > 0 ? (
                <div className="space-y-12">
                    {providers.map(provider => {
                        const data = providerStats[provider];
                        const progress = data.total > 0 ? (data.correct / data.total) * 100 : 0;
                        const isEverythingCorrect = data.isFullyComplete;

                        return (
                            <div key={provider} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-10 relative">

                                {/* Provider Score Card */}
                                <div className="lg:w-1/3 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-black text-gray-800 tracking-tight">{provider}</h3>
                                        <div className={`p-3 rounded-2xl ${isEverythingCorrect ? 'bg-amber-100 shadow-lg shadow-amber-200' : 'bg-gray-100'}`}>
                                            <span className={`text-3xl ${isEverythingCorrect ? 'animate-bounce' : 'opacity-30 grayscale'}`}>🏆</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Progresso do Exame</span>
                                            <span className="text-2xl font-black text-indigo-600">{data.correct} / {data.total} questões</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs font-medium text-gray-400 italic">
                                            {isEverythingCorrect
                                                ? "Perfeito! Você dominou todas as questões desta instituição."
                                                : `Faltam ${data.total - data.correct} acertos para completar 100%.`}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="text-3xl">🏅</div>
                                        <div>
                                            <div className="text-xl font-black text-slate-700">{data.medals.gabaritos.length}</div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Linhas Completas</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Medals List Grid */}
                                <div className="lg:w-1/3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0 lg:pl-10">
                                    <h4 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-6">Troféus Conquistados</h4>
                                    <div className="flex flex-col gap-3">
                                        {data.medals.gabaritos.length > 0 ? (
                                            data.medals.gabaritos.map((medal: any, i: number) => (
                                                <div key={`${i}`} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 group hover:border-indigo-200 transition-all hover:shadow-md">
                                                    <div className="text-2xl group-hover:scale-110 transition-transform flex-shrink-0">🏆</div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-black text-gray-800 truncate uppercase tracking-tight">{medal.title}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                            Gabarito Master • Sequência 5/5
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                                <span className="text-xs font-bold text-slate-300 uppercase">Nenhuma linha completa ainda</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Huge Trophy for 100% completion */}
                                <div className="lg:w-1/3 flex items-center justify-center p-6 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                    {isEverythingCorrect ? (
                                        <div className="text-center animate-scale-in">
                                            <div className="relative inline-block">
                                                <span className="text-[8rem] drop-shadow-2xl">🏆</span>
                                                <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
                                            </div>
                                            <h4 className="text-2xl font-black text-amber-600 mt-4 uppercase tracking-tighter">Mestre de {provider}</h4>
                                            <p className="text-sm font-bold text-amber-500/70">100% DE APROVEITAMENTO</p>
                                        </div>
                                    ) : (
                                        <div className="text-center opacity-20 filter grayscale">
                                            <span className="text-[6rem]">🏆</span>
                                            <h4 className="text-lg font-black text-slate-400 mt-2 uppercase tracking-tighter">Troféu Mestre</h4>
                                            <p className="text-[10px] font-bold text-slate-400">COMPLETE 100% DO EXAME</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
