import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Button } from './Button';
import { CommunityNote } from '../types';

interface CommunityNotesProps {
    questionId: string;
    userName: string;
    isPremium: boolean;
}

export const CommunityNotes: React.FC<CommunityNotesProps> = ({ questionId, userName, isPremium }) => {
    const [notes, setNotes] = useState<CommunityNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Study Group state
    const [visibility, setVisibility] = useState<'public' | 'group'>('public');
    const [sharedWithInput, setSharedWithInput] = useState('');
    const [sharedWith, setSharedWith] = useState<string[]>([]);
    const [validatingUser, setValidatingUser] = useState(false);
    const [validationMessage, setValidationMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Named Study Groups state
    const [existingGroups, setExistingGroups] = useState<any[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string>('');
    const [newGroupName, setNewGroupName] = useState('');
    const [isSavingGroup, setIsSavingGroup] = useState(false);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const [notesData, groupsData] = await Promise.all([
                api.getCommunityNotes(questionId),
                api.getStudyGroups()
            ]);
            setNotes(notesData);
            setExistingGroups(groupsData);
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, [questionId]);

    const handleSubmit = async () => {
        if (!newNote.trim()) return;

        setIsSubmitting(true);
        try {
            const savedNote = await api.createCommunityNote(
                questionId,
                userName,
                newNote,
                visibility,
                visibility === 'group' ? sharedWith : undefined
            );
            setNotes(prev => [savedNote, ...prev]);
            setNewNote('');
            setSharedWith([]);
            setSharedWithInput('');
            setVisibility('public');
        } catch (error) {
            console.error('Erro ao salvar nota:', error);
            alert('Não foi possível compartilhar sua dica no momento.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR');
    };

    const validateAndAddUsername = async () => {
        const username = sharedWithInput.trim();
        if (!username) return;

        // Check if already added
        if (sharedWith.includes(username)) {
            setValidationMessage({ type: 'error', text: `${username} já foi adicionado!` });
            setTimeout(() => setValidationMessage(null), 3000);
            return;
        }

        // Validate with backend
        setValidatingUser(true);
        setValidationMessage(null);
        try {
            const result = await api.validateUsername(username);
            if (result.exists) {
                setSharedWith(prev => [...prev, username]);
                setSharedWithInput('');
                setValidationMessage({ type: 'success', text: `${username} adicionado!` });
                setTimeout(() => setValidationMessage(null), 2000);
            } else {
                setValidationMessage({ type: 'error', text: `Usuário "${username}" não encontrado!` });
            }
        } catch (error) {
            console.error('Erro ao validar usuário:', error);
            setValidationMessage({ type: 'error', text: 'Erro ao validar usuário' });
        } finally {
            setValidatingUser(false);
        }
    };

    const handleRemoveUsername = (username: string) => {
        setSharedWith(prev => prev.filter(u => u !== username));
    };

    const handleSelectGroup = (groupId: string) => {
        setSelectedGroupId(groupId);
        if (groupId === '') {
            setSharedWith([]);
        } else {
            const group = existingGroups.find(g => g.id === groupId);
            if (group) {
                setSharedWith(group.members);
            }
        }
    };

    const handleSaveGroup = async () => {
        if (!newGroupName.trim() || sharedWith.length === 0) return;

        setIsSavingGroup(true);
        try {
            const group = await api.createStudyGroup(newGroupName, sharedWith);
            setExistingGroups(prev => [...prev, group]);
            setSelectedGroupId(group.id);
            setNewGroupName('');
            setValidationMessage({ type: 'success', text: `Grupo "${group.name}" salvo!` });
            setTimeout(() => setValidationMessage(null), 3000);
        } catch (error) {
            console.error('Erro ao salvar grupo:', error);
            setValidationMessage({ type: 'error', text: 'Não foi possível salvar o grupo.' });
        } finally {
            setIsSavingGroup(false);
        }
    };

    return (
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 animate-slide-up shadow-sm space-y-6">
            <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800 text-lg flex items-center">
                    <span className="bg-amber-100 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                    </span>
                    Dicas da Comunidade
                </h4>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{notes.length} {notes.length === 1 ? 'Dica' : 'Dicas'}</span>
            </div>

            {/* Notes List */}
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <svg className="animate-spin h-6 w-6 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : notes.length > 0 ? (
                    notes.map((note) => (
                        <div key={note.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-indigo-600 text-sm">{note.user_name}</span>
                                    {note.visibility === 'group' && (
                                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold">
                                            🔒 Grupo
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-slate-400">{formatDate(note.created_at)}</span>
                            </div>
                            <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {note.content}
                            </p>
                            {note.visibility === 'group' && note.shared_with && note.shared_with.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-500 mb-1">Compartilhado com:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {note.shared_with.map((username) => (
                                            <span key={username} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                {username}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl">
                        <p className="text-slate-500 font-medium">Seja o primeiro a deixar uma dica para seus colegas!</p>
                    </div>
                )}
            </div>

            {/* Input Section */}
            <div className="pt-4 border-t border-slate-200 space-y-4">
                {/* Visibility Selector */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setVisibility('public')}
                        className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all ${visibility === 'public'
                            ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                            : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-300'
                            }`}
                    >
                        🌍 Público
                    </button>
                    <button
                        onClick={() => {
                            if (!isPremium) {
                                alert("Grupos de Estudo estão disponíveis apenas na versão completa.");
                                return;
                            }
                            setVisibility('group');
                        }}
                        className={`flex-1 py-2 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${visibility === 'group'
                            ? 'bg-purple-100 text-purple-700 border-2 border-purple-300'
                            : 'bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-300'
                            }`}
                    >
                        👥 Grupo de Estudo
                        {!isPremium && (
                            <svg className="w-3 h-3 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        )}
                    </button>
                </div>

                {/* Study Group Members Input */}
                {visibility === 'group' && (
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-4">
                        {/* Selector para grupos existentes */}
                        {existingGroups.length > 0 && (
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-purple-700 uppercase">
                                    Meus Grupos Salvos:
                                </label>
                                <select
                                    value={selectedGroupId}
                                    onChange={(e) => handleSelectGroup(e.target.value)}
                                    className="w-full bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                >
                                    <option value="">-- Selecione ou monte um novo --</option>
                                    {existingGroups.map(group => (
                                        <option key={group.id} value={group.id}>{group.name} ({group.members.length} membros)</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-purple-700 uppercase">
                                {selectedGroupId ? 'Membros do Grupo:' : 'Montar Novo Grupo (digite usernames):'}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={sharedWithInput}
                                    onChange={(e) => setSharedWithInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && validateAndAddUsername()}
                                    placeholder="Digite o username..."
                                    className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                                />
                                <button
                                    onClick={validateAndAddUsername}
                                    disabled={validatingUser}
                                    className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {validatingUser ? '...' : '+ Adicionar'}
                                </button>
                            </div>
                        </div>

                        {validationMessage && (
                            <div className={`text-sm px-3 py-2 rounded-lg ${validationMessage.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}>
                                {validationMessage.text}
                            </div>
                        )}

                        {sharedWith.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {sharedWith.map((username) => (
                                        <span
                                            key={username}
                                            className="inline-flex items-center gap-1 bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium"
                                        >
                                            {username}
                                            <button
                                                onClick={() => handleRemoveUsername(username)}
                                                className="ml-1 text-purple-600 hover:text-purple-900"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>

                                {/* Opção para salvar esse grupo se ainda não for um grupo salvo */}
                                {!selectedGroupId && sharedWith.length > 0 && (
                                    <div className="pt-3 border-t border-purple-100 flex flex-col sm:flex-row gap-2">
                                        <input
                                            type="text"
                                            value={newGroupName}
                                            onChange={(e) => setNewGroupName(e.target.value)}
                                            placeholder="Nome para salvar este grupo..."
                                            className="flex-1 bg-white border border-purple-200 rounded-lg px-3 py-2 text-sm outline-none"
                                        />
                                        <button
                                            onClick={handleSaveGroup}
                                            disabled={isSavingGroup || !newGroupName.trim()}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 disabled:opacity-50"
                                        >
                                            {isSavingGroup ? 'Salvando...' : 'Salvar Grupo'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Note Input */}
                <div className="relative">
                    <textarea
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Compartilhe um macete ou dica sobre esta questão..."
                        className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all min-h-[100px] resize-none"
                    />
                    <div className="absolute bottom-3 right-3">
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !newNote.trim() || (visibility === 'group' && sharedWith.length === 0)}
                            className="shadow-md"
                        >
                            {isSubmitting ? 'Enviando...' : 'Compartilhar Macete'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};
