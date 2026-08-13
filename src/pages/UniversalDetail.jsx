import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api6 from "../utils/api6";
import { Tabs, Tab, Spinner } from "@nextui-org/react";

import MapPekerjaan from "../components/PetaPekerjaan";
import MapUMKM from "../components/PetaUMKM";
import MapPertanian from "../components/PetaSayuran"; // Assuming PetaSayuran is for Pertanian

const UniversalDetail = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const desaName = searchParams.get("desa") || "SIDOARJO";

  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("");

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await api6.get("/api/village-themes");
        const themeMap = response.data || {};
        
        const currentVillageThemes = themeMap[desaName.toUpperCase()] || [];
        setThemes(currentVillageThemes);
        
        if (currentVillageThemes.length > 0) {
          setActiveTab(currentVillageThemes[0]);
        }
      } catch (error) {
        console.error("Error fetching themes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();

    // Fix for Leaflet tile scrambling when container resizes
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 500);
    return () => clearTimeout(timer);
  }, [desaName]);

  if (loading) {
    return (
      <div className="w-screen h-screen flex justify-center items-center bg-gray-200">
        <Spinner size="lg" label="Memuat Peta..." />
      </div>
    );
  }

  if (themes.length === 0) {
    return (
      <div className="w-screen h-screen relative flex flex-col bg-gray-200 overflow-hidden font-sans">
        {/* Peta dasar (hanya GeoJSON, tanpa legenda/panel) */}
        <div className="flex-1 relative w-full h-full">
          <MapPekerjaan desaName={desaName} hideCards={false} />
        </div>
        
        {/* Pesan Mengambang Kecil */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-6 py-3 rounded-full shadow-lg border border-gray-100 flex flex-col items-center">
          <h2 className="text-sm font-bold text-gray-800">Desa {desaName}</h2>
          <p className="text-xs text-gray-500">Belum ada tema yang diaktifkan</p>
        </div>
      </div>
    );
  }

  const renderActiveMap = () => {
    switch (activeTab) {
      case "Sosial Kependudukan":
        return <MapPekerjaan desaName={desaName} />;
      case "Ekonomi Perdagangan":
        return <MapUMKM desaName={desaName} />;
      case "Pertanian Pertambangan":
        return <MapPertanian desaName={desaName} />;
      default:
        return <MapPekerjaan desaName={desaName} />;
    }
  };

  return (
    <div className="w-screen h-screen relative flex flex-col bg-gray-200 overflow-hidden font-sans">
      {themes.length > 1 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg">
          <Tabs 
            selectedKey={activeTab} 
            onSelectionChange={setActiveTab}
            color="primary"
            variant="solid"
            radius="full"
            aria-label="Theme Selection"
          >
            {themes.map(theme => (
              <Tab key={theme} title={theme} />
            ))}
          </Tabs>
        </div>
      )}
      
      {/* Map Container */}
      <div className="flex-1 w-full h-full relative">
        {renderActiveMap()}
      </div>
    </div>
  );
};

export default UniversalDetail;
