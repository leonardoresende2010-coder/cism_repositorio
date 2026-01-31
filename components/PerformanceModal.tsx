import React from 'react';
import { Stats } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from './Button';

interface PerformanceModalProps {
    title: string;
    stats: Stats;
    onClose: () => void;
}

export const PerformanceModal: React.FC<PerformanceModalProps> = ({ title, stats, onClose }) => {
    const data = [
        { name: 'Acertos', value: stats.correct, color: '#10b981' },
        { name: 'Erros', value: stats.incorrect, color: '#f43f5e' },
        { name: 'Pulos', value: stats.skipped, color: '#fbbf24' },
        { name: 'Marcadas', value: stats.flagged, color: '#ef4444' },
    ];

    // Filter out zero values for the chart but keep for the list
    const chartData = data.filter(d => d.value > 0);

    const answered = stats.correct + stats.incorrect;
    const accuracy = answered > 0 ? Math.round((stats.correct / answered) * 100) : 0;
    const progress = Math.round((answered / stats.total) * 100);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-scale-in">
                {/* Header */}
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mt-1">Análise de Desempenho</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Side: Chart */}
                    <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                        <div className="w-full h-64 relative">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-slate-300 font-bold italic text-sm">
                                    Nenhum progresso ainda
                                </div>
                            )}
                            {chartData.length > 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-3xl font-black text-slate-800">{accuracy}%</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Precisão</span>
                                </div>
                            )}
                        </div>

                        <div className="mt-4 w-full grid grid-cols-2 gap-3">
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Questões</p>
                                <p className="text-xl font-black text-slate-800">{stats.total}</p>
                            </div>
                            <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center shadow-sm">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Respondidas</p>
                                <p className="text-xl font-black text-indigo-600">{answered}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Detailed Stats */}
                    <div className="flex flex-col justify-center space-y-4">
                        {data.map((item) => {
                            const percentage = stats.total > 0 ? Math.round((item.value / stats.total) * 100) : 0;
                            return (
                                <div key={item.name} className="group">
                                    <div className="flex justify-between items-end mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }}></div>
                                            <span className="text-sm font-bold text-slate-600 uppercase tracking-wider">{item.name}</span>
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-slate-800">{item.value}</span>
                                            <span className="text-[10px] font-bold text-slate-400">({percentage}%)</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                backgroundColor: item.color,
                                                boxShadow: `0 0 10px ${item.color}40`
                                            }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-6 pt-6 border-t border-slate-100">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Progresso Geral</span>
                                <span className="text-sm font-black text-indigo-600">{progress}%</span>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-1000"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100 flex justify-end">
                    <Button
                        variant="primary"
                        onClick={onClose}
                        className="px-10 rounded-2xl font-black shadow-lg shadow-indigo-200"
                    >
                        Entendido
                    </Button>
                </div>
            </div>
        </div>
    );
};
