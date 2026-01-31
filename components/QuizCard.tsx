import React, { useState } from 'react';
import { QuizBlock } from '../types';
import { Button } from './Button';

interface QuizCardProps {
    quiz: QuizBlock;
    qStats: any;
    onStart: (id: string) => void;
    onShowStats: (quiz: QuizBlock) => void;
    onReset: (id: string, e: React.MouseEvent) => void;
    onDelete: (id: string, e: React.MouseEvent) => void;
    onDrop: (id: string, file: File) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({
    quiz,
    qStats,
    onStart,
    onShowStats,
    onReset,
    onDelete,
    onDrop
}) => {
    const answered = qStats.correct + qStats.incorrect;
    const progressPerc = Math.round((answered / qStats.total) * 100);
    const successPerc = answered > 0 ? Math.round((qStats.correct / answered) * 100) : 0;

    const [isCardDragging, setIsCardDragging] = useState(false);

    return (
        <div
            onClick={() => onShowStats(quiz)}
            onDragOver={(e) => { e.preventDefault(); setIsCardDragging(true); }}
            onDragLeave={() => setIsCardDragging(false)}
            onDrop={(e) => {
                e.preventDefault();
                setIsCardDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) onDrop(quiz.id, file);
            }}
            className={`bg-white p-6 rounded-[2rem] border-2 transition-all duration-300 flex flex-col group cursor-pointer relative overflow-hidden h-full ${isCardDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02] shadow-2xl ring-4 ring-indigo-500/20' : 'border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-200 hover:-translate-y-1'
                }`}
        >
            <div className="absolute left-0 top-0 w-2 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>

            {isCardDragging && (
                <div className="absolute inset-0 bg-indigo-600/10 flex flex-col items-center justify-center z-50 pointer-events-none backdrop-blur-[2px]">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl animate-bounce">
                        <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                    </div>
                    <span className="text-indigo-800 font-black uppercase text-xs mt-4 tracking-[0.2em] bg-white px-4 py-1.5 rounded-full shadow-sm">Solte o arquivo</span>
                </div>
            )}

            <div className="flex justify-between items-start mb-5">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-black text-slate-800 text-xl leading-tight group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {quiz.title}
                        </h4>
                        {quiz.questions.length === 0 && (
                            <span className="shrink-0 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg uppercase shadow-sm">Vazio</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                            {quiz.questions.length} Questões
                        </span>
                    </div>
                </div>
                {answered > 0 && (
                    <div className={`shrink-0 w-12 h-12 rounded-2xl flex flex-col items-center justify-center font-black text-sm border-2 ${successPerc >= 70 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                        successPerc >= 50 ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-rose-50 border-rose-100 text-rose-600'
                        }`}>
                        {successPerc}%
                    </div>
                )}
            </div>

            <div className="mt-auto">
                {answered > 0 ? (
                    <div className="mb-6">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                            <span>Performance</span>
                            <span>{progressPerc}% Concluído</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 ring-1 ring-slate-200/50">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-700 ease-out"
                                style={{ width: `${progressPerc}%` }}
                            ></div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-6 py-6 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 group-hover:border-indigo-100 group-hover:bg-indigo-50/30 transition-all duration-300">
                        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        <span className="text-[11px] font-black uppercase tracking-widest">Arraste o TXT</span>
                    </div>
                )}

                <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                        <button
                            onClick={(e) => { e.stopPropagation(); onReset(quiz.id, e); }}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-indigo-100"
                            title="Resetar"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(quiz.id, e); }}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-200 border border-transparent hover:border-rose-100"
                            title="Excluir"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                    <Button
                        variant="primary"
                        disabled={quiz.questions.length === 0}
                        className={`font-black flex-1 rounded-2xl shadow-lg h-12 transition-all duration-300 ${quiz.questions.length === 0 ? 'opacity-40 grayscale' : 'hover:scale-[1.03] active:scale-95'}`}
                        onClick={(e) => { e.stopPropagation(); onStart(quiz.id); }}
                    >
                        {progressPerc > 0 ? (progressPerc === 100 ? 'Revisar' : 'Continuar') : 'Iniciar'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
