import { useState, useEffect } from "react";
import { AiOutlineFileText, AiOutlineClose } from "react-icons/ai";
import api6 from "../../utils/api6"; // Use centralized backend axios instance

// Create a simple module-level cache so it persists across renders
const insightCache = {};

const AIInsightBox = ({ featureName, data, contextType, customClass, requireClick = false }) => {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const dataString = JSON.stringify(data);

  // Reset state when featureName changes
  useEffect(() => {
    setIsExpanded(false);
    setInsight("");
  }, [featureName]);

  useEffect(() => {
    if (!featureName || !data) return;
    if (requireClick && !isExpanded) return; // Don't fetch until expanded if requireClick is true
    if (!isExpanded && insight) return; // Already fetched

    const cacheKey = `${contextType}_${featureName}`;
    if (insightCache[cacheKey]) {
      setInsight(insightCache[cacheKey]);
      setLoading(false);
      return;
    }

    const fetchInsight = async () => {
      setLoading(true);
      setInsight("");
      try {
        const response = await api6.post("/api/insights", {
          featureName,
          data,
          contextType,
        });
        const fetchedInsight = response.data.insight;
        insightCache[cacheKey] = fetchedInsight;
        setInsight(fetchedInsight);
      } catch (error) {
        console.error("Error fetching AI insight:", error);
        if (error.response && error.response.status === 429) {
          setInsight(error.response.data.error || "Terlalu banyak permintaan ke AI. Silakan coba lagi nanti (Limit API).");
        } else {
          setInsight("Gagal memuat insight dari AI.");
        }
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly to prevent spamming the API on rapid clicks
    const timeoutId = setTimeout(() => {
      fetchInsight();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [featureName, dataString, contextType, requireClick, isExpanded, insight]);

  if (!featureName) return null;

  return (
    <div className={`absolute z-[2000] pointer-events-auto flex flex-col items-end ${customClass || "bottom-6 right-6"}`}>
      {/* The Chat Panel */}
      {isExpanded && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-br-sm shadow-2xl border border-gray-200 p-5 mb-4 w-[350px] max-w-[90vw] animate-fade-in-up relative origin-bottom-right">
          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <AiOutlineFileText className="text-blue-500 text-xl" />
                AI Insight
              </h4>
              <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">BETA</span>
            </div>
            <button 
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <AiOutlineClose size={18} />
            </button>
          </div>
          
          <div className="mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {contextType === "statistik_kecamatan" ? "Kecamatan " : "Desa "} {featureName?.toLowerCase()}
            </span>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto pr-1 no-scrollbar text-sm">
            {loading ? (
              <div className="flex space-x-1 items-center h-8 my-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed font-medium">
                {insight}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
            <p className="text-[10px] text-gray-400 italic leading-tight">
              *Disclaimer: Ini adalah ringkasan otomatis dari AI berdasarkan data yang ada dan belum tentu 100% akurat.
            </p>
          </div>
        </div>
      )}

      {/* The Floating Button */}
      {!isExpanded && (
        <button 
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-2 border-white transform transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center relative animate-fade-in-up"
          title="Tampilkan Insight AI"
        >
          <AiOutlineFileText className="text-3xl" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border border-white"></span>
          </span>
        </button>
      )}
    </div>
  );
};

export default AIInsightBox;
