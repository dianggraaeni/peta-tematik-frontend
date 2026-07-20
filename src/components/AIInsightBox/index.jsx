import { useState, useEffect } from "react";
import { AiOutlineAlignLeft, AiOutlineClose, AiOutlineRobot } from "react-icons/ai";
import api6 from "../../utils/api6"; // Use centralized backend axios instance

// Create simple module-level caches
const aiInsightCache = {};
const manualInsightCache = {};

const AIInsightBox = ({ desaName, featureName, data, contextType, customClass, requireClick = false }) => {
  const [manualInsight, setManualInsight] = useState("");
  const [aiInsight, setAiInsight] = useState("");
  
  const [loadingManual, setLoadingManual] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showAi, setShowAi] = useState(false);

  const skipManual = !desaName;

  // Reset state when desaName or featureName changes
  useEffect(() => {
    setIsExpanded(false);
    setShowAi(skipManual);
    setManualInsight("");
    setAiInsight("");
  }, [desaName, featureName, skipManual]);

  // Fetch Manual Insight when expanded
  useEffect(() => {
    if (skipManual) return;
    if (requireClick && !isExpanded) return;

    const cacheKey = `general_${desaName}`;
    if (manualInsightCache[cacheKey]) {
      setManualInsight(manualInsightCache[cacheKey]);
      return;
    }

    const fetchManualInsight = async () => {
      setLoadingManual(true);
      try {
        const response = await api6.get("/api/manual-insights", {
          params: { desa_name: desaName, contextType: "general" }
        });
        const text = response.data.insightText;
        manualInsightCache[cacheKey] = text;
        setManualInsight(text);
      } catch (error) {
        console.error("Error fetching manual insight:", error);
        setManualInsight("Belum ada insight manual yang tersedia.");
      } finally {
        setLoadingManual(false);
      }
    };

    fetchManualInsight();
  }, [desaName, contextType, isExpanded, requireClick, skipManual]);

  // Auto-fetch AI Insight if skipManual and expanded
  useEffect(() => {
    if (skipManual && isExpanded && !aiInsight && !loadingAi) {
      fetchAiInsight();
    }
  }, [skipManual, isExpanded]);

  // Fetch AI Insight explicitly when requested
  const fetchAiInsight = async () => {
    setShowAi(true);
    if (!featureName || !data) return;

    const cacheKey = `${contextType}_${featureName}`;
    if (aiInsightCache[cacheKey]) {
      setAiInsight(aiInsightCache[cacheKey]);
      return;
    }

    setLoadingAi(true);
    try {
      const response = await api6.post("/api/insights", {
        featureName,
        data,
        contextType,
      });
      const fetchedInsight = response.data.insight;
      aiInsightCache[cacheKey] = fetchedInsight;
      setAiInsight(fetchedInsight);
    } catch (error) {
      console.error("Error fetching AI insight:", error);
      if (error.response && error.response.status === 429) {
        setAiInsight(error.response.data.error || "Terlalu banyak permintaan ke AI. Silakan coba lagi nanti.");
      } else {
        setAiInsight("Gagal memuat insight dari AI.");
      }
    } finally {
      setLoadingAi(false);
    }
  };

  if (!desaName && !featureName) return null;

  return (
    <div className={`absolute z-[2000] pointer-events-auto flex flex-col items-end ${customClass || "bottom-4 right-4"}`}>
      {/* The Chat Panel — expands upward */}
      {isExpanded && (
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-gray-200 p-3 mb-2 w-[280px] max-w-[85vw] animate-fade-in-up relative origin-bottom-right flex flex-col">
          <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-bold text-gray-800 flex items-center gap-1.5 text-xs">
                <AiOutlineAlignLeft className="text-blue-500 text-sm" />
                {contextType === "statistik_kecamatan" ? "Insight Kecamatan" : "Insight Desa"}
              </h4>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <AiOutlineClose size={13} />
            </button>
          </div>
          
          <div className="mb-1 shrink-0">
            <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">
              {desaName ? (
                <>{!desaName.toLowerCase().includes("desa") && !desaName.toLowerCase().includes("kelurahan") ? `Desa ${desaName}` : desaName} {featureName && !featureName.toLowerCase().includes(desaName.toLowerCase()) && !desaName.toLowerCase().includes(featureName.toLowerCase()) ? `- ${featureName}` : ""}</>
              ) : (
                <>{contextType === "statistik_kecamatan" && featureName && !featureName.toLowerCase().includes("kecamatan") ? `Kecamatan ${featureName}` : featureName}</>
              )}
            </span>
          </div>
          
          <div className="max-h-[150px] overflow-y-auto pr-1 no-scrollbar flex flex-col gap-3">
            {/* Manual Insight Section */}
            {!skipManual && (
              <div className="text-[10px] leading-snug">
                {loadingManual ? (
                  <div className="flex space-x-1 items-center h-4 my-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                ) : (
                  <p className="text-gray-700 font-medium">
                    {manualInsight}
                  </p>
                )}
              </div>
            )}

            {/* AI Insight Section */}
            {showAi && (
              <div className="text-[10px] leading-snug bg-blue-50 p-2 rounded-lg border border-blue-100">
                <div className="flex items-center gap-1 mb-1 text-blue-600 font-bold">
                  <AiOutlineRobot /> <span className="text-[9px]">AI Analysis</span>
                </div>
                {loadingAi ? (
                  <div className="flex space-x-1 items-center h-4 my-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                ) : (
                  <p className="text-gray-700">
                    {aiInsight}
                  </p>
                )}
              </div>
            )}
          </div>

          {!skipManual && (
            <div className="mt-2 pt-2 border-t border-gray-100 flex flex-col gap-1.5 shrink-0">
              {!showAi && (
                <button 
                  onClick={fetchAiInsight}
                  className="w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[9px] font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1"
                >
                  <AiOutlineRobot /> Lihat insight mendalam dengan AI
                </button>
              )}
              {showAi && (
                <p className="text-[8px] text-gray-400 italic leading-tight text-center">
                  *Insight mendalam di-generate oleh AI dan belum tentu 100% akurat.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* The Floating Button — same size as "i" button (w-10 h-10) */}
      {!isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg border border-white/30 transform transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center relative"
          title="Tampilkan Insight"
        >
          <AiOutlineAlignLeft className="text-xl" />
          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500 border border-white"></span>
          </span>
        </button>
      )}
    </div>
  );
};

export default AIInsightBox;
