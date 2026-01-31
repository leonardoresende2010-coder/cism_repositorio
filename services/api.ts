import { QuizBlock, UserSession, UserProgress, Workplace } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

let ACCESS_TOKEN = localStorage.getItem('access_token');

const getHeaders = () => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ACCESS_TOKEN) {
        headers['Authorization'] = `Bearer ${ACCESS_TOKEN}`;
    }
    return headers;
};

export const api = {
    // --- Auth ---
    async login(username: string, password: string): Promise<void> {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await fetch(`${API_URL}/token`, {
                method: 'POST',
                body: formData, // OAuth2 expects form data
            });

            if (!response.ok) {
                if (response.status === 401) throw new Error('Usuário ou senha incorretos');
                throw new Error('Falha no login');
            }
            const data = await response.json();
            ACCESS_TOKEN = data.access_token;
            localStorage.setItem('access_token', ACCESS_TOKEN || '');
        } catch (err: any) {
            if (err.message === 'Failed to fetch') {
                throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
            }
            throw err;
        }
    },

    async register(username: string, password: string, fullName: string, email: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, full_name: fullName, email }),
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Registration failed');
        }
    },

    async googleLogin(token: string): Promise<void> {
        const response = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || 'Google Login failed');
        }
        const data = await response.json();
        ACCESS_TOKEN = data.access_token;
        localStorage.setItem('access_token', ACCESS_TOKEN || '');
    },

    logout(): void {
        ACCESS_TOKEN = null;
        localStorage.removeItem('access_token');
    },

    isAuthenticated(): boolean {
        return !!ACCESS_TOKEN;
    },

    async getMe(): Promise<any> {
        const response = await fetch(`${API_URL}/users/me`, { headers: getHeaders() });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch user data');
        return await response.json();
    },

    async validateUsername(username: string): Promise<{ exists: boolean, username: string }> {
        const response = await fetch(`${API_URL}/users/validate/${encodeURIComponent(username)}`, {
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to validate username');
        return await response.json();
    },

    async upgradeUser(): Promise<any> {
        const response = await fetch(`${API_URL}/users/upgrade`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Upgrade failed');
        }
        return await response.json();
    },

    async createPaymentPreference(): Promise<{ preference_id: string, init_point: string }> {
        const response = await fetch(`${API_URL}/payments/create-preference`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'Falha ao criar preferência de pagamento');
        }
        return await response.json();
    },

    async getStudyGroupsDashboard(): Promise<any[]> {
        const response = await fetch(`${API_URL}/study-groups/dashboard`, {
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch study groups');
        return await response.json();
    },

    async createStudyGroup(name: string, members: string[]): Promise<any> {
        const response = await fetch(`${API_URL}/study-groups/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name, members }),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to create study group');
        return await response.json();
    },

    async getWorkplaces(): Promise<Workplace[]> {
        const response = await fetch(`${API_URL}/workplaces/`, {
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch workplaces');
        const data = await response.json();

        // Map inner quizzes
        return data.map((wp: any) => ({
            ...wp,
            quizzes: wp.quizzes.map((quiz: any) => ({
                ...quiz,
                fileName: quiz.file_name || '',
                timestamp: quiz.created_at,
                questions: quiz.questions.map((q: any) => ({
                    id: q.id,
                    text: q.text,
                    options: q.options,
                    correctAnswerLabel: q.correct_answer_label,
                    explanation: q.explanation
                }))
            }))
        }));
    },

    async createWorkplace(name: string): Promise<Workplace> {
        const response = await fetch(`${API_URL}/workplaces/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ name }),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.detail || 'Failed to create workplace');
        }
        return await response.json();
    },

    async deleteWorkplace(id: string): Promise<void> {
        const response = await fetch(`${API_URL}/workplaces/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to delete workplace');
    },

    async getStudyGroups(): Promise<any[]> {
        const response = await fetch(`${API_URL}/study-groups/`, {
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch study groups');
        return await response.json();
    },

    // --- Quizzes ---
    async getQuizzes(): Promise<QuizBlock[]> {
        const response = await fetch(`${API_URL}/quizzes/`, { headers: getHeaders() });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch quizzes');
        const data = await response.json();

        // Map backend snake_case to frontend camelCase
        return data.map((quiz: any) => ({
            ...quiz,
            provider: quiz.provider,
            fileName: quiz.file_name || '',
            description: quiz.description,
            workplace_id: quiz.workplace_id,
            timestamp: quiz.created_at,
            questions: quiz.questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                options: q.options,
                correctAnswerLabel: q.correct_answer_label,
                explanation: q.explanation
            }))
        }));
    },

    async createQuiz(title: string, questions: any[], provider?: string, fileName?: string, workplaceId?: string, description?: string): Promise<QuizBlock> {
        // Map frontend camelCase to backend snake_case
        const backendQuestions = questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correct_answer_label: q.correctAnswerLabel,
            explanation: q.explanation
        }));

        const response = await fetch(`${API_URL}/quizzes/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ title, questions: backendQuestions, provider, file_name: fileName, workplace_id: workplaceId, description }),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to create quiz');

        const quiz = await response.json();

        // Map response back to frontend
        return {
            ...quiz,
            timestamp: quiz.created_at,
            questions: quiz.questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                options: q.options,
                correctAnswerLabel: q.correct_answer_label,
                explanation: q.explanation
            }))
        };
    },

    async updateQuizQuestions(quizId: string, questions: any[]): Promise<QuizBlock> {
        const backendQuestions = questions.map(q => ({
            id: q.id,
            text: q.text,
            options: q.options,
            correct_answer_label: q.correctAnswerLabel,
            explanation: q.explanation
        }));

        const response = await fetch(`${API_URL}/quizzes/${quizId}/questions`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ questions: backendQuestions }),
        });

        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to update quiz questions');

        const quiz = await response.json();
        return {
            ...quiz,
            timestamp: quiz.created_at,
            questions: quiz.questions.map((q: any) => ({
                id: q.id,
                text: q.text,
                options: q.options,
                correctAnswerLabel: q.correct_answer_label,
                explanation: q.explanation
            }))
        };
    },

    async deleteQuiz(quizId: string): Promise<void> {
        const response = await fetch(`${API_URL}/quizzes/${quizId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || 'Failed to delete quiz');
        }
    },

    // --- Progress ---
    async getProgress(): Promise<UserSession> {
        const response = await fetch(`${API_URL}/progress/`, { headers: getHeaders() });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch progress');
        const progressList = await response.json();

        // Convert list back to UserSession map
        const session: UserSession = {};
        progressList.forEach((p: any) => {
            session[p.question_id] = {
                selectedAnswer: p.selected_answer,
                isFlaggedDisagreeKey: p.is_flagged_disagree_key,
                isFlaggedDisagreeAI: p.is_flagged_disagree_ai,
                aiAnalysis: p.ai_analysis
            };
        });
        return session;
    },

    async updateProgress(questionId: string, updates: Partial<UserProgress>): Promise<void> {
        // Backend expects snake_case
        const payload = {
            question_id: questionId,
            selected_answer: updates.selectedAnswer !== undefined ? updates.selectedAnswer : undefined,
            is_flagged_disagree_key: updates.isFlaggedDisagreeKey !== undefined ? updates.isFlaggedDisagreeKey : undefined,
            is_flagged_disagree_ai: updates.isFlaggedDisagreeAI !== undefined ? updates.isFlaggedDisagreeAI : undefined,
            ai_analysis: updates.aiAnalysis !== undefined ? updates.aiAnalysis : undefined
        };

        // Clean undefined values
        Object.keys(payload).forEach(key => (payload as any)[key] === undefined && delete (payload as any)[key]);

        const response = await fetch(`${API_URL}/progress/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to update progress');
    },

    async resetBlockProgress(quizId: string): Promise<void> {
        const response = await fetch(`${API_URL}/progress/reset-block/${quizId}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to reset block progress');
    },

    async resetAllProgress(): Promise<void> {
        const response = await fetch(`${API_URL}/progress/reset-all`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to reset all progress');
    },

    async getAvailableExams(): Promise<Record<string, string[]>> {
        const response = await fetch(`${API_URL}/exams/available`, {
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch available exams');
        return await response.json();
    },

    async analyzeQuestion(question: any): Promise<string> {
        // Map frontend back to backend schema if needed, but 'question' is already mostly compatible
        // EXCEPT: options might be cleaner, and snake_case mapping
        const payload = {
            id: question.id,
            text: question.text,
            options: question.options,
            correct_answer_label: question.correctAnswerLabel,
            explanation: question.explanation
        };

        const response = await fetch(`${API_URL}/ai/analyze`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload)
        });

        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('AI Analysis failed');

        return await response.json();
    },

    async autoloadExam(examName: string): Promise<{ content: string; filename: string } | null> {
        const response = await fetch(`${API_URL}/exams/autoload/${examName}`, {
            headers: getHeaders(),
        });

        if (response.status === 404) return null; // File not found, handle gracefully
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail || 'Failed to autoload exam');
        }

        return await response.json();
    },

    async generateAIQuiz(difficulty: string = "Médio", count: number = 5): Promise<any[]> {
        const response = await fetch(`${API_URL}/ai/generate?difficulty=${encodeURIComponent(difficulty)}&count=${count}`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || 'AI Quiz Generation failed');
        }
        const questions = await response.json();
        // Map backend snake_case to frontend camelCase if needed
        return questions.map((q: any) => ({
            ...q,
            correctAnswerLabel: q.correct_answer_label
        }));
    },

    // --- Community Notes ---
    async getCommunityNotes(questionId: string): Promise<any[]> {
        const response = await fetch(`${API_URL}/community-notes/${questionId}`, { headers: getHeaders() });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to fetch community notes');
        return await response.json();
    },

    async createCommunityNote(
        questionId: string,
        userName: string,
        content: string,
        visibility: 'public' | 'group' = 'public',
        sharedWith?: string[]
    ): Promise<any> {
        const response = await fetch(`${API_URL}/community-notes/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                question_id: questionId,
                user_name: userName,
                content,
                visibility,
                shared_with: sharedWith
            }),
        });
        if (response.status === 401) throw new Error('Unauthorized');
        if (!response.ok) throw new Error('Failed to create community note');
        return await response.json();
    }
};
