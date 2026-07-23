import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function NavbarPetaWaung() {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#bae6fd] px-4 py-2 sm:px-6 md:px-12 md:py-4 flex flex-col sm:flex-row justify-between items-center z-50 border-b-2 border-white/50 shadow-sm gap-3 sm:gap-0 sticky top-0">
      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
        <img src="/pict/logo_sidoarjo.png" alt="Sidoarjo Coat of Arms" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm" />
        <img src="/pict/logo_dc.png" alt="Desa Cantik Logo" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm ml-1 md:ml-2" />
        <div className="ml-2 md:ml-3 flex flex-col justify-center">
          <p className="font-semibold text-blue-900 leading-tight text-xs md:text-sm tracking-wide">PETA TEMATIK</p>
          <p className="text-base md:text-lg font-extrabold text-blue-900 leading-tight uppercase">DESA WAUNG</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto justify-end">
        <button onClick={() => navigate("/bantuan")} className="bg-white hover:bg-gray-100 text-blue-600 rounded-full w-8 h-8 md:w-10 md:h-10 flex items-center justify-center shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <Link to="/peta-tematik" className="bg-blue-600 hover:bg-blue-700 text-white px-4 md:px-5 py-2 rounded-full font-bold shadow-md shadow-blue-500/30 transition-all flex items-center gap-2 text-sm md:text-base group whitespace-nowrap">
          <span className="group-hover:-translate-x-1 transition-transform">&laquo;</span> Peta Tematik
        </Link>
        <button onClick={() => navigate("/login")} className="bg-white hover:bg-gray-50 font-bold py-2 px-4 md:px-6 rounded-full shadow-md transition-all text-sm md:text-base border border-gray-200 whitespace-nowrap" style={{ color: "black", opacity: 1 }}>Masuk Admin</button>
      </div>
    </div>
  );
}
