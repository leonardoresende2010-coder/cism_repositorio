import React from 'react';

export const UploadIllustration = () => (
  <svg className="w-64 h-64 animate-float" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="200" cy="150" r="120" fill="#EEF2FF" />
    <path d="M280 220H120C114.477 220 110 215.523 110 210V140C110 134.477 114.477 130 120 130H150L170 100H230L250 130H280C285.523 130 290 134.477 290 140V210C290 215.523 285.523 220 280 220Z" fill="white" stroke="#6366F1" strokeWidth="4" />
    <path d="M200 190C216.569 190 230 176.569 230 160C230 143.431 216.569 130 200 130C183.431 130 170 143.431 170 160C170 176.569 183.431 190 200 190Z" stroke="#6366F1" strokeWidth="4" />
    <path d="M190 110V70M190 70L170 90M190 70L210 90" stroke="#818CF8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce" />
    <rect x="130" y="240" width="140" height="10" rx="5" fill="#E0E7FF" />
    <rect x="150" y="260" width="100" height="10" rx="5" fill="#E0E7FF" />
    
    {/* Floating elements */}
    <circle cx="320" cy="80" r="15" fill="#C7D2FE" className="animate-pulse" />
    <rect x="60" y="100" width="20" height="20" rx="4" fill="#C7D2FE" transform="rotate(-15 70 110)" />
  </svg>
);

export const EmptyStateIllustration = () => (
  <svg className="w-48 h-48 mx-auto opacity-75" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="100" cy="100" r="80" fill="#F3F4F6" />
    <path d="M60 140V80C60 74.4772 64.4772 70 70 70H130C135.523 70 140 74.4772 140 80V140" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
    <path d="M60 140H140" stroke="#9CA3AF" strokeWidth="4" strokeLinecap="round" />
    <path d="M80 100H120" stroke="#D1D5DB" strokeWidth="4" strokeLinecap="round" />
    <path d="M80 120H110" stroke="#D1D5DB" strokeWidth="4" strokeLinecap="round" />
    <circle cx="140" cy="140" r="20" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="3" />
    <path d="M140 130V140M140 145V146" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const SecurityShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" fill="url(#paint0_linear)" stroke="#4F46E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="paint0_linear" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366F1"/>
        <stop offset="1" stopColor="#4338CA"/>
      </linearGradient>
    </defs>
  </svg>
);
