import { useState, useEffect } from "react";
import { Card, CardBody } from "@nextui-org/react";
import { AiOutlineRobot } from "react-icons/ai";
import api6 from "../../utils/api6"; // Use centralized backend axios instance

const AIInsightBox = ({ featureName, data, contextType }) => {
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!featureName || !data) return;

    const fetchInsight = async () => {
      setLoading(true);
      setInsight("");
      try {
        const response = await api6.post("/api/insights", {
          featureName,
          data,
          contextType,
        });
        setInsight(response.data.insight);
      } catch (error) {
        console.error("Error fetching AI insight:", error);
        setInsight("Gagal memuat insight dari AI.");
      } finally {
        setLoading(false);
      }
    };

    // Debounce slightly to prevent spamming the API on rapid clicks
    const timeoutId = setTimeout(() => {
      fetchInsight();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [featureName, data, contextType]);

  if (!featureName) return null;

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-[1000] w-[95%] max-w-6xl animate-fade-in-up">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl rounded-bl-sm shadow-2xl border border-gray-200 p-5 relative">
        <div className="absolute -left-4 -bottom-4 bg-blue-500 rounded-full p-3 shadow-lg z-10 animate-pulse border-4 border-white">
          <AiOutlineRobot className="text-white text-2xl" />
        </div>
        
        <div className="pl-4">
          <div className="flex justify-between items-center mb-1">
            <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider">
              AI Insight • {featureName}
            </h4>
            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">BETA</span>
          </div>
          
          {loading ? (
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
