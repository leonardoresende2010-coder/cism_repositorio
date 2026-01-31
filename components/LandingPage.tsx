import React from 'react';
import { Button } from './Button';

interface LandingPageProps {
    onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
    return (
        <div className="h-screen w-screen bg-black flex flex-col items-center justify-end pb-12 md:pb-24 relative overflow-hidden">
            {/* Video Background */}
            <video
                autoPlay
                muted
                loop
                playsInline
                src="/img/landing.mp4"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none z-0"
            >
                Seu navegador não suporta vídeos.
            </video>

            {/* Cinematic Overlay - Darker at bottom for button readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 z-10 pointer-events-none"></div>

            <div className="relative z-20 w-full text-center px-6">
                {/* CTA Section */}
                <div className="flex flex-col items-center space-y-6 animate-slide-up style-support-opacity-1">
                    <Button
                        onClick={onStart}
                        size="lg"
                        className="px-16 py-8 text-2xl font-black rounded-3xl shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95 bg-indigo-600 text-white border border-indigo-400/30 backdrop-blur-sm"
                    >
                        Começar Agora
                    </Button>
                    <p className="text-white/80 font-bold uppercase tracking-[0.2em] text-xs pb-2">
                        PrepWise AI • Otimize seu Futuro
                    </p>
                </div>
            </div>

            <style>{`
                .style-support-opacity-1 {
                    animation-fill-mode: forwards;
                }
                @keyframes slide-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
