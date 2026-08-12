import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const RightSidebar = ({ 
  isOpen, 
  setIsOpen, 
  desaName, 
  themeName = "PETA TEMATIK",
  themeIcon = "/pict/des-can.png",
  children // Ini untuk legenda, grafik, atau info dinamis lainnya
}) => {
  const navigate = useNavigate();

  return (
    <>
      {/* Toggle Button when Closed */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)} 
          className="absolute top-1/2 right-0 z-[1010] bg-white p-3 rounded-l-xl shadow-lg border-y border-l border-gray-200 hover:bg-gray-50 hover:pl-4 transition-all"
          title="Buka Panel Informasi"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      )}

      {/* Sidebar Container */}
      <div 
        className={`transition-all duration-300 ease-in-out bg-white shadow-[-10px_0_20px_rgba(0,0,0,0.05)] z-[1020] flex flex-col h-full border-l border-gray-200 shrink-0 ${
          isOpen ? 'w-[320px] sm:w-[380px] translate-x-0' : 'w-[320px] sm:w-[380px] translate-x-full absolute right-0'
        }`}
        style={{ position: isOpen ? 'relative' : 'absolute' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-blue-600 text-white shrink-0 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-10 opacity-20 pointer-events-none">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 22h20L12 2z"/>
            </svg>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <h2 className="font-bold text-lg tracking-wide">Panel Informasi</h2>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="hover:bg-blue-700 p-1.5 rounded-lg transition-colors relative z-10"
            title="Tutup Panel"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        {/* Content Area (Scrollable) */}
        <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50 flex flex-col">
          
          {/* Logo & Deskripsi Desa */}
          <div className="p-5 bg-white border-b border-gray-100 flex flex-col items-center gap-4 text-center">
            <div className="flex justify-center items-end gap-3 h-14">
              <img src="/pict/petis-darjo.png" alt="Sidoarjo" className="h-12 w-auto object-contain drop-shadow-sm" />
              <img src="/pict/des-can.png" alt="Desa Cantik" className="h-10 w-auto object-contain drop-shadow-sm mb-1" />
              {themeIcon && <img src={themeIcon} alt="Theme Icon" className="h-12 w-auto object-contain drop-shadow-sm" />}
            </div>
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">{themeName}</p>
              <h1 className="text-2xl font-black text-gray-800 uppercase leading-none">{desaName === "SIDOARJO" ? "KAB. SIDOARJO" : `DESA ${desaName}`}</h1>
            </div>
          </div>

          {/* Children (Charts, Legend, Stats goes here) */}
          <div className="p-4 flex flex-col gap-4">
            {children}
          </div>

          {/* Spacer */}
          <div className="flex-1 min-h-[20px]"></div>

        </div>
        
        {/* Footer Actions (Sticky at bottom) */}
        <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <Link 
            to="/peta-tematik" 
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-200 text-sm"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Kembali ke Peta Tematik
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/bantuan')}
              className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-blue-200 text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Bantuan
            </button>
            <button 
              onClick={() => navigate(desaName === 'SIDOARJO' ? '/login' : `/login-${desaName.toLowerCase()}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-md text-sm"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
              </svg>
              Admin
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default RightSidebar;
