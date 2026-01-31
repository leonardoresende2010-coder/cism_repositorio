import React from 'react';
import { Button } from './Button';
import { api } from '../services/api';

interface PricingProps {
    onUpgradeSuccess: () => void;
    onBack: () => void;
}

export const Pricing: React.FC<PricingProps> = ({ onUpgradeSuccess, onBack }) => {
    const [showPayment, setShowPayment] = React.useState(false);
    const [loading, setLoading] = React.useState(false);

    const handleUpgrade = async () => {
        try {
            await api.upgradeUser();
            onUpgradeSuccess();
        } catch (err) {
            alert('Falha ao processar upgrade. Tente novamente mais tarde.');
        }
    };

    const handleMercadoPagoPayment = async () => {
        setLoading(true);
        try {
            const { init_point } = await api.createPaymentPreference();
            // Redirect to Mercado Pago Checkout Pro
            window.location.href = init_point;
        } catch (err: any) {
            alert(err.message || 'Erro ao iniciar pagamento. Verifique se o backend está configurado.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0f1c] text-white p-6 md:p-12 animate-fade-in flex flex-col items-center justify-center relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-6xl w-full z-10">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
                        Escolha o seu <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Plano</span>
                    </h1>
                    <p className="text-slate-400 text-xl max-w-2xl mx-auto">
                        Desbloqueie todo o potencial da Inteligência Artificial e maximize sua aprovação no CISM.
                    </p>
                </div>

                {!showPayment ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch max-w-4xl mx-auto">
                        {/* Free Plan */}
                        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-10 flex flex-col transition-all hover:border-slate-700">
                            <div className="mb-8">
                                <span className="text-slate-400 text-sm font-black uppercase tracking-widest bg-slate-800 px-4 py-1.5 rounded-full mb-4 inline-block">
                                    Iniciante
                                </span>
                                <h2 className="text-3xl font-black mt-2">Plano Grátis</h2>
                                <div className="flex items-baseline mt-4">
                                    <span className="text-4xl font-black">R$ 0</span>
                                    <span className="text-slate-500 ml-2">/ para sempre</span>
                                </div>
                            </div>

                            <ul className="space-y-5 flex-1 mb-10">
                                <FeatureItem label="1 Workplace disponível" included />
                                <FeatureItem label="1 Bloco de questões" included />
                                <FeatureItem label="Até 20 questões por bloco" included />
                                <FeatureItem label="Acesso a comentários públicos" included />
                                <FeatureItem label="Simulador oficial IA" disabled label_dis="Bloqueado" />
                                <FeatureItem label="Grupos de Estudo" disabled label_dis="Bloqueado" />
                                <FeatureItem label="Suporte Prioritário" disabled label_dis="Bloqueado" />
                            </ul>

                            <Button
                                variant="outline"
                                onClick={onBack}
                                className="w-full py-6 rounded-2xl border-slate-700 text-slate-400 hover:bg-slate-800 font-black cursor-pointer"
                            >
                                Continuar com Limites
                            </Button>
                        </div>

                        {/* Pro Plan */}
                        <div className="relative">
                            {/* Popular Badge */}
                            <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] px-6 py-2 rounded-full shadow-2xl z-20 whitespace-nowrap border-4 border-[#0a0f1c]">
                                MAIS POPULAR
                            </div>

                            <div className="h-full bg-gradient-to-b from-indigo-600/20 to-indigo-900/20 backdrop-blur-3xl border-2 border-indigo-500 rounded-[3rem] p-10 flex flex-col shadow-[0_30px_60px_-15px_rgba(79,70,229,0.3)] transform md:scale-105 transition-all">
                                <div className="mb-8">
                                    <span className="text-indigo-400 text-sm font-black uppercase tracking-widest bg-indigo-500/20 px-4 py-1.5 rounded-full mb-4 inline-block">
                                        MEMBRO PRO
                                    </span>
                                    <h2 className="text-3xl font-black mt-2">Versão Completa</h2>
                                    <div className="flex items-baseline mt-4">
                                        <span className="text-5xl font-black">R$ 50</span>
                                        <span className="text-indigo-300/60 ml-2">/ por 6 meses</span>
                                    </div>
                                </div>

                                <ul className="space-y-5 flex-1 mb-10">
                                    <FeatureItem label="Workplaces Ilimitados" isPremium included />
                                    <FeatureItem label="Blocos de Questões Ilimitados" isPremium included />
                                    <FeatureItem label="Importações Sem Limites" isPremium included />
                                    <FeatureItem label="Grupos de Estudo & Networking" isPremium included />
                                    <FeatureItem label="Análise Profunda com IA" isPremium included />
                                    <FeatureItem label="Backup de Segurança em Nuvem" isPremium included />
                                    <FeatureItem label="Dashboard de Performance Avançado" isPremium included />
                                </ul>

                                <Button
                                    variant="primary"
                                    onClick={handleMercadoPagoPayment}
                                    disabled={loading}
                                    className={`w-full py-8 rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/40 text-lg font-black transform active:scale-95 transition-all mb-4 ${loading ? 'opacity-70 cursor-wait' : ''}`}
                                >
                                    {loading ? 'Processando...' : 'Adquirir Acesso Total'}
                                </Button>

                                <div className="flex items-center justify-center gap-3">
                                    <img src="/img/mercadopago_logo.png" alt="Mercado Pago" className="h-4 opacity-50 grayscale hover:grayscale-0 transition-all cursor-help" title="Pagamento processado pelo Mercado Pago" />
                                    <p className="text-[10px] text-center text-indigo-300/40 font-bold uppercase tracking-widest">
                                        Pagamento seguro via PIX ou Cartão
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-md mx-auto bg-slate-900/80 backdrop-blur-2xl border border-indigo-500/30 rounded-[3.5rem] p-10 text-center animate-scale-in">
                        <h2 className="text-3xl font-black mb-6">Finalizar Pagamento</h2>
                        <div className="bg-white p-6 rounded-[2.5rem] mb-8 inline-block shadow-2xl shadow-indigo-500/20">
                            <img src="/img/pix_qr_code_mockup.png" alt="PIX QR Code" className="w-64 h-64 object-contain" />
                        </div>
                        <p className="text-slate-400 mb-8 font-medium">
                            Escaneie o código PIX acima com o app do seu banco para ativar sua conta PRO instantaneamente.
                        </p>
                        <div className="space-y-4">
                            <Button
                                variant="primary"
                                onClick={handleUpgrade}
                                className="w-full py-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 font-black text-lg"
                            >
                                Já realizei o pagamento
                            </Button>
                            <button
                                onClick={() => setShowPayment(false)}
                                className="text-slate-500 hover:text-white font-bold text-sm uppercase tracking-widest transition-colors"
                            >
                                Voltar
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-20 flex justify-center">
                    <button onClick={onBack} className="text-slate-500 hover:text-white transition-colors flex items-center gap-2 font-bold group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                        Voltar para o Início
                    </button>
                </div>
            </div>
        </div>
    );
};

const FeatureItem = ({ label, included, disabled, label_dis, isPremium }: any) => (
    <li className={`flex items-center gap-4 ${disabled ? 'opacity-40' : ''}`}>
        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${included ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
            {included ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            )}
        </div>
        <span className={`text-sm font-medium ${isPremium ? 'text-indigo-100' : 'text-slate-300'}`}>
            {label}
        </span>
        {label_dis && (
            <span className="text-[8px] font-black uppercase tracking-widest bg-slate-800 px-2 py-0.5 rounded text-slate-500 ml-auto leading-none">
                {label_dis}
            </span>
        )}
    </li>
);
