import React, { useState } from 'react';
import { api } from '../services/api';

interface LoginProps {
    onLogin: () => void;
}

declare global {
    interface Window {
        google: any;
    }
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (isRegistering) {
                await api.register(username, password, fullName, email);
                setIsRegistering(false);
                setError('Registration successful! Please sign in.');
                // Using error for success msg temporarily or add new state? 
                // Let's add simple feedback.
            } else {
                await api.login(username, password);
                onLogin();
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleCallback = async (response: any) => {
        setLoading(true);
        try {
            await api.googleLogin(response.credential);
            onLogin();
        } catch (err: any) {
            setError(err.message || 'Google Login failed');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

        if (!clientId) {
            console.warn("Missing VITE_GOOGLE_CLIENT_ID environment variable for Google Login.");
            return;
        }

        const initializeGoogleLogin = () => {
            if (window.google?.accounts?.id) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: handleGoogleCallback
                });

                const btn = document.getElementById("google-login-btn");
                if (btn) {
                    window.google.accounts.id.renderButton(
                        btn,
                        { theme: "outline", size: "large", width: "100%" }
                    );
                }
            }
        };

        if (window.google?.accounts?.id) {
            initializeGoogleLogin();
        } else {
            const interval = setInterval(() => {
                if (window.google?.accounts?.id) {
                    initializeGoogleLogin();
                    clearInterval(interval);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, [isRegistering]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1c] relative overflow-hidden p-6">
            {/* Background Decor - Premium Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

            <div className="w-full max-w-[440px] relative z-10 animate-scale-in">
                {/* Logo Section */}
                <div className="flex justify-center mb-10">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <img src="/img/Logo_prepwise_semfundo.png" alt="PrepWise Logo" className="h-48 w-48 object-contain relative z-10 animate-float" />
                    </div>
                </div>

                <div className="bg-slate-900/40 backdrop-blur-2xl p-8 lg:p-12 rounded-[3.5rem] border border-slate-800 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)]">
                    <div className="mb-10 text-center">
                        <h2 className="text-4xl font-black text-white tracking-tight mb-3">
                            {isRegistering ? 'Criar Conta' : 'PrepWise 2.0'}
                        </h2>
                        <p className="text-slate-400 font-medium text-sm">
                            {isRegistering ? 'Sua jornada para o CISM começa agora.' : 'Acesse sua plataforma de estudos inteligente.'}
                        </p>
                    </div>

                    {error && (
                        <div className={`mb-8 p-4 rounded-2xl text-xs font-bold border flex items-center animate-shake ${error.includes('successful') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                            <span className="mr-3 text-lg">{error.includes('successful') ? '✨' : '⚠️'}</span> {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 ml-1">Usuário</label>
                            <input
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-slate-600 text-white"
                                placeholder="ex: leonardo"
                            />
                        </div>

                        {isRegistering && (
                            <>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-slate-600 text-white"
                                        placeholder="Seu Nome"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 ml-1">Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-slate-600 text-white"
                                        placeholder="seu@email.com"
                                    />
                                </div>
                            </>
                        )}

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-1 ml-1">Senha</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-800 focus:border-indigo-500 outline-none transition-all duration-300 placeholder-slate-600 text-white"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg rounded-2xl shadow-[0_15px_30px_-5px_rgba(79,70,229,0.4)] transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                        >
                            {loading ? (
                                <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (isRegistering ? 'Começar Agora' : 'Explorar Plataforma')}
                        </button>

                        {!isRegistering && (
                            <>
                                <div className="relative flex py-6 items-center">
                                    <div className="flex-grow border-t border-slate-800"></div>
                                    <span className="flex-shrink-0 mx-6 text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Ou</span>
                                    <div className="flex-grow border-t border-slate-800"></div>
                                </div>

                                <div id="google-login-btn" className="w-full flex justify-center hover:scale-[1.02] transition-transform duration-200"></div>
                            </>
                        )}
                    </form>

                    <div className="mt-12 text-center">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-2">
                            {isRegistering ? 'Já possui conta?' : "Ainda não é membro?"}
                        </p>
                        <button
                            onClick={() => setIsRegistering(!isRegistering)}
                            className="text-indigo-400 hover:text-white font-black text-sm uppercase tracking-[0.1em] transition-all"
                        >
                            {isRegistering ? 'Fazer Login' : 'Criar Conta Gratuita →'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
