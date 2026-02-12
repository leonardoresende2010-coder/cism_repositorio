import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Button } from './components/Button';
import { SidebarProgress } from './components/SidebarProgress';
import { parseContentToBlocks } from './services/parserService';

import { api } from './services/api';
import { AppView, Question, QuizBlock, UserSession, Stats, Workplace } from './types';
import { UploadIllustration, EmptyStateIllustration, SecurityShieldIcon } from './components/Visuals';


import { ExamSelection } from './components/ExamSelection';
import { Rewards } from './components/Rewards';
import { CommunityNotes } from './components/CommunityNotes';
import { StudyGroupsDashboard } from './components/StudyGroupsDashboard';
import { LandingPage } from './components/LandingPage';
import { QuizCard } from './components/QuizCard';
import { PerformanceModal } from './components/PerformanceModal';
import { Pricing } from './components/Pricing';
import { User } from './types';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(api.isAuthenticated());
    // Initial view logic:
    // 1. If not authenticated -> LANDING
    // 2. If authenticated:
    //    - If has quizzes -> DASHBOARD
    //    - If no quizzes -> EXAM_SELECT
    const [currentView, setCurrentView] = useState<AppView>(
        isAuthenticated ? AppView.QUADRO_GERAL : AppView.LANDING
    );
    const [quizzes, setQuizzes] = useState<QuizBlock[]>([]);
    const [workplaces, setWorkplaces] = useState<Workplace[]>([]);

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [session, setSession] = useState<UserSession>({});
    const [studyGroups, setStudyGroups] = useState<any[]>([]);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [generatingQuiz, setGeneratingQuiz] = useState(false);
    const [performanceModalData, setPerformanceModalData] = useState<{ title: string, stats: Stats } | null>(null);
    const [showTrophy, setShowTrophy] = useState(false);
    const [wasMasteredOnStart, setWasMasteredOnStart] = useState(false);

    const loadData = async () => {
        try {
            const [fetchedQuizzes, fetchedProgress, user, groups, fetchedWorkplaces] = await Promise.all([
                api.getQuizzes(),
                api.getProgress(),
                api.getMe(),
                api.getStudyGroups(),
                api.getWorkplaces()
            ]);
            setQuizzes(fetchedQuizzes);
            setSession(fetchedProgress);
            setCurrentUser(user);
            setStudyGroups(groups);
            setWorkplaces(fetchedWorkplaces);
            // Logic: if fetchedQuizzes > 0 => Dashboard. Else => Exam Select
            // Only auto-switch if we are currently in a "default" state or just logged in
            if (currentView !== AppView.QUADRO_GERAL && currentView !== AppView.QUIZ) {
                if (fetchedQuizzes.length > 0) {
                    setCurrentView(AppView.MY_EXAMS);
                } else {
                    setCurrentView(AppView.EXAM_SELECT);
                }
            }
        } catch (err) {
            console.error("Failed to load data from backend:", err);
            // If 401, logout
            if ((err as Error).message === 'Unauthorized') {
                handleLogout();
            }
        }
    };

    // Load from API on mount if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            loadData();

            // Handle Mercado Pago return params
            const params = new URLSearchParams(window.location.search);
            if (params.get('payment') === 'success') {
                alert('Pagamento aprovado! Sua conta PRO foi ativada.');
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            } else if (params.get('payment') === 'failure') {
                alert('O pagamento não foi concluído. Tente novamente.');
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, [isAuthenticated]);

    const handleLogin = () => {
        setIsAuthenticated(true);
        // Force refresh to ensure clean state and avoid rendering issues
        window.location.reload();
    };

    const handleLogout = () => {
        api.logout();
        setIsAuthenticated(false);
        setQuizzes([]);
        setWorkplaces([]);
        setSession({});
        setCurrentView(AppView.EXAM_SELECT); // Reset to Exam Select
        window.location.reload();
    };

    if (!isAuthenticated) {
        if (currentView === AppView.LANDING) {
            return <LandingPage onStart={() => setCurrentView(AppView.UPLOAD)} />; // Will trigger login if redirected to upload while !auth
        }
        return <Login onLogin={handleLogin} />;
    }


    // Remove LocalStorage effects

    const activeQuiz = useMemo(() =>
        quizzes.find(q => q.id === activeQuizId),
        [quizzes, activeQuizId]);

    const currentQuestion = activeQuiz?.questions[currentQuestionIdx];

    // --- Handlers ---
    const handleGoToPricing = () => setCurrentView(AppView.PRICING);
    const handleUpgradeSuccess = async () => {
        setIsLoading(true);
        try {
            await loadData();
            setCurrentView(AppView.QUADRO_GERAL);
        } finally {
            setIsLoading(false);
        }
    };

    const isacaStats = useMemo(() => {
        const provider = 'ISACA';
        let points = 0;
        let trophyCount = 0; // Total count of medals/gabaritos

        quizzes.forEach(quiz => {
            if ((quiz.provider || '').toUpperCase() !== provider) return;

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
                        return s && s.selectedAnswer && q.correctAnswerLabel === q.options.find(o => o.id === s.selectedAnswer)?.label;
                    });
                    if (isRowAllCorrect) {
                        points += 5;
                        trophyCount++;
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
                if (percentage === 100) { points += 25; trophyCount++; }
                else if (percentage >= 80) { points += 10; trophyCount++; }
                else if (percentage >= 70) { points += 5; trophyCount++; }
            }
        });

        const difficulty = points >= 200 ? 'Difícil' : points >= 100 ? 'Médio' : 'Fácil';
        const aiQuizzesCount = quizzes.filter(q => (q.provider || '').toUpperCase() === provider && q.description === 'Gerado por IA').length;
        const canUnlockNew = trophyCount > aiQuizzesCount;

        return { points, difficulty, trophyCount, aiQuizzesCount, canUnlockNew };
    }, [quizzes, session]);

    const handleGenerateAIBlock = async () => {
        if ((currentUser?.is_premium === false)) {
            handleGoToPricing();
            return;
        }

        setGeneratingQuiz(true);
        try {
            const questions = await api.generateAIQuiz(isacaStats.difficulty, 5);
            const title = `Simulado IA - ${isacaStats.difficulty} #${isacaStats.aiQuizzesCount + 1}`;
            const newQuiz = await api.createQuiz(title, questions, 'ISACA', undefined, undefined, 'Gerado por IA');

            setQuizzes(prev => [...prev, newQuiz]);
            alert(`Novo simulado ${isacaStats.difficulty} desbloqueado e gerado com sucesso!`);
            setCurrentView(AppView.MY_EXAMS);
        } catch (err: any) {
            alert("Erro ao gerar simulado com IA: " + err.message);
        } finally {
            setGeneratingQuiz(false);
        }
    };

    const handleCreateWorkplace = async () => {
        const name = window.prompt("Nome do Workplace (ex: Provas CISM):");
        if (!name) return;
        setIsLoading(true);
        try {
            const newWp = await api.createWorkplace(name);
            setWorkplaces(prev => [...prev, { ...newWp, quizzes: [] }]);
        } catch (err: any) {
            if (err.message.includes("403") || err.message.includes("Usuários gratuitos")) {
                handleGoToPricing();
            } else {
                alert("Erro ao criar workplace: " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateEmptyQuiz = async (workplaceId: string) => {
        const title = window.prompt("Nome do novo bloco de questões:");
        if (!title) return;
        setIsLoading(true);
        try {
            const newQuiz = await api.createQuiz(title, [], undefined, undefined, workplaceId);
            setQuizzes(prev => [...prev, newQuiz]);
            setWorkplaces(prev => prev.map(wp =>
                wp.id === workplaceId ? { ...wp, quizzes: [...wp.quizzes, newQuiz] } : wp
            ));
        } catch (err: any) {
            if (err.message.includes("403")) {
                handleGoToPricing();
            } else {
                alert("Erro ao criar bloco: " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDropOnQuiz = async (quizId: string, file: File) => {
        setIsLoading(true);
        try {
            const content = await file.text();
            const newBlocks = parseContentToBlocks(file.name, content, "");
            if (newBlocks.length === 0) {
                alert("Nenhuma questão encontrada no arquivo.");
                return;
            }
            // Combine all questions from all parsed blocks in the file
            const allQuestions = newBlocks.flatMap(b => b.questions);
            const updatedQuiz = await api.updateQuizQuestions(quizId, allQuestions);

            setQuizzes(prev => prev.map(q => q.id === quizId ? updatedQuiz : q));
            setWorkplaces(prev => prev.map(wp => ({
                ...wp,
                quizzes: wp.quizzes.map(q => q.id === quizId ? updatedQuiz : q)
            })));

            alert(`${allQuestions.length} questões adicionadas ao bloco!`);
        } catch (err: any) {
            if (err.message.includes("403")) {
                handleGoToPricing();
            } else {
                alert("Erro ao carregar questões no bloco: " + err.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleMoveQuizToWorkplace = async (quizId: string, workplaceId: string) => {
        setIsLoading(true);
        try {
            await api.moveQuizToWorkplace(quizId, workplaceId);
            await loadData();
        } catch (err: any) {
            alert("Erro ao mover bloco: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleMergeQuizzes = async (targetQuizId: string, sourceQuizId: string) => {
        // Find source quiz name for the confirmation
        const sourceQuiz = quizzes.find(q => q.id === sourceQuizId) ||
            workplaces.flatMap(wp => wp.quizzes).find(q => q.id === sourceQuizId);
        const targetQuiz = quizzes.find(q => q.id === targetQuizId) ||
            workplaces.flatMap(wp => wp.quizzes).find(q => q.id === targetQuizId);

        const confirmed = window.confirm(
            `Mesclar "${sourceQuiz?.title || 'bloco'}" (${sourceQuiz?.questions.length || 0} questões) dentro de "${targetQuiz?.title || 'bloco'}"?\n\nAs questões serão combinadas e o bloco de origem será removido.`
        );
        if (!confirmed) return;

        setIsLoading(true);
        try {
            await api.mergeQuizzes(targetQuizId, sourceQuizId);
            await loadData();
        } catch (err: any) {
            alert("Erro ao mesclar blocos: " + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const processContent = async (filename: string, content: string, provider?: string) => {
        console.log("processContent started for:", filename);

        // Suggest a default name (remove extension and common prefixes)
        const defaultName = filename
            .replace(/^Questoes\s+/i, '')
            .replace(/\.txt$/i, '')
            .replace(/_/g, ' ')
            .trim();

        const customName = window.prompt("Digite um nome para este bloco de questões:", defaultName);

        // If user cancels, we can abort or use default. User said "pergunte", so if they cancel maybe we just abort.
        // Actually, usually cancelling a prompt returns null. Let's use the default if they cancel or leave empty.
        const finalizedName = customName || defaultName;

        setIsLoading(true);
        try {
            if (filename.endsWith('.json')) {
                alert("JSON import currently disabled while moving to Database storage.");
                return;
            }

            const newBlocks = parseContentToBlocks(filename, content, finalizedName);
            console.log("Parser returned blocks:", newBlocks.length);

            if (newBlocks.length === 0) {
                console.warn("No blocks found in content.");
                setUploadError("Nenhuma questão válida encontrada no arquivo. Verifique o formato (QUESTÃO 1, A), B)... Gabarito: A)");
                return;
            }

            const createdQuizzes = [];
            for (const block of newBlocks) {
                console.log(`Saving block: ${block.title} with ${block.questions.length} questions`);
                const savedQuiz = await api.createQuiz(block.title, block.questions, provider, filename);
                createdQuizzes.push(savedQuiz);
            }

            setQuizzes(prev => [...prev, ...createdQuizzes]);
            setCurrentView(AppView.MY_EXAMS); // Go to My Exams instead of Dashboard
            console.log("Import process completed successfully.");
        } catch (err: any) {
            console.error("Failed to process content:", err);
            if (err.message.includes("403")) {
                handleGoToPricing();
            } else {
                setUploadError(`Erro: ${err.message || "Falha ao processar arquivo ou salvar no banco."}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const processFile = async (file: File) => {
        setUploadError(null);
        const reader = new FileReader();

        reader.onload = async (event) => {
            const content = event.target?.result as string;
            await processContent(file.name, content);
        };
        reader.readAsText(file);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    };

    // Drag & Drop Handlers (Keep existing)
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    }, []);


    const startQuiz = (quizId: string) => {
        const quiz = quizzes.find(q => q.id === quizId);
        if (quiz) {
            const stats = calculateQuizStats(quiz);
            const isMastered = stats.correct === stats.total && stats.total > 0;
            setWasMasteredOnStart(isMastered);
        } else {
            setWasMasteredOnStart(false);
        }
        setActiveQuizId(quizId);
        setCurrentView(AppView.QUIZ);
        setCurrentQuestionIdx(0); // Optional: reset to first question
    };

    const handleAnswerSelect = async (optionId: string) => {
        if (!currentQuestion) return;

        // Optimistic Update
        setSession(prev => ({
            ...prev,
            [currentQuestion.id]: {
                ...prev[currentQuestion.id],
                selectedAnswer: optionId
            }
        }));

        // API Call
        await api.updateProgress(currentQuestion.id, { selectedAnswer: optionId });

        // Check for total win (all questions correct)
        if (activeQuiz) {
            const allCorrect = activeQuiz.questions.every(q => {
                const s = q.id === currentQuestion.id ? { selectedAnswer: optionId } : session[q.id];
                if (!s?.selectedAnswer) return false;
                const correctLabel = q.correctAnswerLabel;
                const selectedLabel = q.options.find(o => o.id === s.selectedAnswer)?.label;
                return correctLabel === selectedLabel;
            });

            if (allCorrect && !wasMasteredOnStart) {
                // setShowTrophy(true); // Removido para evitar overlay preto antigo
                setWasMasteredOnStart(true); // Treat as mastered now so it doesn't repeat in same session
            }
        }
    };

    const handleResetQuestion = async () => {
        if (!currentQuestion) return;

        setSession(prev => {
            const copy = { ...prev };
            if (copy[currentQuestion.id]) {
                copy[currentQuestion.id].selectedAnswer = null;
                copy[currentQuestion.id].aiAnalysis = null;
            }
            return copy;
        });

        await api.updateProgress(currentQuestion.id, { selectedAnswer: null, aiAnalysis: null });
    };

    const handleDeleteQuizBlock = async (quizId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Deseja realmente excluir este bloco de questões?")) return;

        setIsLoading(true);
        console.log("Starting deletion for:", quizId);
        try {
            await api.deleteQuiz(quizId);
            console.log("Deletion successful for:", quizId);

            // Re-fetch everything to ensure sync (or update multiple states)
            await loadData();

            // if (updatedQuizzes.length === 0) {
            //     setCurrentView(AppView.EXAM_SELECT);
            // }
        } catch (err) {
            console.error("Deletion failed:", err);
            alert(`Erro ao deletar: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteWorkplace = async (wp: Workplace, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const hasQuizzes = wp.quizzes && wp.quizzes.length > 0;
        const message = hasQuizzes
            ? "Ao deletar o Workplace, TODOS os blocos serão apagados. Confirma?"
            : "Deseja realmente excluir este Workplace vazio?";

        if (!window.confirm(message)) return;

        setIsLoading(true);
        try {
            await api.deleteWorkplace(wp.id);
            await loadData();
        } catch (err) {
            console.error("Deletion failed:", err);
            alert(`Erro ao deletar workplace: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetQuizBlock = async (quizId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!window.confirm("Resetar progresso deste bloco?")) return;

        setIsLoading(true);
        try {
            await api.resetBlockProgress(quizId);

            // Clear local session for these questions
            const quiz = quizzes.find(q => q.id === quizId);
            if (quiz) {
                setSession(prev => {
                    const next = { ...prev };
                    quiz.questions.forEach(q => { delete next[q.id]; });
                    return next;
                });
            }
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert(`Falha ao resetar bloco: ${(err as Error).message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleClearAll = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (window.confirm('Resetar TODO o progresso de todos os exames?')) {
            setIsLoading(true);
            try {
                await api.resetAllProgress();
                setSession({});
                setUploadError(null);
                window.location.reload();
            } catch (err) {
                console.error(err);
                alert(`Falha ao resetar tudo: ${(err as Error).message}`);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleAIAnalysis = async () => {
        if (!currentQuestion) return;

        setIsLoading(true);
        try {
            const analysis = await api.analyzeQuestion(currentQuestion);

            setSession(prev => ({
                ...prev,
                [currentQuestion.id]: {
                    ...prev[currentQuestion.id],
                    aiAnalysis: analysis
                }
            }));

            await api.updateProgress(currentQuestion.id, { aiAnalysis: analysis });
        } catch (error: any) {
            console.error(error);
            if (error.message.includes("403")) {
                handleGoToPricing();
            } else {
                alert("Falha na análise: " + error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFlag = async (type: 'disagreeKey' | 'disagreeAI') => {
        if (!currentQuestion) return;

        const currentFlags = session[currentQuestion.id] || {};
        const updates: any = {};

        if (type === 'disagreeKey') updates.isFlaggedDisagreeKey = !currentFlags.isFlaggedDisagreeKey;
        if (type === 'disagreeAI') updates.isFlaggedDisagreeAI = !currentFlags.isFlaggedDisagreeAI;

        setSession(prev => ({
            ...prev,
            [currentQuestion.id]: {
                ...prev[currentQuestion.id],
                ...updates
            }
        }));

        await api.updateProgress(currentQuestion.id, updates);
    };

    const exportData = () => {
        const data = { session, quizzes };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cism_export_${Date.now()}.json`;
        link.click();
    };

    const handleExamOptionSelect = async (examName: string, mode: 'import' | 'ai', provider?: string) => {
        console.log("App.tsx: handleExamOptionSelect called", examName, mode, provider);

        // Normalize exam name for better matching
        const normalizedSearch = examName.split('(')[0].trim().toUpperCase();

        const alreadyExists = quizzes.some(q => {
            const quizProvider = (q.provider || '').toUpperCase();
            const searchProvider = (provider || '').toUpperCase();
            const quizTitle = q.title.toUpperCase();
            const quizFileName = (q.fileName || '').toUpperCase();

            return quizProvider === searchProvider &&
                (quizTitle.includes(normalizedSearch) || quizFileName.includes(normalizedSearch));
        });

        if (alreadyExists) {
            alert(`Você já tem o exame ${examName} carregado.`);
            return;
        }

        if (mode === 'import') {
            setIsLoading(true);
            try {
                const result = await api.autoloadExam(examName);
                if (result) {
                    await processContent(result.filename, result.content, provider);
                } else {
                    setCurrentView(AppView.UPLOAD);
                }
            } catch (error) {
                console.error("Autoload error:", error);
                alert(`Erro ao tentar carregar exame automaticamente: ${(error as Error).message}`);
                setCurrentView(AppView.UPLOAD);
            } finally {
                setIsLoading(false);
            }
        } else {
            // AI Mode
            const searchProvider = (provider || '').toUpperCase();
            if (searchProvider === 'ISACA') {
                handleGenerateAIBlock();
            } else {
                alert("Geração por IA disponível atualmente apenas para exames ISACA CISM.");
            }
        }
    };

    const handleManualUpload = async (file: File, provider: string) => {
        setIsLoading(true);
        try {
            // 1. Find or create workplace for this institution
            let wp = workplaces.find(w => w.name.toUpperCase() === provider.toUpperCase());

            // For free users, if they already have ANY workplace, reuse it instead of failing to create a new one
            if (!wp && currentUser?.is_premium === false && workplaces.length > 0) {
                wp = workplaces[0];
            }

            let wpId = wp?.id;

            if (!wpId) {
                const newWp = await api.createWorkplace(provider);
                setWorkplaces(prev => [...prev, { ...newWp, quizzes: [] }]);
                wpId = newWp.id;
            }

            // 2. Process the file
            const content = await file.text();

            // Suggest a name
            const defaultName = file.name.replace(/\.txt$/i, '').replace(/_/g, ' ').trim();
            const finalizedName = window.prompt("Nome para este bloco de questões:", defaultName) || defaultName;

            const newBlocks = parseContentToBlocks(file.name, content, finalizedName);
            if (newBlocks.length === 0) {
                alert("Nenhuma questão válida encontrada no arquivo.");
                return;
            }

            const createdQuizzes: QuizBlock[] = [];
            for (const block of newBlocks) {
                const savedQuiz = await api.createQuiz(block.title, block.questions, provider, file.name, wpId);
                createdQuizzes.push(savedQuiz);
            }

            setQuizzes(prev => [...prev, ...createdQuizzes]);
            setWorkplaces(prev => prev.map(w =>
                w.id === wpId ? { ...w, quizzes: [...(w.quizzes || []), ...createdQuizzes] } : w
            ));

            setCurrentView(AppView.MY_EXAMS);
            alert(`${createdQuizzes.length} bloco(s) adicionado(s) ao workplace ${provider}!`);
        } catch (err: any) {
            console.error(err);
            const errMsg = err.message || "";
            if (errMsg.includes("403") || errMsg.includes("Usuários gratuitos") || errMsg.includes("versão completa") || errMsg.includes("apenas 1 workplace")) {
                handleGoToPricing();
            } else {
                alert("Erro no upload: " + errMsg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // --- Render Helpers ---


    const calculateQuizStats = (quiz: QuizBlock): Stats => {
        let correct = 0, incorrect = 0, skipped = 0, flagged = 0;
        quiz.questions.forEach(q => {
            const s = session[q.id];
            if (s && (s.isFlaggedDisagreeKey || s.isFlaggedDisagreeAI)) {
                flagged++;
            }
            if (s && s.selectedAnswer) {
                const isCorrect = q.options.find(o => o.id === s.selectedAnswer)?.label === q.correctAnswerLabel;
                if (isCorrect) correct++;
                else incorrect++;
            } else if (s && (s.selectedAnswer === null)) {
                skipped++;
            }
        });
        return { correct, incorrect, skipped, flagged, total: quiz.questions.length };
    };
    const handleShowWorkplaceStats = (wp: Workplace) => {
        let correct = 0, incorrect = 0, skipped = 0, flagged = 0, total = 0;
        wp.quizzes.forEach(quiz => {
            const s = calculateQuizStats(quiz);
            correct += s.correct;
            incorrect += s.incorrect;
            skipped += s.skipped;
            flagged += s.flagged;
            total += s.total;
        });
        setPerformanceModalData({
            title: wp.name,
            stats: { correct, incorrect, skipped, flagged, total }
        });
    };

    const handleShowQuizStats = (quiz: QuizBlock) => {
        setPerformanceModalData({
            title: quiz.title,
            stats: calculateQuizStats(quiz)
        });
    };



    const renderMyExams = () => {
        return (
            <div className="space-y-12 animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 md:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-200/50 gap-6">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tight">Minha Biblioteca</h2>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-slate-500 font-medium text-lg leading-relaxed">Gerencie seus workplaces e questões.</p>
                            <div className="h-4 w-px bg-slate-200"></div>
                            <button onClick={exportData} className="text-indigo-600 font-bold text-sm hover:underline uppercase tracking-widest flex items-center">
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                Exportar Backup
                            </button>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={handleCreateWorkplace}
                        className="bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 px-10 py-5 h-auto rounded-[1.5rem] text-lg font-black transform transition hover:scale-105 active:scale-95"
                    >
                        <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                        Criar Workplace
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-14">
                    {/* Render Workplaces */}
                    {workplaces.map(wp => (
                        <div key={wp.id} className="relative group/wp">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 px-4 gap-4">
                                <div className="flex items-center gap-5 cursor-pointer group/title" onClick={() => handleShowWorkplaceStats(wp)}>
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-indigo-200 transform group-hover/title:scale-105 group-hover/wp:rotate-3 transition-all duration-500">
                                        <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 01-2-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tight group-hover/title:text-indigo-600 transition-colors uppercase">{wp.name}</h3>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                                {wp.quizzes.length} {wp.quizzes.length === 1 ? 'Bloco' : 'Blocos'}
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={(e) => handleDeleteWorkplace(wp, e)}
                                        className="w-14 h-14 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all duration-300 border-2 border-slate-100 hover:border-rose-100 bg-white shadow-sm"
                                        title="Excluir Workplace"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                    <Button
                                        variant="outline"
                                        onClick={() => handleCreateEmptyQuiz(wp.id)}
                                        className="border-indigo-100 text-indigo-700 hover:bg-indigo-600 hover:text-white font-black bg-white rounded-2xl h-14 px-8 shadow-sm border-2 transition-all duration-300 transform hover:translate-x-1"
                                    >
                                        <svg className="w-5 h-5 mr-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
                                        Novo Bloco de Questão
                                    </Button>
                                </div>
                            </div>

                            <div
                                className="bg-slate-50/50 rounded-[3rem] p-10 border border-slate-200/60 shadow-inner grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 relative overflow-hidden transition-all duration-300"
                                onDragOver={(e) => {
                                    if (e.dataTransfer.types.includes('application/quiz-id')) {
                                        e.preventDefault();
                                        e.currentTarget.classList.add('ring-4', 'ring-indigo-400/30', 'border-indigo-300', 'bg-indigo-50/50');
                                    }
                                }}
                                onDragLeave={(e) => {
                                    e.currentTarget.classList.remove('ring-4', 'ring-indigo-400/30', 'border-indigo-300', 'bg-indigo-50/50');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('ring-4', 'ring-indigo-400/30', 'border-indigo-300', 'bg-indigo-50/50');
                                    const sourceQuizId = e.dataTransfer.getData('application/quiz-id');
                                    if (sourceQuizId) {
                                        handleMoveQuizToWorkplace(sourceQuizId, wp.id);
                                    }
                                }}
                            >
                                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/5 rounded-full -mr-48 -mt-48 blur-[120px] pointer-events-none"></div>

                                {wp.quizzes.length === 0 ? (
                                    <div className="col-span-full py-24 text-center bg-white/40 rounded-[2.5rem] border-4 border-dashed border-slate-200 flex flex-col items-center group/empty transition-colors hover:border-indigo-200">
                                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-slate-200 group-hover/empty:scale-110 transition-transform">
                                            <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                                        </div>
                                        <p className="text-slate-500 font-bold text-xl uppercase tracking-widest">Workplace pronto</p>
                                        <p className="text-slate-400 mt-2 max-w-sm text-lg font-medium">Clique em "Novo Bloco de Questão" ou arraste um bloco desorganizado para cá.</p>
                                    </div>
                                ) : (
                                    wp.quizzes.map(quiz => (
                                        <QuizCard
                                            key={quiz.id}
                                            quiz={quiz}
                                            qStats={calculateQuizStats(quiz)}
                                            onStart={startQuiz}
                                            onShowStats={handleShowQuizStats}
                                            onReset={handleResetQuizBlock}
                                            onDelete={handleDeleteQuizBlock}
                                            onDrop={handleDropOnQuiz}
                                            onQuizDrop={handleMergeQuizzes}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Uncategorized Blocks Section */}
                    {quizzes.filter(q => !q.workplace_id).length > 0 && (
                        <div className="mt-10">
                            <div className="flex items-center space-x-4 mb-4 px-6">
                                <div className="w-3 h-10 rounded-full bg-slate-300 shadow-sm shadow-slate-200"></div>
                                <h4 className="text-xl font-black uppercase tracking-[0.2em] text-slate-500 italic">Arquivos Desorganizados</h4>
                                <div className="flex-1 h-px bg-slate-200"></div>
                            </div>
                            <div className="mb-8 mx-6 px-5 py-3.5 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                    <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" /></svg>
                                </div>
                                <p className="text-sm text-indigo-700 font-medium">
                                    <strong>Dica:</strong> Arraste qualquer bloco abaixo para dentro de um <strong>Workplace</strong> acima para organizá-lo, ou solte sobre um bloco existente para <strong>mesclar</strong> as questões.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-2">
                                {quizzes.filter(q => !q.workplace_id).map(quiz => (
                                    <QuizCard
                                        key={quiz.id}
                                        quiz={quiz}
                                        qStats={calculateQuizStats(quiz)}
                                        onStart={startQuiz}
                                        onShowStats={handleShowQuizStats}
                                        onReset={handleResetQuizBlock}
                                        onDelete={handleDeleteQuizBlock}
                                        onDrop={handleDropOnQuiz}
                                        isDraggable={true}
                                        onQuizDrop={handleMergeQuizzes}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {workplaces.length === 0 && quizzes.length === 0 && (
                        <div className="text-center py-40 bg-white rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center shadow-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-indigo-50/30 -z-10 animate-pulse"></div>
                            <div className="w-32 h-32 bg-indigo-100 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-xl shadow-indigo-100">
                                <svg className="w-16 h-16 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 01-2-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <h3 className="text-4xl font-black text-slate-800 tracking-tight">Comece sua Organização</h3>
                            <p className="text-slate-500 mt-4 max-w-lg text-2xl font-medium leading-relaxed">
                                Crie workplaces para separar suas provas por categorias ou níveis de dificuldade.
                            </p>
                            <Button variant="primary" className="mt-12 px-16 py-6 h-auto rounded-[2rem] text-xl font-black shadow-2xl shadow-indigo-500/30" onClick={handleCreateWorkplace}>
                                Criar meu Primeiro Workplace
                            </Button>
                        </div>
                    )}
                </div>

                {/* Study Groups Section moved to my exams since it is personal management */}
                {studyGroups.length > 0 && (
                    <div className="mt-16 space-y-8">
                        <div className="flex items-center justify-between px-6">
                            <h3 className="text-2xl font-black text-slate-800 flex items-center tracking-tight">
                                <div className="w-10 h-10 bg-purple-100 rounded-2xl flex items-center justify-center mr-4 shadow-sm">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </div>
                                Meus Grupos de Estudo
                            </h3>
                            <Button size="sm" variant="ghost" className="text-indigo-600 font-bold hover:bg-indigo-50" onClick={() => setCurrentView(AppView.STUDY_GROUPS)}>
                                Ver Dashboard Completo →
                            </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
                            {studyGroups.map(group => (
                                <div
                                    key={group.id}
                                    onClick={() => setCurrentView(AppView.STUDY_GROUPS)}
                                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col items-center text-center"
                                >
                                    <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-purple-600 group-hover:text-white transition-all duration-300">
                                        <span className="text-purple-600 font-black text-xl group-hover:text-white uppercase">{group.name.charAt(0)}</span>
                                    </div>
                                    <h4 className="font-black text-slate-800 group-hover:text-purple-600 transition-colors uppercase tracking-widest text-xs">{group.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">{group.members.length} membros ativos</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    const renderUpload = () => (
        <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto animate-scale-in p-4">
            <div className="glass-panel p-12 rounded-3xl shadow-2xl w-full text-center relative overflow-hidden">
                {/* Decorative background blobs */}
                <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
                <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>

                <div className="relative z-10 flex flex-col items-center">
                    <div className="mb-6 w-full flex justify-center">
                        <img
                            src="/img/Import_questions.png"
                            alt="Import Questions"
                            className="max-w-[400px] w-full object-contain"
                        />
                    </div>



                    {uploadError && (
                        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl text-sm flex items-center shadow-sm">
                            <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            <span>{uploadError}</span>
                        </div>
                    )}

                    <label
                        className={`w-full max-w-xl cursor-pointer group transition-all duration-300 transform ${isDragging ? 'scale-105' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <div className={`
                    border-3 border-dashed rounded-2xl p-10 transition-all duration-300 flex flex-col items-center justify-center
                    ${isDragging ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-gray-300 hover:border-indigo-400 hover:bg-white hover:shadow-xl bg-white/50'}
                `}>
                            <div className="p-4 bg-indigo-100 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                                <svg className={`w-10 h-10 text-indigo-600 ${isDragging ? 'animate-bounce' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                            </div>
                            <p className="text-lg text-gray-700 font-semibold mb-1">
                                {isDragging ? 'Solte o arquivo para carregar!' : 'Clique para procurar ou arraste o arquivo aqui'}
                            </p>
                            <p className="text-sm text-gray-400">Suporta exportações .txt e .json</p>
                            <input type="file" className="hidden" accept=".txt,.json" onChange={handleFileUpload} />
                        </div>
                    </label>

                    {quizzes.length > 0 && (
                        <div className="mt-8">
                            <Button variant="ghost" onClick={() => setCurrentView(AppView.QUADRO_GERAL)} className="text-gray-500 hover:text-indigo-600">
                                Cancelar e Voltar ao Início
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderQuiz = () => {
        if (!currentQuestion) return <div>Carregando...</div>;

        const progress = session[currentQuestion.id] || {};
        const isAnswered = !!progress.selectedAnswer;

        return (
            <div className="flex h-full -m-4 lg:-m-8 animate-fade-in">
                {/* Main Quiz Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50 relative">
                    <div className="flex-1 overflow-y-auto p-6 lg:p-12 pb-32 custom-scrollbar">
                        <div className="max-w-4xl mx-auto space-y-8">

                            {/* Question Card */}
                            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 lg:p-10 relative overflow-hidden animate-slide-up">
                                <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-indigo-500 to-purple-600"></div>

                                {/* Decorative Watermark */}
                                <div className="absolute top-4 right-4 opacity-5 pointer-events-none">
                                    <SecurityShieldIcon className="w-24 h-24" />
                                </div>

                                {/* Header with Flags */}
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 gap-2 relative z-10">
                                    <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider">
                                        Questão {currentQuestionIdx + 1}
                                    </span>

                                    <div className="flex flex-wrap gap-2">
                                        {progress.isFlaggedDisagreeKey && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100 animate-pulse">
                                                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                Flag: Gabarito
                                            </span>
                                        )}
                                        {progress.isFlaggedDisagreeAI && (
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-600 border border-orange-100">
                                                <svg className="w-3 h-3 mr-1.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                                Flag: IA
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <p className="text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed whitespace-pre-wrap relative z-10">
                                    {currentQuestion.text}
                                </p>
                            </div>

                            {/* Options Grid */}
                            <div className="grid gap-4 animate-slide-up" style={{ animationDelay: '100ms' }}>
                                {currentQuestion.options.map((option) => {
                                    const isSelected = progress.selectedAnswer === option.id;
                                    const isCorrect = option.label === currentQuestion.correctAnswerLabel;

                                    let cardClass = "bg-white border-gray-200 hover:border-indigo-400 hover:bg-white hover:shadow-md"; // Default
                                    let indicatorClass = "border-gray-300 text-gray-400";
                                    let icon = null;

                                    if (isAnswered) {
                                        if (isCorrect) {
                                            cardClass = "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500 shadow-sm";
                                            indicatorClass = "bg-emerald-500 border-emerald-500 text-white";
                                            icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>;
                                        } else if (isSelected) {
                                            cardClass = "bg-rose-50 border-rose-500 ring-1 ring-rose-500 shadow-sm";
                                            indicatorClass = "bg-rose-500 border-rose-500 text-white";
                                            icon = <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>;
                                        } else {
                                            cardClass = "bg-slate-50 border-slate-100 opacity-60 grayscale";
                                        }
                                    }

                                    return (
                                        <button
                                            key={option.id}
                                            onClick={() => !isAnswered && handleAnswerSelect(option.id)}
                                            disabled={isAnswered}
                                            className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-center group relative overflow-hidden ${cardClass}`}
                                        >
                                            <div className={`shrink-0 mr-5 w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-colors ${indicatorClass}`}>
                                                {icon || option.label}
                                            </div>
                                            <span className={`text-lg text-gray-700 ${isAnswered && isCorrect ? 'font-bold text-emerald-900' : ''}`}>{option.text}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Actions & Tools */}
                            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-6 border-t border-gray-200 animate-slide-up" style={{ animationDelay: '200ms' }}>
                                {isAnswered ? (
                                    <Button variant="ghost" size="sm" onClick={handleResetQuestion} className="text-gray-400 hover:text-gray-600">
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                        Limpar Seleção
                                    </Button>
                                ) : <div></div>}

                                <Button
                                    variant="ai"
                                    size="md"
                                    onClick={handleAIAnalysis}
                                    disabled={isLoading || !!progress.aiAnalysis}
                                    className={`transform transition-transform ${isLoading ? 'scale-105 shadow-xl' : 'hover:scale-105'}`}
                                    icon={
                                        isLoading ?
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    }
                                >
                                    {isLoading ? 'Analisando com IA...' : (progress.aiAnalysis ? 'Ver Insights da IA' : 'Perguntar ao Agente IA')}
                                </Button>
                            </div>

                            {/* Always Visible Feedback Flags */}
                            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-3 sm:space-y-0 animate-slide-up" style={{ animationDelay: '250ms' }}>
                                <div className="flex items-center text-gray-400 font-semibold text-sm uppercase tracking-wider">
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                                    Reportar Problema
                                </div>

                                <label className="flex items-center space-x-3 cursor-pointer group hover:bg-red-50 p-2 rounded-lg transition-colors -ml-2">
                                    <div className="relative flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={progress.isFlaggedDisagreeKey || false}
                                            onChange={() => toggleFlag('disagreeKey')}
                                            className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition cursor-pointer"
                                        />
                                    </div>
                                    <span className={`text-sm ${progress.isFlaggedDisagreeKey ? 'text-red-600 font-bold' : 'text-gray-600 group-hover:text-red-500'}`}>
                                        Discordo do Gabarito
                                    </span>
                                </label>

                                <label className="flex items-center space-x-3 cursor-pointer group hover:bg-orange-50 p-2 rounded-lg transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={progress.isFlaggedDisagreeAI || false}
                                        onChange={() => toggleFlag('disagreeAI')}
                                        className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 transition cursor-pointer"
                                    />
                                    <span className={`text-sm ${progress.isFlaggedDisagreeAI ? 'text-orange-600 font-bold' : 'text-gray-600 group-hover:text-orange-500'}`}>
                                        Discordo da IA
                                    </span>
                                </label>
                            </div>

                            {/* Official Explanation Box */}
                            {isAnswered && currentQuestion.explanation && (
                                <div className="bg-blue-50/50 rounded-2xl border border-blue-100 p-8 animate-slide-up shadow-sm">
                                    <h4 className="font-bold text-blue-900 mb-4 flex items-center text-lg">
                                        <span className="bg-blue-100 p-2 rounded-lg mr-3">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </span>
                                        Explicação Oficial
                                    </h4>
                                    <div className="prose prose-blue max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                                        {currentQuestion.explanation}
                                    </div>
                                </div>
                            )}

                            {/* AI Analysis Box */}
                            {progress.aiAnalysis && (
                                <div className="bg-gradient-to-br from-white to-violet-50 rounded-2xl border border-violet-100 p-8 animate-slide-up shadow-lg shadow-violet-100/50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
                                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-violet-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-4">
                                            <h4 className="font-bold text-violet-900 text-lg flex items-center">
                                                <span className="bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white p-2 rounded-lg mr-3 shadow-md">
                                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
                                                </span>
                                                Insight do Mestre CISM IA
                                            </h4>
                                        </div>
                                        <div className="prose prose-violet max-w-none text-gray-700 whitespace-pre-line leading-relaxed">
                                            {progress.aiAnalysis}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Community Notes Section */}
                            {isAnswered && (
                                <CommunityNotes
                                    questionId={currentQuestion.id}
                                    userName={currentUser?.username || 'Estudante'}
                                    isPremium={currentUser?.is_premium || false}
                                />
                            )}

                        </div>
                    </div>

                    {/* Sticky Footer Navigation - Glassmorphism */}
                    <div className="h-24 bg-white/90 backdrop-blur-md border-t border-gray-200 flex items-center justify-between px-8 shrink-0 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-20 absolute bottom-0 w-full">
                        <Button
                            variant="secondary"
                            disabled={currentQuestionIdx === 0}
                            onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                            className="px-6"
                        >
                            Anterior
                        </Button>

                        <div className="flex flex-col items-center">
                            <div className="text-sm font-bold text-gray-700 hidden sm:block mb-1">
                                Questão {currentQuestionIdx + 1} <span className="text-gray-400 font-normal">de {activeQuiz?.questions.length}</span>
                            </div>
                            <div className="w-48 h-1.5 bg-gray-100 rounded-full overflow-hidden hidden sm:block">
                                <div
                                    className="h-full bg-indigo-500 transition-all duration-300"
                                    style={{ width: `${((currentQuestionIdx + 1) / (activeQuiz?.questions.length || 1)) * 100}%` }}
                                ></div>
                            </div>
                        </div>

                        <Button
                            variant="primary"
                            disabled={!activeQuiz || currentQuestionIdx === activeQuiz.questions.length - 1}
                            onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                            className="px-8 shadow-indigo-200 shadow-lg"
                        >
                            Próxima Questão
                        </Button>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="animate-slide-in-right h-full">
                    <SidebarProgress
                        questions={activeQuiz!.questions}
                        currentQuestionIndex={currentQuestionIdx}
                        session={session}
                        onJumpToQuestion={setCurrentQuestionIdx}
                    />
                </div>
            </div>
        );
    };

    const renderQuadroGeral = () => {
        const navItems = [
            { id: AppView.MY_EXAMS, label: "Meus Exames", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>, color: "bg-indigo-600" },
            { id: AppView.UPLOAD, label: "Importar", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>, color: "bg-slate-800" },
            { id: AppView.EXAM_SELECT, label: "Escolher Exame", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>, color: "bg-slate-800" },
            { id: AppView.REWARDS, label: "Troféus", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M7 10l5 2.5L17 10" /></svg>, color: "bg-slate-800" },
            { id: AppView.STUDY_GROUPS, label: "Grupos de Estudo", icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>, color: "bg-slate-800" },
        ];

        return (
            <div className="min-h-screen bg-[#0a0f1c] flex flex-col items-center justify-center p-6 md:p-12 animate-fade-in relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="w-full max-w-5xl z-10">
                    <div className="flex flex-col items-center mb-12">
                        <img src="/img/Logo_prepwise_semfundo.png" alt="Logo" className="w-48 h-auto mb-8 drop-shadow-2xl animate-float" />
                        <h2 className="text-3xl font-black text-white tracking-tight text-center">
                            Quadro Geral <span className="text-indigo-500">PrepWise</span>
                        </h2>
                        <p className="text-slate-400 mt-2 text-center max-w-md">Gerencie seu aprendizado e acompanhe seu progresso de forma centralizada.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {navItems.map((item, idx) => {
                            const isLocked = !currentUser?.is_premium && (item.id === AppView.STUDY_GROUPS);

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => isLocked ? setCurrentView(AppView.PRICING) : setCurrentView(item.id)}
                                    className={`group relative p-8 rounded-2xl border border-slate-700/50 bg-slate-800/40 backdrop-blur-md flex flex-col items-center text-center transition-all duration-500 hover:bg-slate-800/60 hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(79,70,229,0.3)] animate-slide-up ${isLocked ? 'cursor-pointer' : ''}`}
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    {isLocked && (
                                        <div className="absolute top-4 right-4 bg-amber-500/20 text-amber-500 p-1.5 rounded-lg border border-amber-500/30 z-20">
                                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                                        </div>
                                    )}

                                    <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="text-white">
                                            {item.icon}
                                        </div>
                                    </div>
                                    <h3 className={`text-xl font-bold transition-colors ${isLocked ? 'text-slate-500 group-hover:text-amber-500' : 'text-white group-hover:text-indigo-400'}`}>
                                        {item.label}
                                    </h3>
                                    <div className={`mt-4 w-8 h-1 rounded-full transition-all duration-500 ${isLocked ? 'bg-slate-700 group-hover:bg-amber-500' : 'bg-slate-700 group-hover:w-16 group-hover:bg-indigo-500'}`}></div>

                                    {/* Inner glow effect on hover */}
                                    <div className={`absolute inset-0 rounded-2xl transition-all duration-500 pointer-events-none ${isLocked ? 'group-hover:bg-amber-500/5' : 'group-hover:bg-indigo-500/5'}`}></div>
                                </button>
                            );
                        })}
                    </div>

                    {currentUser && (
                        <div className="mt-16 flex items-center justify-center animate-fade-in [animation-delay:1s]">
                            <div className="bg-slate-900/50 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-800 flex items-center">
                                <span className="text-slate-500 text-sm mr-2">Bem-vindo de volta,</span>
                                <span className="font-black text-white">{currentUser.full_name || currentUser.username}</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 ml-3 animate-pulse"></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* New Trophy Video - Bottom Right */}
                <div className="absolute bottom-10 right-10 pointer-events-none z-30">
                    <video
                        autoPlay
                        loop
                        playsInline
                        className="w-64 h-auto drop-shadow-2xl"
                    >
                        <source src="/img/trofeu_prepwise-2.webm" type="video/webm" />
                    </video>
                </div>
            </div>
        );
    };

    // Render Loading Overlay with Logo
    const renderLoadingOverlay = () => (
        <div className="fixed inset-0 z-[100] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in">
            <div className="relative mb-8">
                {/* Outer pulsing ring */}
                <div className="absolute -inset-8 bg-indigo-100 rounded-full animate-pulse-soft opacity-50 scale-150"></div>

                {/* Logo and Spinners */}
                <div className="relative w-32 h-32 flex items-center justify-center bg-white rounded-full shadow-2xl border border-gray-100">
                    <img
                        src="/img/Logo_prepwise_semfundo.png"
                        alt="PrepWise"
                        className="w-20 h-20 object-contain z-20 animate-float"
                    />
                    <div className="absolute inset-0 border-[6px] border-indigo-50 rounded-full"></div>
                    <div className="absolute inset-0 border-[6px] border-t-indigo-500 rounded-full animate-spin"></div>
                </div>
            </div>

            <div className="text-center">
                <h2 className="text-2xl font-black text-gray-800 tracking-tight">Processando...</h2>
                <div className="flex gap-1 justify-center mt-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
            </div>
        </div>
    );

    // AI Generation Loading
    const renderGenerationLoading = () => (
        <div className="fixed inset-0 z-[100] bg-indigo-900/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in text-white p-8">
            <div className="w-32 h-32 mb-8 relative">
                <div className="absolute inset-0 border-4 border-white/20 rounded-full animate-ping"></div>
                <div className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <img src="/img/Logo_prepwise_semfundo.png" alt="Logo" className="w-20 h-20 invert brightness-0" />
                </div>
            </div>
            <h2 className="text-3xl font-black mb-4">Mestre CISM IA</h2>
            <p className="text-indigo-100 text-center max-w-md text-lg font-medium leading-relaxed">
                Nossa Inteligência Artificial está forjando um simulado exclusivo para você. Isso pode levar alguns segundos...
            </p>
        </div>
    );

    const renderTrophyOverlay = () => (
        <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center animate-fade-in">
            <button
                onClick={() => setShowTrophy(false)}
                className="absolute top-8 right-8 z-[210] text-white hover:text-indigo-400 transition-colors p-4"
                title="Fechar Troféu"
            >
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            <div className="relative w-full h-full flex items-center justify-center">
                <video
                    autoPlay
                    src="/img/trofeu_prepwise.mp4"
                    className="max-h-full max-w-full object-contain shadow-2xl"
                    onEnded={() => setShowTrophy(false)}
                />

                <div className="absolute bottom-12 left-0 w-full flex flex-col items-center pointer-events-none">
                    <h2 className="text-5xl font-black text-white tracking-widest uppercase mb-4 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">
                        Mestra do CISM!
                    </h2>
                    <p className="text-indigo-400 font-bold text-xl uppercase tracking-[0.3em] drop-shadow-md">
                        Você gabaritou este bloco!
                    </p>
                </div>
            </div>
        </div>
    );

    return (
        <Layout currentView={currentView} onChangeView={setCurrentView} onLogout={handleLogout} user={currentUser}>
            {isLoading && renderLoadingOverlay()}
            {generatingQuiz && renderGenerationLoading()}
            {showTrophy && renderTrophyOverlay()}
            {currentView === AppView.QUADRO_GERAL && renderQuadroGeral()}
            {currentView === AppView.PRICING && (
                <Pricing
                    onUpgradeSuccess={handleUpgradeSuccess}
                    onBack={() => setCurrentView(AppView.QUADRO_GERAL)}
                />
            )}
            {currentView === AppView.EXAM_SELECT && (
                <ExamSelection
                    onSelectOption={handleExamOptionSelect}
                    onManualUpload={handleManualUpload}
                />
            )}
            {currentView === AppView.UPLOAD && renderUpload()}
            {currentView === AppView.REWARDS && <Rewards quizzes={quizzes} session={session} />}
            {currentView === AppView.MY_EXAMS && renderMyExams()}
            {currentView === AppView.STUDY_GROUPS && (
                <div className="max-w-7xl mx-auto">
                    <StudyGroupsDashboard />
                </div>
            )}
            {currentView === AppView.QUIZ && activeQuiz && renderQuiz()}
            {performanceModalData && (
                <PerformanceModal
                    title={performanceModalData.title}
                    stats={performanceModalData.stats}
                    onClose={() => setPerformanceModalData(null)}
                />
            )}
        </Layout>
    );
}

export default App;