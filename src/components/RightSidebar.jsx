import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RightSidebar = ({
  desaName,
  themeName = "PETA TEMATIK",
  themeIcon = "/pict/des-can.png",
  isOpen = true,
  setIsOpen = () => {},
  children // Ini untuk legenda, grafik, atau info dinamis lainnya
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1010] md:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div
        className={`bg-white/95 backdrop-blur-md shadow-[-8px_0_24px_rgba(0,0,0,0.08)] z-[1020] flex flex-col h-full border-l border-gray-200/60 shrink-0 w-[85vw] max-w-[320px] md:w-[260px] fixed md:relative right-0 top-0 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
      >
        {/* Pull-tab Handle for Mobile */}
        {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className="md:hidden absolute top-1/2 -left-10 w-10 h-16 bg-white/95 backdrop-blur-md shadow-[-4px_0_12px_rgba(0,0,0,0.1)] rounded-l-2xl border border-r-0 border-gray-200/60 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-gray-50 transition-all z-[1030] -translate-y-1/2"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        )}

        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-100/80 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 text-white shrink-0 relative overflow-hidden">
          <div className="absolute -right-4 -top-8 opacity-10 pointer-events-none">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2z"/>
            </svg>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h2 className="font-bold text-base tracking-wide">Panel Informasi</h2>
          </div>
          {/* Close Button Mobile */}
          <button 
            onClick={() => setIsOpen(false)}
            className="md:hidden relative z-10 p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/70 flex flex-col">

          {/* Logo & Deskripsi Desa */}
          <div className="px-4 py-3 bg-white border-b border-gray-100/80 flex flex-col items-center gap-2 text-center">
            <div className="flex justify-center items-end gap-2 h-10">
              <img src="/pict/petis-darjo.png" alt="Sidoarjo" className="h-9 w-auto object-contain drop-shadow-sm" />
              {/* Show themeIcon */}
              {themeIcon && (
                <img src={themeIcon} alt="Theme Icon" className="h-9 w-auto object-contain drop-shadow-sm" />
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{themeName}</p>
              <h1 className="text-lg font-black text-gray-800 uppercase leading-tight">{desaName === "SIDOARJO" ? "KAB. SIDOARJO" : `DESA ${desaName}`}</h1>
            </div>
          </div>

          {/* Children (Charts, Legend, Stats goes here) */}
          <div className="p-3 flex flex-col gap-3">
            {children}
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-[16px]"></div>

        </div>

        {/* Footer Actions (Sticky at bottom) */}
        <div className="px-3 py-3 bg-white border-t border-gray-100/80 flex gap-2 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.04)]">
          <button
            onClick={() => navigate('/bantuan')}
            className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-700 py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors border border-blue-200/80 text-xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            Bantuan
          </button>
          <button
            onClick={() => navigate(desaName === 'SIDOARJO' ? '/login' : `/login-${desaName.toLowerCase()}`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm text-xs"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
              <polyline points="10 17 15 12 10 7"></polyline>
              <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            Admin
          </button>
        </div>

      </div>
    </>
  );
};

export default RightSidebar;
