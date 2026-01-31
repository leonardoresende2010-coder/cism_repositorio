import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './Button';

interface StudyGroup {
    id: string;
    name?: string;
    is_named?: boolean;
    members: string[];
    notes_count: number;
    questions_count: number;
    members_stats: {
        username: string;
        exists: boolean;
        quizzes: {
            title: string;
            provider: string | null;
            total_questions: number;
            answered_questions: number;
            progress_percent: number;
        }[];
    }[];
}

export const StudyGroupsDashboard: React.FC = () => {
    const [groups, setGroups] = useState<StudyGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        setIsLoading(true);
        try {
            const data = await api.getStudyGroupsDashboard();
            setGroups(data);
        } catch (error) {
            console.error('Erro ao carregar grupos:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <svg className="animate-spin h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="bg-purple-50 border-2 border-dashed border-purple-200 rounded-3xl p-12 max-w-2xl mx-auto">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-xl font-bold text-purple-900 mb-2">Nenhum Grupo de Estudo Criado</h3>
                    <p className="text-purple-700 mb-6">
                        Crie grupos privados ao compartilhar dicas com colegas específicos!
                    </p>
                    <div className="bg-white rounded-xl p-4 text-left text-sm text-purple-800">
                        <p className="font-semibold mb-2">💡 Como criar um grupo:</p>
                        <ol className="list-decimal list-inside space-y-1">
                            <li>Responda uma questão em qualquer quiz</li>
                            <li>Vá até "Dicas da Comunidade"</li>
                            <li>Selecione "👥 Grupo de Estudo"</li>
                            <li>Adicione os usernames dos seus colegas</li>
                            <li>Compartilhe sua dica!</li>
                        </ol>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                    👥 Meus Grupos de Estudo
                </h2>
                <span className="bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-semibold">
                    {groups.length} {groups.length === 1 ? 'Grupo' : 'Grupos'}
                </span>
            </div>

            <div className="grid gap-6">
                {groups.map((group) => (
                    <div key={group.id} className="bg-white border border-purple-200 rounded-2xl shadow-sm overflow-hidden">
                        {/* Header */}
                        <div
                            className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-100 cursor-pointer hover:bg-purple-100 transition-colors"
                            onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-bold text-purple-900">
                                            {group.is_named ? `📂 ${group.name}` : `👥 Grupo: ${group.members.join(', ')}`}
                                        </h3>
                                        <span className="bg-purple-200 text-purple-800 px-2 py-1 rounded-full text-xs font-semibold">
                                            {group.members.length} {group.members.length === 1 ? 'membro' : 'membros'}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-sm text-purple-700">
                                        <span>💬 {group.notes_count} {group.notes_count === 1 ? 'dica' : 'dicas'}</span>
                                        <span>❓ {group.questions_count} {group.questions_count === 1 ? 'questão' : 'questões'}</span>
                                    </div>
                                </div>
                                <svg
                                    className={`w-6 h-6 text-purple-600 transition-transform ${expandedGroup === group.id ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {/* Expanded Content */}
                        {expandedGroup === group.id && (
                            <div className="p-6 space-y-6">
                                {group.members_stats.map((member) => (
                                    <div key={member.username} className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {member.username.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-900">{member.username}</h4>
                                                    {!member.exists && (
                                                        <span className="text-xs text-red-600">Usuário não encontrado</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-slate-600">
                                                {member.quizzes.length} {member.quizzes.length === 1 ? 'quiz' : 'quizzes'}
                                            </div>
                                        </div>

                                        {member.quizzes.length > 0 ? (
                                            <div className="space-y-3">
                                                {member.quizzes.map((quiz, idx) => (
                                                    <div key={idx} className="bg-white rounded-lg p-3 border border-slate-200">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-semibold text-sm text-gray-900">{quiz.title}</span>
                                                            {quiz.provider && (
                                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                                                    {quiz.provider}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all"
                                                                    style={{ width: `${quiz.progress_percent}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-600">
                                                                {quiz.answered_questions}/{quiz.total_questions}
                                                            </span>
                                                            <span className="text-xs font-bold text-indigo-600">
                                                                {quiz.progress_percent}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">Nenhum quiz iniciado ainda</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
