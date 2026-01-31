import React from 'react';
import { Button } from './Button';
import { AppView } from '../types';

interface LayoutProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  onLogout: () => void;
  user?: any;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, onLogout, user, children }) => {
  const isFullScreen = currentView === AppView.QUADRO_GERAL || currentView === AppView.PRICING;

  return (
    <div className={`min-h-screen flex bg-gray-50 overflow-hidden ${isFullScreen ? 'p-0' : ''}`}>
      {/* Sidebar */}
      {!isFullScreen && (
        <aside className="w-20 lg:w-80 bg-slate-900 text-white flex flex-col items-center lg:items-start transition-all duration-300 shrink-0 z-20">
          <div className="flex items-center justify-center w-full border-b border-slate-800 py-10 px-6">
            <img src="/img/Logo_prepwise_semfundo.png" alt="PrepWise Logo" className="w-full h-auto object-contain" />
          </div>

          <nav className="flex-1 w-full p-4 space-y-2">
            <NavItem
              active={currentView === AppView.QUADRO_GERAL}
              onClick={() => onChangeView(AppView.QUADRO_GERAL)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
              label="Quadro Geral"
            />
            <NavItem
              active={currentView === AppView.MY_EXAMS}
              onClick={() => onChangeView(AppView.MY_EXAMS)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
              label="Meus Exames"
            />
            <NavItem
              active={currentView === AppView.UPLOAD}
              onClick={() => onChangeView(AppView.UPLOAD)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>}
              label="Importar"
            />
            <NavItem
              active={currentView === AppView.EXAM_SELECT}
              onClick={() => onChangeView(AppView.EXAM_SELECT)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
              label="Escolher Exame"
            />
            <NavItem
              active={currentView === AppView.REWARDS}
              onClick={() => onChangeView(AppView.REWARDS)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M7 10l5 2.5L17 10" /></svg>}
              label="Troféus"
            />
            <NavItem
              active={currentView === AppView.STUDY_GROUPS}
              onClick={() => onChangeView(AppView.STUDY_GROUPS)}
              icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
              label="Grupos de Estudo"
            />
          </nav>

          <div className="p-4 border-t border-slate-800 w-full space-y-4">
            {user && (
              <div className="px-3 py-3 mb-2 flex items-center bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                  {(user.full_name || user.username).charAt(0).toUpperCase()}
                </div>
                <div className="ml-3 hidden lg:block overflow-hidden">
                  <p className="text-xs font-bold text-white truncate">{user.full_name || user.username}</p>
                  <p className="text-[10px] text-slate-400 truncate opacity-70">{user.email || 'Estudante'}</p>
                </div>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full flex items-center p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors group"
              title="Sair"
            >
              <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="ml-3 hidden lg:block font-medium">Sair</span>
            </button>

            <div className="bg-slate-800 rounded-lg p-3 text-xs text-slate-400">
              <p className="hidden lg:block">Powered by Google Gemini</p>
              <p className="lg:hidden text-center">AI</p>
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {!isFullScreen && (
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm shrink-0">
            <h1 className="text-xl font-bold text-gray-800">
              {currentView === AppView.MY_EXAMS && "Meus Exames"}
              {currentView === AppView.UPLOAD && "Importar Conteúdo"}
              {currentView === AppView.EXAM_SELECT && "Escolha seu Desafio"}
              {currentView === AppView.REWARDS && "Conquistas e Troféus"}
              {currentView === AppView.QUIZ && "Simulador de Exame"}
              {currentView === AppView.STUDY_GROUPS && "Meus Grupos de Estudo"}
            </h1>
            <div className="flex items-center space-x-4">
              {/* Header Actions could go here */}
            </div>
          </header>
        )}

        <div className={`flex-1 overflow-auto relative ${isFullScreen ? 'p-0' : 'p-4 lg:p-8'}`}>
          <div key={currentView} className="h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-lg transition-colors ${active
      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
  >
    {icon}
    <span className="ml-3 hidden lg:block font-medium">{label}</span>
  </button>
);
