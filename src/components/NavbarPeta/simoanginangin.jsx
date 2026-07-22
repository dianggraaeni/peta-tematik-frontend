import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavbarPetaSimoanginangin({ desaName = "SIMO ANGIN ANGIN" }) {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#bae6fd] px-4 py-2 sm:px-6 md:px-12 md:py-4 flex flex-col sm:flex-row justify-between items-center z-50 border-b-2 border-white/50 shadow-sm gap-3 sm:gap-0 sticky top-0">
      
      {/* Left side: Logos and Title */}
      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
        <img
          src="/pict/logo_sidoarjo.png"
          alt="Sidoarjo Coat of Arms"
          className="h-10 md:h-12 w-auto object-contain drop-shadow-sm"
        />
        <img
          src="/pict/logo_dc.png"
          alt="Desa Cantik Logo"
          className="h-10 md:h-12 w-auto object-contain drop-shadow-sm ml-1 md:ml-2"
        />
        <img
          src="/pict/logo_bps.png"
          alt="BPS Logo"
          className="h-8 md:h-10 w-auto object-contain drop-shadow-sm ml-1 md:ml-2"
        />
        <div className="ml-2 md:ml-3 flex flex-col justify-center">
          <p className="font-semibold text-blue-900 leading-tight text-xs md:text-sm tracking-wide">
            PETA UMKM
          </p>
          <p className="text-base md:text-lg font-extrabold text-blue-900 leading-tight uppercase">
            {desaName !== "SIDOARJO" ? `DESA ${desaName}` : "DESA SIMO ANGIN ANGIN"}
          </p>
        </div>
      </div>

      {/* Right side: Action Buttons */}
      <div className="w-full sm:w-auto flex gap-2 justify-end items-center mt-2 sm:mt-0">
        <Link 
          to="https://drive.google.com/drive/folders/1BRi8Bhm6BzYQksJNKAoWkcAoN96uk2ZZ?usp=drive_link"
          target="_blank"
          rel="noopener noreferrer"
          className="w-11 h-11 bg-white text-[#2563eb] rounded-full font-bold transition-all shadow-lg border-[3px] border-white hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center shrink-0"
          title="Panduan"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </Link>

        <button 
          onClick={() => navigate('/peta-tematik')}
          className="w-full sm:w-auto px-6 py-2 bg-[#2563eb] text-white rounded-full font-bold transition-all shadow-lg border-[3px] border-[#2563eb] hover:bg-blue-700 hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center gap-2 shrink-0"
        >
          <span className="font-extrabold text-lg -mt-1">&laquo;</span> Peta Tematik
        </button>

        <button 
          onClick={() => navigate('/login-simoanginangin')}
          className="w-full sm:w-auto px-6 py-2 bg-white rounded-full font-bold transition-all shadow-lg border-[3px] border-white hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center"
          style={{ color: "#1f2937" }}
        >
          Masuk Admin
        </button>
      </div>
    </div>
  );
}
