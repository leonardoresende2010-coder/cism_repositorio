import React from 'react';
import { QuizBlock, UserSession } from '../types';

interface RewardsProps {
    quizzes: QuizBlock[];
    session: UserSession;
}

const POINT_VALUES = {
    diamond: 25,
    silver: 10,
    bronze: 5
};

export const Rewards: React.FC<RewardsProps> = ({ quizzes, session }) => {

    const calculateProviderStats = () => {
        const stats: Record<string, {
            points: number,
            medals: { diamond: any[], silver: any[], bronze: any[], gabaritos: any[] },
            sequenceMedals: number
        }> = {};

        quizzes.forEach(quiz => {
            const provider = quiz.provider || 'Outros';
            if (!stats[provider]) {
                stats[provider] = {
                    points: 0,
                    medals: { diamond: [], silver: [], bronze: [], gabaritos: [] },
                    sequenceMedals: 0
                } as any;
            }

            const total = quiz.questions.length;
            let correctCount = 0;
            let answeredCount = 0;

            // 1. Calculate Sequence Medals (Rows of 5)
            const reversedQuestions = [...quiz.questions].reverse();
            for (let i = 0; i < reversedQuestions.length; i += 5) {
                const row = reversedQuestions.slice(i, i + 5);
                if (row.length === 5) {
                    const isRowAllCorrect = row.every(q => {
                        const s = session[q.id];
                        if (!s || !s.selectedAnswer) return false;
                        return q.correctAnswerLabel === q.options.find(o => o.id === s.selectedAnswer)?.label;
                    });
                    if (isRowAllCorrect) {
                        stats[provider].sequenceMedals++;
                        stats[provider].points += 5;
                        stats[provider].medals.gabaritos.push({
                            title: quiz.title,
                            type: 'Gabarito'
                        });
                    }
                }
            }

            // 2. Calculate Overall Quiz Stats
            quiz.questions.forEach(q => {
                const progress = session[q.id];
                if (progress && progress.selectedAnswer) {
                    answeredCount++;
                    const isCorrect = q.options.find(o => o.id === progress.selectedAnswer)?.label === q.correctAnswerLabel;
                    if (isCorrect) correctCount++;
                }
            });

            // 3. Award Percentage-Based Medals
            if (answeredCount === total && total > 0) {
                const percentage = (correctCount / total) * 100;
                const info = { title: quiz.title, score: percentage.toFixed(1) };

                if (percentage === 100) {
                    stats[provider].medals.diamond.push(info);
                    stats[provider].points += POINT_VALUES.diamond;
                } else if (percentage >= 80) {
                    stats[provider].medals.silver.push(info);
                    stats[provider].points += POINT_VALUES.silver;
                } else if (percentage >= 70) {
                    stats[provider].medals.bronze.push(info);
                    stats[provider].points += POINT_VALUES.bronze;
                }
            }
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
                <div className="relative z-10">
                    <h2 className="text-4xl font-black mb-3">Sua Estante de Troféus</h2>
                    <p className="text-slate-400 text-lg max-w-2xl">
                        Acumule pontos em cada instituição para desbloquear o troféu.
                        Diamante (25 pts), Prata (10 pts), Bronze (5 pts) e Sequências (5 pts).
                    </p>
                </div>
            </div>

            {providers.length > 0 ? (
                <div className="space-y-12">
                    {providers.map(provider => {
                        const data = providerStats[provider];
                        const progress = Math.min((data.points / 100) * 100, 100);
                        const isUnlocked = data.points >= 100;

                        return (
                            <div key={provider} className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-10">
                                {/* Provider Score Card */}
                                <div className="lg:w-1/3 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-3xl font-black text-gray-800 tracking-tight">{provider}</h3>
                                        {isUnlocked ? (
                                            <div className="bg-amber-100 p-3 rounded-2xl animate-bounce shadow-lg shadow-amber-200">
                                                <span className="text-3xl">🏆</span>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-100 p-3 rounded-2xl grayscale">
                                                <span className="text-3xl opacity-30">🏆</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Progresso para o Troféu</span>
                                            <span className="text-2xl font-black text-indigo-600">{data.points} / 100 pts</span>
                                        </div>
                                        <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner border border-gray-200">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out ${isUnlocked ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}
                                                style={{ width: `${progress}%` }}
                                            ></div>
                                        </div>
                                        <p className="text-xs font-medium text-gray-400 italic">
                                            {isUnlocked
                                                ? "Parabéns! Você alcançou o nível mestre nesta instituição."
                                                : `Faltam ${100 - data.points} pontos para você liberar o troféu.`}
                                        </p>

                                        {provider.toUpperCase() === 'ISACA' && (
                                            <div className="mt-4 p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                                                <div className="flex justify-between items-center text-xs font-bold text-indigo-700 uppercase tracking-tight">
                                                    <span>Nível IA:</span>
                                                    <span className="bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                                                        {data.points >= 200 ? 'Difícil' : data.points >= 100 ? 'Médio' : 'Fácil'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-indigo-400 mt-1 leading-tight">
                                                    Cada troféu conquistado libera um novo simulado gerado por IA para você.
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <MiniStat count={data.medals.diamond.length} icon="💎" label="Diam" color="text-cyan-500" />
                                        <MiniStat count={data.medals.silver.length} icon="🥈" label="Prata" color="text-slate-400" />
                                        <MiniStat count={data.medals.bronze.length} icon="🥉" label="Bronz" color="text-orange-600" />
                                        <MiniStat count={data.sequenceMedals} icon="🏆" label="Gabar" color="text-indigo-500" />
                                    </div>
                                </div>

                                {/* Medals List Grid */}
                                <div className="lg:w-2/3 border-t lg:border-t-0 lg:border-l border-gray-100 pt-8 lg:pt-0 lg:pl-10">
                                    <h4 className="text-sm font-black text-gray-300 uppercase tracking-widest mb-6">Troféus Conquistados</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Master Trophy Card */}
                                        {isUnlocked && (
                                            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 rounded-2xl flex items-center gap-4 border-none shadow-lg shadow-amber-200 animate-bounce-soft col-span-full">
                                                <div className="text-3xl">🏆</div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-black text-white uppercase tracking-tight">Troféu de Mestre {provider}</div>
                                                    <div className="text-[10px] font-bold text-amber-50 uppercase opacity-90">Meta de 100 Pontos Atingida!</div>
                                                </div>
                                            </div>
                                        )}

                                        {Object.entries(data.medals).map(([type, list]) => (
                                            list.map((medal: any, i: number) => (
                                                <div key={`${type}-${i}`} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100 group hover:border-indigo-200 transition-all hover:shadow-lg hover:scale-[1.02]">
                                                    <div className="text-3xl group-hover:scale-110 transition-transform flex-shrink-0">
                                                        {type === 'gabaritos' ? '🏆' :
                                                            type === 'diamond' ? '💎' :
                                                                type === 'silver' ? '🥈' : '🥉'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-sm font-black text-gray-800 truncate uppercase tracking-tight">{medal.title}</div>
                                                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                                            {type === 'gabaritos' ? 'Gabarito Master' : `${type} Acerto`}
                                                            {medal.score ? ` • ${medal.score}%` : ' • Sequência 5/5'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ))}

                                    </div>
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
                        Complete simulados por instituição para acumular pontos e ganhar seus primeiros troféus de mestre!
                    </p>
                </div>
            )}
        </div>
    );
};

const MiniStat = ({ count, icon, label, color }: any) => (
    <div className="bg-gray-50 p-2 rounded-xl text-center border border-gray-100">
        <div className="text-sm">{icon}</div>
        <div className={`text-sm font-black ${color}`}>{count}</div>
        <div className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter leading-none">{label}</div>
    </div>
);
