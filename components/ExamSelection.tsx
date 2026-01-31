import React, { useState } from 'react';
import { Button } from './Button';

interface ExamSelectionProps {
    onSelectOption: (exam: string, mode: 'import' | 'ai', provider?: string) => void;
    onManualUpload: (file: File, provider: string) => void;
}

export const ExamSelection: React.FC<ExamSelectionProps> = ({ onSelectOption, onManualUpload }) => {
    const [selectedInstitution, setSelectedInstitution] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);

    const institutions = [
        { id: 'ISACA', name: 'ISACA', color: 'bg-red-500', icon: '🛡️' },
        { id: 'COMPTIA', name: 'CompTIA', color: 'bg-blue-500', icon: '💻' },
        { id: 'MICROSOFT', name: 'Microsoft', color: 'bg-emerald-500', icon: '🪟' },
        { id: 'ISC2', name: 'ISC2', color: 'bg-indigo-500', icon: '🔐' },
        { id: 'EXIN', name: 'EXIN', color: 'bg-slate-700', icon: '📝' }
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedInstitution) {
            onManualUpload(file, selectedInstitution);
        } else if (!selectedInstitution) {
            alert("Por favor, selecione primeiro a instituição.");
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && selectedInstitution) {
            onManualUpload(file, selectedInstitution);
        } else if (!selectedInstitution) {
            alert("Por favor, selecione primeiro a instituição.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-4xl mx-auto animate-fade-in p-6">
            <div className="bg-white/90 backdrop-blur-xl p-12 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] w-full border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600"></div>

                <div className="relative z-10 text-center mb-10">
                    <h2 className="text-4xl font-black text-slate-900 mb-3 tracking-tight">
                        Escolha seu <span className="text-indigo-600">Desafio</span>
                    </h2>
                    <p className="text-slate-500 text-lg font-medium">Prepare-se para o sucesso com simulados personalizados.</p>
                </div>

                <div className="space-y-8 max-w-2xl mx-auto">
                    {/* Institution Selector */}
                    <div className="space-y-3">
                        <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Instituição do Exame</label>
                        <div className="relative group">
                            <select
                                value={selectedInstitution}
                                onChange={(e) => setSelectedInstitution(e.target.value)}
                                className="w-full h-16 pl-6 pr-12 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg font-bold text-slate-800 appearance-none cursor-pointer"
                            >
                                <option value="" disabled>Selecione a instituição...</option>
                                {institutions.map(inst => (
                                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-500 group-hover:translate-y-[-40%] transition-transform">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                            </div>
                        </div>
                    </div>

                    {/* Upload Section */}
                    <div className={`transition-all duration-500 ${selectedInstitution ? 'opacity-100 translate-y-0' : 'opacity-40 pointer-events-none translate-y-4'}`}>
                        <div className="space-y-3">
                            <label className="text-sm font-black uppercase tracking-widest text-slate-400 ml-1">Questões do Simulado</label>
                            <label
                                onDragOver={handleFileChange}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`
                                    relative border-3 border-dashed rounded-[2rem] p-12 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group
                                    ${isDragging ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50 bg-slate-50'}
                                `}
                            >
                                <div className="absolute top-0 right-0 p-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform group-hover:scale-110 group-hover:rotate-6 ${selectedInstitution ? institutions.find(i => i.id === selectedInstitution)?.color : 'bg-slate-300'}`}>
                                        <span className="text-2xl">{selectedInstitution ? institutions.find(i => i.id === selectedInstitution)?.icon : '❔'}</span>
                                    </div>
                                </div>

                                <div className="w-20 h-20 bg-indigo-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-indigo-100/50">
                                    <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>

                                <h3 className="text-xl font-black text-slate-800 mb-2">
                                    {isDragging ? 'Solte o arquivo agora!' : 'Carregar arquivo de questões'}
                                </h3>
                                <p className="text-slate-500 text-center font-medium max-w-xs">
                                    Arraste seu arquivo <span className="text-indigo-600 font-bold">.txt</span> com as questões formatadas para começar.
                                </p>

                                <input type="file" className="hidden" accept=".txt" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    {/* AI Generation Option (Keep it as a secondary path) */}
                    {selectedInstitution === 'ISACA' && (
                        <div className="pt-4 animate-slide-up">
                            <div
                                onClick={() => onSelectOption('ISACA CISM', 'ai', 'ISACA')}
                                className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 shadow-xl text-white hover:scale-[1.02] transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="flex items-center gap-6 relative z-10">
                                    <div className="flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl group-hover:scale-110 transition-transform">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black mb-1">Gerar com IA Expert (Mestre CISM)</h3>
                                        <p className="text-sm text-indigo-100 opacity-80 font-medium">Não tem questões? Nossa IA cria um simulado adaptativo para você.</p>
                                    </div>
                                    <svg className="w-6 h-6 text-white/50 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 5l7 7-7 7" /></svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
