import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-blue-100 rounded-xl mb-3 overflow-hidden transition-all duration-300 shadow-sm bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 text-left flex justify-between items-center focus:outline-none hover:bg-blue-50 transition-colors"
      >
        <span className="font-bold text-gray-800 text-sm md:text-base">{question}</span>
        <svg
          className={`w-5 h-5 text-blue-600 transition-transform duration-300 ${isOpen ? "transform rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`px-5 overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 py-4 border-t border-blue-50 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <p className="text-gray-600 text-sm md:text-base leading-relaxed">{answer}</p>
      </div>
    </div>
  );
};

const HelpDesk = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      question: "Bagaimana cara melihat data kepadatan penduduk?",
      answer: "Pada halaman utama Peta Statistik, Anda dapat menekan tombol mode 'Kepadatan' atau 'Rasio L/P'. Setelah memilih mode, arahkan kursor ke wilayah yang ingin dilihat untuk memunculkan informasi singkat, atau klik untuk melihat profil demografi lengkapnya di panel sebelah kiri."
    },
    {
      question: "Dari mana sumber data yang ditampilkan pada peta ini?",
      answer: "Sumber data yang ditampilkan adalah data riil yang terhubung dengan basis data kami. Ke depannya, aplikasi ini juga akan dilengkapi dengan insight otomatis berbasis AI untuk memberikan analisis yang lebih detail."
    },
    {
      question: "Apakah saya bisa melihat data spesifik tingkat desa?",
      answer: "Tentu! Anda bisa masuk ke halaman 'Peta Tematik' melalui tombol navigasi di layar, kemudian memilih tema yang diinginkan melalui tombol menu. Anda juga bisa mencari desa tertentu melalui kolom pencarian di bagian atas."
    },
    {
      question: "Bagaimana cara mengakses Dasbor Admin?",
      answer: "Tekan tombol 'Masuk Admin' di pojok kanan atas layar utama. Sistem login kami terpusat, sehingga Anda cukup memasukkan kredensial admin yang Anda miliki."
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#e0f2fe] flex flex-col items-center py-8 px-4 font-sans relative">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-64 bg-[#bae6fd] -z-10 rounded-b-[3rem] shadow-sm"></div>

      {/* Header / Back Button */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8 relative z-10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-full font-bold text-blue-700 shadow-sm border border-blue-100 hover:bg-blue-50 hover:-translate-x-1 transition-all"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Kembali
        </button>
      </div>

      <div className="w-full max-w-4xl z-10">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-blue-900 mb-4 tracking-tight">Pusat Bantuan</h1>
          <p className="text-blue-800 text-base md:text-lg opacity-80">Temukan panduan penggunaan dan jawaban atas pertanyaan umum di sini.</p>
        </div>

        {/* Panduan Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6 md:p-10 mb-10 border-2 border-blue-50 flex flex-col md:flex-row items-center justify-between gap-6 transform hover:scale-[1.01] transition-transform">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center shrink-0">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold text-gray-800 mb-1">Buku Panduan</h2>
              <p className="text-gray-500 text-sm md:text-base">Akses direktori panduan resmi Peta Tematik & Statistik.</p>
            </div>
          </div>
          <a
            href="https://drive.google.com/drive/folders/1BRi8Bhm6BzYQksJNKAoWkcAoN96uk2ZZ?usp=drive_link"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full md:w-auto px-8 py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-bold rounded-xl shadow-md transition-colors text-center shrink-0 flex items-center justify-center gap-2"
          >
            Buka Panduan
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
        </div>

        {/* FAQ Section */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-sm p-6 md:p-8 border border-white">
          <div className="flex items-center gap-3 mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <h2 className="text-2xl font-extrabold text-blue-900">FAQ (Tanya Jawab)</h2>
          </div>
          
          <div className="flex flex-col gap-2">
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDesk;
