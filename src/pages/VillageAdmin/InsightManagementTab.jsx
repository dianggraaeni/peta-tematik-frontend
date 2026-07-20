import React, { useState, useEffect } from "react";
import api6 from "../../utils/api6";
import { AiOutlineSave, AiOutlineLoading3Quarters, AiOutlineCheck } from "react-icons/ai";

const InsightManagementTab = ({ nama_desa }) => {
  const [insightText, setInsightText] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const response = await api6.get(`/api/manual-insights`, {
        params: { desa_name: nama_desa, contextType: "general" }
      });
      // the endpoint returns the data or a default message
      setInsightText(response.data.insightText || "");
    } catch (error) {
      console.error("Error fetching manual insight:", error);
      alert("Gagal mengambil data insight.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (nama_desa) {
      fetchInsight();
    }
  }, [nama_desa]);

  const handleSave = async () => {
    setSaving(true);
    setIsSuccess(false);
    try {
      await api6.post("/api/manual-insights", {
        desa_name: nama_desa,
        contextType: "general",
        insightText
      });
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Error saving manual insight:", error);
      alert("Gagal menyimpan data insight.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-6">
      
      <div className="flex flex-col gap-2">
        <h3 className="font-bold text-gray-800 text-lg">Manajemen Insight</h3>
        <p className="text-sm text-gray-500">
          Tuliskan deskripsi singkat atau sorotan penting mengenai potensi desa Anda di sini.
        </p>
      </div>

      <div className="flex flex-col gap-4 max-w-3xl">

        <div className="flex flex-col gap-2 relative">
          <label className="text-sm font-semibold text-gray-700">Teks Insight</label>
          {loading && (
             <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
                <AiOutlineLoading3Quarters className="animate-spin text-blue-500 text-2xl" />
             </div>
          )}
          <textarea 
            value={insightText}
            onChange={(e) => setInsightText(e.target.value)}
            disabled={loading}
            placeholder="Masukkan teks deskripsi singkat tentang potensi utama desa Anda..."
            className={`w-full p-4 border border-gray-200 rounded-xl min-h-[150px] resize-y bg-gray-50 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${loading ? 'opacity-50' : ''}`}
          />
        </div>

        <div className="flex justify-end mt-2">
          <button 
            onClick={handleSave}
            disabled={saving || loading || isSuccess}
            className={`flex items-center gap-2 px-6 py-3 text-white font-bold rounded-xl transition-all disabled:opacity-80 ${
              isSuccess 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {saving ? (
              <AiOutlineLoading3Quarters className="animate-spin" />
            ) : isSuccess ? (
              <AiOutlineCheck className="text-xl" />
            ) : (
              <AiOutlineSave />
            )}
            {saving ? 'Menyimpan...' : isSuccess ? 'Tersimpan!' : 'Simpan Insight'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightManagementTab;
