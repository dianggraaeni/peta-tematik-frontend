import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavbarPetaKelengkeng({ desaName = "SIDOARJO" }) {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#bae6fd] px-4 py-2 sm:px-6 md:px-12 md:py-4 flex flex-col sm:flex-row justify-between items-center z-50 border-b-2 border-white/50 shadow-sm gap-3 sm:gap-0 sticky top-0">
      
      {/* Left side: Logos and Title */}
      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
        <img
          src="/pict/petis-darjo.png"
          alt="Sidoarjo Coat of Arms"
          className="h-10 md:h-12 w-auto object-contain drop-shadow-sm"
        />
        <img
          src="/pict/des-can.png"
          alt="Desa Cantik Logo"
          className="h-10 md:h-12 w-auto object-contain drop-shadow-sm"
        />
        <img
          src="/pict/Ketenagakerjaan_Sidokepung.png"
          alt="Ketenagakerjaan"
          className="h-8 md:h-10 w-auto object-contain drop-shadow-sm ml-1"
        />
        <div className="ml-2 md:ml-3 flex flex-col justify-center">
          <p className="font-semibold text-blue-900 leading-tight text-xs md:text-sm tracking-wide">
            PETA KETENAGAKERJAAN
          </p>
          <p className="text-base md:text-lg font-extrabold text-blue-900 leading-tight uppercase">
            {desaName !== "SIDOARJO" ? `DESA ${desaName}` : "SIDOARJO"}
          </p>
        </div>
      </div>

      {/* Right side: Action Buttons */}
      <div className="w-full sm:w-auto flex gap-2 justify-end items-center mt-2 sm:mt-0">
        <button 
          onClick={() => navigate('/bantuan')}
          className="w-11 h-11 bg-white text-[#2563eb] rounded-full font-bold transition-all shadow-lg border-[3px] border-white hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 flex items-center justify-center shrink-0"
          title="Pusat Bantuan & Panduan"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>

        <Link to="/peta-tematik" className="bg-blue-600 hover:bg-blue-700 text-white pl-2 pr-4 md:pr-5 py-1.5 md:py-2 rounded-full font-bold shadow-md shadow-blue-500/30 transition-all flex items-center gap-2 text-sm md:text-base group whitespace-nowrap">
          <div className="w-6 h-6 md:w-7 md:h-7 bg-white text-blue-600 rounded-full flex items-center justify-center shadow-sm">
            <svg className="group-hover:-translate-x-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7"></polyline>
              <polyline points="18 17 13 12 18 7"></polyline>
            </svg>
          </div>
          <span>Peta Tematik</span>
        </Link>

        <button 
          onClick={() => navigate('/login-sidokepung')}
          className="w-full sm:w-auto px-6 py-2 bg-white rounded-full font-bold transition-all shadow-lg border-[3px] border-white hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center"
          style={{ color: "#1f2937" }}
        >
          Masuk Admin
        </button>
      </div>
    </div>
  );
}
