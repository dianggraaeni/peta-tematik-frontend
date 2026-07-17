import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-blue-100 rounded-xl mb-3 overflow-hidden transition-all duration-300 shadow-sm bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none hover:bg-blue-50 transition-colors"
      >
        <span className="font-bold text-base md:text-lg" style={{ color: "#1e3a8a" }}>{question}</span>
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
        <p className="text-base md:text-lg leading-relaxed" style={{ color: "#334155" }}>{answer}</p>
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
      answer: "Sumber data yang ditampilkan adalah data riil yang terhubung dengan basis data kami. Aplikasi ini juga sudah dilengkapi dengan insight otomatis berbasis AI untuk memberikan analisis yang lebih detail."
    },
    {
      question: "Apakah saya bisa melihat data spesifik tingkat desa?",
      answer: "Tentu! Anda bisa masuk ke halaman 'Peta Tematik' melalui tombol navigasi di layar, kemudian memilih tema yang diinginkan melalui tombol menu. Anda juga bisa mencari desa tertentu melalui kolom pencarian di bagian atas."
    },
    {
      question: "Bagaimana cara menggunakan fitur pencarian desa?",
      answer: "Di halaman Peta Tematik, terdapat kolom pencarian di bagian atas. Anda cukup mengetikkan nama desa yang ingin dicari, lalu pilih dari daftar yang muncul. Peta akan otomatis mengarahkan dan memperbesar area (zoom) ke desa tersebut."
    },
    {
      question: "Apa fungsi dari mode peta 'Tematik', 'Kepadatan', dan 'Rasio L/P'?",
      answer: "Mode 'Tematik' menampilkan data spesifik potensi desa. Mode 'Kepadatan' memberikan visualisasi kepadatan penduduk berdasarkan gradasi warna. Sedangkan mode 'Rasio L/P' menampilkan perbandingan jumlah penduduk Laki-laki dan Perempuan per kecamatan."
    },
    {
      question: "Mengapa beberapa wilayah memiliki warna yang lebih gelap di peta?",
      answer: "Warna yang lebih gelap menunjukkan nilai intensitas atau kepadatan yang lebih tinggi dari data yang sedang divisualisasikan. Anda bisa melihat keterangan lebih lanjut (legenda) di layar jika tersedia, atau mengklik wilayah tersebut untuk melihat angka pastinya."
    },
    {
      question: "Apakah ada batasan wilayah yang bisa diakses?",
      answer: "Saat ini, peta mencakup seluruh wilayah kecamatan dan desa di Kabupaten Sidoarjo. Peta ini memang difokuskan untuk pengelolaan data dan potensi wilayah di lingkup Sidoarjo."
    },
    {
      question: "Bagaimana jika saya menemukan data yang kurang sesuai?",
      answer: "Untuk Layanan Pengaduan BPS Kabupaten Sidoarjo, bisa menghubungi Nomor 0858 9000 3515 (WA Only)"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#e0f2fe] flex flex-col items-center pb-8 font-sans relative">
      
      {/* Header Bar */}
      <div className="w-full bg-[#bae6fd] px-4 py-2 sm:px-6 md:px-12 md:py-4 flex flex-col sm:flex-row justify-between items-center z-50 border-b-2 border-white/50 shadow-sm gap-3 sm:gap-0 sticky top-0">
        {/* Back Button (Left) */}
        <div className="flex-1 flex justify-start">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 bg-white rounded-full font-bold shadow-sm border-[3px] border-white hover:border-[#2563eb] hover:-translate-y-0.5 transition-all text-[#2563eb]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            <span className="text-base">Kembali</span>
          </button>
        </div>

        {/* Title (Center, visible only on desktop or large screens if needed, but we'll leave it in the main body) */}
        <div className="flex-1 hidden md:flex justify-center">
          <span className="font-extrabold text-[#1e3a8a] text-lg tracking-wider uppercase">Pusat Bantuan</span>
        </div>

        {/* Logos (Right) */}
        <div className="flex-1 flex justify-center sm:justify-end items-center gap-3 md:gap-5">
          <img src="/logo kabupaten sidoarjo.png" alt="Logo Sidoarjo" className="h-8 md:h-11 w-auto object-contain hover:scale-105 transition-transform drop-shadow-md" />
          <img src="/logo bps sda.png" alt="Logo BPS Sidoarjo" className="h-8 md:h-11 w-auto object-contain hover:scale-105 transition-transform drop-shadow-md" />
          <img src="/pict/logo_dc.png" alt="Logo Desa Cantik" className="h-8 md:h-11 w-auto object-contain hover:scale-105 transition-transform drop-shadow-md" />
        </div>
      </div>

      <div className="w-full px-4 md:px-12 flex-1 flex flex-col z-10 max-w-7xl mx-auto">
        <div className="text-center mb-10 mt-8 md:mt-12">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight" style={{ color: "#1e3a8a" }}>Pusat Bantuan</h1>
          <p className="text-base md:text-xl opacity-90" style={{ color: "#1e40af" }}>Temukan panduan penggunaan dan jawaban atas pertanyaan umum di sini.</p>
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
              <h2 className="text-2xl md:text-3xl font-extrabold mb-2" style={{ color: "#1e3a8a" }}>Buku Panduan</h2>
              <p className="text-base md:text-lg" style={{ color: "#475569" }}>Akses direktori panduan resmi Peta Tematik & Statistik.</p>
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
            <h2 className="text-3xl font-extrabold" style={{ color: "#1e3a8a" }}>FAQ (Tanya Jawab)</h2>
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
