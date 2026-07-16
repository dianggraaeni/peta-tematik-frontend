import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { AiOutlineRobot } from "react-icons/ai";
import api6 from "../../utils/api6"; // Use centralized backend axios instance

// Create a simple module-level cache so it persists across renders
const insightCache = {};

const AIInsightBox = ({ featureName, data, contextType, customClass, requireClick = false }) => {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasClicked, setHasClicked] = useState(false);

  const dataString = JSON.stringify(data);

  // Reset hasClicked state when featureName changes
  useEffect(() => {
    setHasClicked(false);
    setInsight("");
  }, [featureName]);

  useEffect(() => {
    if (!featureName || !data) return;
    if (requireClick && !hasClicked) return;

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
  }, [featureName, dataString, contextType, requireClick, hasClicked]);

  if (!featureName) return null;

  return (
    <div className={`absolute left-1/2 transform -translate-x-1/2 z-[1000] w-[95%] max-w-6xl animate-fade-in-up ${customClass || "bottom-6"}`}>
      <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-bl-sm shadow-2xl border border-gray-200 p-5 relative">
        <div className="absolute -left-4 -bottom-4 bg-blue-500 rounded-full p-3 shadow-lg z-10 animate-pulse border-4 border-white">
          <AiOutlineRobot className="text-white text-2xl" />
        </div>
        
        <div className="pl-4">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-bold text-gray-800">
              AI Insight &bull; {contextType === "statistik_kecamatan" ? "Kecamatan " : ""}<span className="capitalize">{featureName?.toLowerCase()}</span>
            </h4>
            <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold">BETA</span>
            {loading && <span className="text-xs text-blue-500 animate-pulse ml-2">Sedang menganalisis...</span>}
          </div>
          
          {requireClick && !hasClicked ? (
            <div className="flex flex-col items-center justify-center my-4 space-y-2">
               <button 
                 onClick={() => setHasClicked(true)}
                 className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full shadow-lg transform transition hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer z-50 pointer-events-auto"
               >
                 <AiOutlineRobot className="text-xl" /> Tampilkan Insight AI
               </button>
               <p className="text-[10px] text-gray-400">Klik untuk melihat analisis AI mengenai wilayah ini</p>
            </div>
          ) : loading ? (
            <div className="flex space-x-1 items-center h-5 my-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
            </div>
          ) : (
            <p className="text-base text-gray-800 leading-relaxed font-medium">
              {insight}
            </p>
          )}

          <div className="mt-3 pt-2 border-t border-dashed border-gray-200">
            <p className="text-xs text-gray-400 italic leading-tight">
              *Disclaimer: Ini adalah ringkasan otomatis dari AI berdasarkan data yang ada dan belum tentu 100% akurat.
            </p>
          </div>
        </div>
        
        {/* Chat bubble tail */}
        <div className="absolute -left-2 bottom-0 w-6 h-6 bg-white border-l border-b border-gray-200 transform rotate-45 translate-y-1/2 translate-x-1/2 z-0 hidden"></div>
      </div>
    </div>
  );
};

export default AIInsightBox;
