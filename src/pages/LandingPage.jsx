import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer, LayersControl, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import CustomMapControls, { useBasemap } from "../components/CustomMapControls";
import "leaflet/dist/leaflet.css";
import AIInsightBox from "../components/AIInsightBox";

// Auto Zoom to fit Sidoarjo or selected Kecamatan
const MapController = ({ geojsonData, selectedKecamatan, geoJsonRef }) => {
  const map = useMap();
  
  // Initial zoom to fit Sidoarjo or reset when selection cleared
  useEffect(() => {
    if (geojsonData && map && !selectedKecamatan) {
      // Fixed view to prevent zooming out too far on wide screens
      map.setView([-7.4478, 112.7183], 11);
    }
  }, [geojsonData, map, selectedKecamatan]);

  // Zoom to selected Kecamatan
  useEffect(() => {
    if (selectedKecamatan && geoJsonRef.current && map) {
      geoJsonRef.current.eachLayer((layer) => {
        if (layer.feature.properties.KECAMATAN === selectedKecamatan) {
          map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
          // Optionally open tooltip
          layer.openTooltip();
        }
      });
    }
  }, [selectedKecamatan, map, geoJsonRef]);

  return null;
};

const LandingPage = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const [pendudukData, setPendudukData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDataKecamatan, setShowDataKecamatan] = useState(false);
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [mapMode, setMapMode] = useState("kepadatan"); // "kepadatan" | "rasio"
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const searchRef = useRef(null);
  const geoJsonRef = useRef(null);
  const isFeatureClicked = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the boundaries GeoJSON from public folder
    fetch("/data/Administrasi_Kecamatan.geojson")
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error loading boundaries:", err));

    // Fetch statistical data
    fetch("/data/statistikSidoarjo.json")
      .then((res) => res.json())
      .then((data) => setStatsData(data))
      .catch((err) => console.error("Error loading stats:", err));

    // Fetch demographic data for aggregation
    fetch("/data/penduduk.json")
      .then((res) => res.json())
      .then((data) => setPendudukData(data))
      .catch((err) => console.error("Error loading penduduk:", err));
  }, []);

  // Handle clicking outside the search box to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter search results
  useEffect(() => {
    if (searchTerm.trim() === "" || !geojsonData) {
      setSearchResults([]);
      return;
    }
    const term = searchTerm.toLowerCase();
    const results = geojsonData.features
      .map((f) => f.properties)
      .filter((props) => {
        const kecamatan = (props.KECAMATAN || "").toLowerCase();
        return kecamatan.includes(term);
      })
      .slice(0, 5); // Limit to 5 results for clean UI
    
    // Remove duplicates if any
    const uniqueResults = [];
    const seen = new Set();
    for (const res of results) {
      if (!seen.has(res.KECAMATAN)) {
        seen.add(res.KECAMATAN);
        uniqueResults.push(res);
      }
    }
    
    setSearchResults(uniqueResults);
  }, [searchTerm, geojsonData]);

  const handleSelectSearch = (kecamatanName) => {
    setSelectedKecamatan(kecamatanName);
    setSearchTerm(kecamatanName);
    setIsSearchFocused(false);
  };

  // Helper function to get stats for a district
  const getDistrictStats = (kecamatanName) => {
    if (!kecamatanName || !statsData.length) return null;
    return statsData.find(
      (stat) => stat.kecamatan.toUpperCase() === kecamatanName.toUpperCase()
    );
  };

  // Aggregate stats
  const totalPenduduk = statsData.reduce((sum, stat) => sum + stat.jumlah_penduduk, 0);
  const totalLuas = statsData.reduce((sum, stat) => sum + stat.luas_wilayah, 0);
  const avgKepadatan = totalLuas > 0 ? (totalPenduduk / totalLuas) : 0;
  
  const sidoarjoAgregat = React.useMemo(() => {
    if (!pendudukData) return null;
    let L = 0, P = 0, total = 0, kk = 0;
    Object.values(pendudukData).forEach((desa) => {
      L += desa.L;
      P += desa.P;
      total += desa.total_penduduk;
      kk += desa.total_kk || 0;
    });
    return { L, P, total, kk };
  }, [pendudukData]);

  // Choropleth color scale based on map mode
  const getKepadatanColor = (density) => {
    return density > 7000 ? '#1e3a8a' :
           density > 5000 ? '#1d4ed8' :
           density > 3500 ? '#2563eb' :
           density > 2500 ? '#3b82f6' :
           density > 1500 ? '#60a5fa' :
           density > 1000 ? '#93c5fd' :
           density > 500  ? '#bfdbfe' :
                            '#dbeafe';
  };

  const getRasioColor = (l, p) => {
    if (!p) return "#e5e7eb";
    const rjk = (l / p) * 100;
    if (rjk > 105) return "#1e3a8a"; 
    if (rjk > 102) return "#3b82f6";
    if (rjk > 98) return "#9ca3af"; 
    if (rjk > 95) return "#ec4899"; 
    return "#be185d";
  };

  const kecamatanDemografi = React.useMemo(() => {
    if (!pendudukData) return {};
    const agg = {};
    Object.values(pendudukData).forEach((desa) => {
      const kec = (desa.Kecamatan || "").toUpperCase();
      if (!agg[kec]) {
        agg[kec] = { L: 0, P: 0, total: 0 };
      }
      agg[kec].L += desa.L;
      agg[kec].P += desa.P;
      agg[kec].total += desa.total_penduduk;
    });
    return agg;
  }, [pendudukData]);

  const getStyle = (feature) => {
    const kecName = feature.properties.KECAMATAN.toUpperCase();
    const stats = getDistrictStats(kecName);
    const density = stats ? stats.kepadatan_penduduk : 0;
    const isSelected = selectedKecamatan === feature.properties.KECAMATAN;
    
    let fillColor = "#e5e7eb";
    if (mapMode === "kepadatan") {
      fillColor = getKepadatanColor(density);
    } else if (mapMode === "rasio") {
      const demo = kecamatanDemografi[kecName];
      if (demo) fillColor = getRasioColor(demo.L, demo.P);
    }

    return {
      fillColor: fillColor,
      weight: isSelected ? 3 : 2,
      opacity: 1,
      color: isSelected ? "#ffffff" : "#475569", // Thinner and slightly lighter dark border
      dashArray: isSelected ? "" : "3",
      fillOpacity: isSelected ? 0.7 : 0.5, // Higher opacity for visibility
    };
  };

  const getHoverStyle = (feature) => {
    return {
      fillColor: "#facc15", // bright yellow for hover
      weight: selectedKecamatan === feature.properties.KECAMATAN ? 3 : 2,
      color: selectedKecamatan === feature.properties.KECAMATAN ? "#ffffff" : "#1e293b",
      dashArray: "",
      fillOpacity: 0.7,
    };
  };

  const getStyleRef = useRef(getStyle);
  const getHoverStyleRef = useRef(getHoverStyle);

  useEffect(() => {
    getStyleRef.current = getStyle;
    getHoverStyleRef.current = getHoverStyle;
  }, [getStyle, getHoverStyle]);

  // Update styles dynamically without unmounting the GeoJSON layer
  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer) => {
        layer.setStyle(getStyle(layer.feature));
        if (selectedKecamatan && layer.feature.properties.KECAMATAN === selectedKecamatan) {
          layer.bringToFront();
        }
      });
    }
  }, [selectedKecamatan, mapMode, kecamatanDemografi, statsData]);

  const MapClickHandler = () => {
    useMapEvents({
      click: () => {
        if (!isFeatureClicked.current) {
          setSelectedKecamatan(null);
        }
      },
    });
    return null;
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const kecName = props.KECAMATAN.toUpperCase();
    const stats = getDistrictStats(kecName);
    const demo = kecamatanDemografi[kecName];
    
    if (stats) {
      let tooltipContent = `
        <div style="font-family: 'Inter', sans-serif; text-align: center; padding: 4px;">
          <div style="font-weight: bold; font-size: 14px;">${props.KECAMATAN}</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Kecamatan</div>
          <div style="font-size: 11px; text-align: left;">
            <p style="margin: 2px 0;"><strong>Total Penduduk:</strong> ${stats.jumlah_penduduk.toLocaleString('id-ID')} jiwa</p>
            <p style="margin: 2px 0;"><strong>Kepadatan:</strong> ${Math.round(stats.kepadatan_penduduk).toLocaleString('id-ID')} jiwa/km²</p>
      `;

      if (demo && demo.P > 0) {
        tooltipContent += `
            <p style="margin: 2px 0;"><strong>L / P:</strong> ${demo.L.toLocaleString('id-ID')} / ${demo.P.toLocaleString('id-ID')}</p>
            <p style="margin: 2px 0;"><strong>Sex Ratio:</strong> ${((demo.L/demo.P)*100).toFixed(2)}</p>
        `;
      }

      tooltipContent += `
            <p style="margin: 2px 0;"><strong>Luas Wilayah:</strong> ${stats.luas_wilayah} km²</p>
            <p style="margin: 2px 0;"><strong>Desa/Kelurahan:</strong> ${stats.jumlah_desa_dan_kelurahan}</p>
          </div>
        </div>
      `;

      layer.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
        className: "beranda-tooltip",
        sticky: true,
        opacity: 1
      });

      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle(getHoverStyleRef.current(feature));
          if (selectedKecamatan && props.KECAMATAN === selectedKecamatan) {
            l.bringToFront();
          }
        },
        mouseout: (e) => {
          const l = e.target;
          l.setStyle(getStyleRef.current(feature));
        },
        click: (e) => {
          isFeatureClicked.current = true;
          setSelectedKecamatan(props.KECAMATAN);
          setTimeout(() => { isFeatureClicked.current = false; }, 50);
        }
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#e0f2fe] flex flex-col">
      <style>{`
        .beranda-tooltip {
          background: white !important;
          border: none !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
        }
        .beranda-tooltip::before {
          display: none !important;
        }
        .leaflet-container {
          background: transparent !important;
        }
        .leaflet-interactive {
          cursor: pointer !important;
          outline: none !important;
        }
        .leaflet-interactive:focus {
          outline: none !important;
        }
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          display: flex;
          flex-direction: column;
          margin-right: 1rem !important;
          margin-bottom: 1rem !important;
          overflow: hidden !important;
          background-color: white !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: transparent !important;
          color: #1f2937 !important;
          border: none !important;
          width: 34px !important;
          height: 34px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 600 !important;
          font-size: 1.2rem !important;
          transition: background-color 0.2s !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid #e5e7eb !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background-color: #f3f4f6 !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }

        /* Custom Animations */
        @keyframes colorShift {
          0% { color: #111827; }
          50% { color: #6b7280; }
          100% { color: #111827; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes typing {
          from { max-width: 0; }
          to { max-width: 100%; }
        }
        @keyframes colorBlink {
          0%, 100% { background-color: #2563eb; transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          50% { background-color: #3b82f6; transform: scale(1.02); box-shadow: 0 0 12px 2px rgba(59, 130, 246, 0.6); }
        }

        .animate-color-shift {
          animation: colorShift 5s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
          display: inline-block;
        }
        .animate-soft-blink {
          animation: colorBlink 3.5s ease-in-out infinite;
        }
        .typewriter-text-custom {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 3px solid #1e3a8a;
          animation: typing 2s steps(20, end) forwards, blink 0.75s step-end infinite;
          max-width: 0;
          padding-right: 4px;
        }
      `}</style>

      {/* Top Navigation Bar - Responsive */}
      <div className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-3 items-center px-4 py-3 md:px-8 md:py-4 gap-3 md:gap-4 z-[1000] bg-[#bae6fd] shadow-sm rounded-b-xl md:rounded-b-2xl">
        
        {/* Search Bar */}
        <div ref={searchRef} className="w-full flex justify-center sm:justify-start relative order-2 sm:order-1">
          <div className="relative w-full max-w-[280px]">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari kecamatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full px-4 py-2 pl-10 bg-white rounded-full shadow-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2563eb] placeholder-gray-400 font-medium text-sm md:text-base"
              style={{ color: "#1f2937" }}
            />
            <svg
              className="absolute left-3 top-2.5 h-4 w-4 md:h-5 md:w-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          {/* Autocomplete Dropdown */}
          {isSearchFocused && searchTerm.trim() !== "" && (
            <div className="absolute w-full mt-2 bg-white rounded-xl shadow-xl overflow-hidden flex flex-col border border-gray-100">
              {searchResults.length > 0 ? (
                searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectSearch(result.KECAMATAN)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 cursor-pointer"
                  >
                    <div className="font-semibold text-sm md:text-base" style={{ color: "#1f2937" }}>Kecamatan {result.KECAMATAN}</div>
                    <div className="text-xs" style={{ color: "#6b7280" }}>Kabupaten Sidoarjo</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                  Kecamatan tidak ditemukan
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Center Logos */}
        <div className="w-full flex justify-center items-center gap-3 sm:gap-6 order-1 sm:order-2 shrink-0">
          <img src="/pict/logo_sidoarjo.png" alt="Sidoarjo" className="h-10 md:h-12 object-contain" />
          <img src="/pict/logo_bps.png" alt="BPS" className="h-10 md:h-12 object-contain" />
          <img src="/pict/logo_dc.png" alt="Desa Cantik" className="h-10 md:h-12 object-contain" />
        </div>

        {/* Action Buttons */}
        <div className="w-full flex gap-2 justify-center sm:justify-end order-3 items-center shrink-0">
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
          
          <button 
            onClick={() => navigate('/peta-tematik')}
            className="w-full sm:w-auto pl-5 pr-1.5 py-1.5 bg-[#2563eb] text-white rounded-full font-bold transition-all shadow-lg border-[3px] border-[#2563eb] hover:bg-[#1d4ed8] hover:border-[#1d4ed8] hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center gap-3"
          >
            <span>Peta Tematik</span>
            <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="13 17 18 12 13 7"></polyline>
                <polyline points="6 17 11 12 6 7"></polyline>
              </svg>
            </div>
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-2 bg-white rounded-full font-bold transition-all shadow-lg border-[3px] border-white hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center"
            style={{ color: "#1f2937" }}
          >
            Masuk Admin
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center shrink-0 z-10 mt-4 md:mt-6 flex flex-col items-center px-4">
        <div className="animate-float">
          <p className="font-bold tracking-[0.3em] uppercase text-base md:text-lg mb-1 typewriter-text-custom" style={{ color: "#2563eb", opacity: 1 }}>
            Jelajahi
          </p>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight leading-none animate-color-shift cursor-default">
          Peta Statistik Kabupaten Sidoarjo
        </h1>
        <p className="italic text-sm sm:text-base md:text-lg font-medium m-0 mb-4" style={{ color: "black", opacity: 1 }}>
          {mapMode === "kepadatan" ? "Kepadatan Penduduk Sidoarjo (jiwa/km²)" : "Rasio Jenis Kelamin (Sex Ratio) Kecamatan"}
        </p>

        {/* Map Mode Buttons */}
        <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200 w-fit mx-auto relative z-[2000] mb-4 md:mb-6">
          <button 
            onClick={(e) => { navigate('/peta-tematik') }}
            className={`px-3 py-1.5 text-xs md:text-sm font-bold rounded-md transition-all text-gray-500 hover:bg-amber-100 hover:text-amber-700`}
          >
            Tematik
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setMapMode("kepadatan"); }}
            className={`px-3 py-1.5 text-xs md:text-sm font-bold rounded-md transition-all ${mapMode === "kepadatan" ? "bg-[#1d4ed8] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Kepadatan
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); setMapMode("rasio"); }}
            className={`px-3 py-1.5 text-xs md:text-sm font-bold rounded-md transition-all ${mapMode === "rasio" ? "bg-[#8b5cf6] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
          >
            Rasio L/P
          </button>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full relative z-0 min-h-[500px] px-4 md:px-12 pb-4 flex flex-col">
        <div className="flex-1 w-full bg-gray-300/60 border-[3px] border-gray-400/40 rounded-2xl overflow-hidden shadow-sm relative backdrop-blur-sm">
          {geojsonData ? (
            <MapContainer
              center={[-7.4478, 112.7183]}
              zoom={11}
              minZoom={11}
              maxZoom={16}
              maxBounds={[[-7.65, 112.5], [-7.3, 112.85]]}
              maxBoundsViscosity={1.0}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "transparent", zIndex: 0 }}
              zoomControl={false}
              dragging={true}
              scrollWheelZoom={true}
              doubleClickZoom={true}
            >
              <TileLayer
                url={activeBasemap.url}
                attribution={activeBasemap.attribution}
                maxZoom={activeBasemap.maxZoom}
              />
              <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} />
              <MapController 
                geojsonData={geojsonData} 
                selectedKecamatan={selectedKecamatan} 
                geoJsonRef={geoJsonRef} 
              />
              <MapClickHandler />
              <GeoJSON
                ref={geoJsonRef}
                data={geojsonData}
                style={getStyle}
                onEachFeature={onEachFeature}
              />
            </MapContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="animate-pulse text-gray-500 font-semibold text-sm md:text-base">Memuat peta...</div>
            </div>
          )}

          {/* Info Toggle Button */}
          <button
            onClick={() => setShowInfoPanel(!showInfoPanel)}
            className={`absolute top-4 left-4 z-[1000] w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all border-2 ${showInfoPanel ? 'bg-white text-blue-600 border-white hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
            title="Toggle Informasi Peta"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Dashboard Ringkasan */}
          {sidoarjoAgregat && showInfoPanel && (
            <div className="absolute top-16 left-4 z-[1000] bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl p-4 border border-gray-100/50 max-h-[45%] overflow-y-auto no-scrollbar pointer-events-auto">
              <h3 className="font-extrabold text-sm text-gray-800 mb-2">Ringkasan Demografi Sidoarjo</h3>
              <div className="flex flex-col gap-2">
                <div className="bg-blue-50 px-3 py-2 rounded-lg">
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Total Populasi</div>
                  <div className="font-extrabold text-lg text-blue-900">{sidoarjoAgregat.total.toLocaleString('id-ID')} Jiwa</div>
                </div>
                <div className="flex gap-2">
                  <div className="bg-sky-50 px-3 py-2 rounded-lg flex-1">
                    <div className="text-[10px] text-sky-600 font-bold uppercase">Laki-laki</div>
                    <div className="font-bold text-sm text-sky-900">{sidoarjoAgregat.L.toLocaleString('id-ID')}</div>
                  </div>
                  <div className="bg-pink-50 px-3 py-2 rounded-lg flex-1">
                    <div className="text-[10px] text-pink-600 font-bold uppercase">Perempuan</div>
                    <div className="font-bold text-sm text-pink-900">{sidoarjoAgregat.P.toLocaleString('id-ID')}</div>
                  </div>
                </div>
                <div className="bg-gray-50 px-3 py-2 rounded-lg mt-1">
                  <div className="text-[10px] text-gray-500 font-bold uppercase">Total KK</div>
                  <div className="font-bold text-sm text-gray-700">{sidoarjoAgregat.kk.toLocaleString('id-ID')}</div>
                </div>
              </div>
            </div>
          )}

          {/* Map Legends */}
          {mapMode === "kepadatan" && showInfoPanel && (
            <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-100/50 text-xs max-h-[45%] overflow-y-auto no-scrollbar pointer-events-auto">
              <div className="font-bold text-gray-700 mb-2">Kepadatan Penduduk (Jiwa/km²)</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#1e3a8a]"></span> &gt; 7.000</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#1d4ed8]"></span> 5.000 - 7.000</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#2563eb]"></span> 3.500 - 5.000</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#3b82f6]"></span> 2.500 - 3.500</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#60a5fa]"></span> 1.500 - 2.500</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#93c5fd]"></span> 1.000 - 1.500</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#bfdbfe]"></span> 500 - 1.000</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#dbeafe]"></span> &lt; 500</div>
            </div>
          )}
          {mapMode === "rasio" && showInfoPanel && (
            <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-100/50 text-xs max-h-[45%] overflow-y-auto no-scrollbar pointer-events-auto">
              <div className="font-bold text-gray-700 mb-2">Rasio L/P (Sex Ratio)</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#1e3a8a]"></span> &gt; 105 (Dominan Laki-laki)</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#3b82f6]"></span> 102 - 105 (Lebih banyak Laki-laki)</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#9ca3af]"></span> 98 - 102 (Seimbang)</div>
              <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#ec4899]"></span> 95 - 98 (Lebih banyak Perempuan)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#be185d]"></span> &lt; 95 (Dominan Perempuan)</div>
            </div>
          )}
        </div>

        {/* AI Insight Overlay */}
        <AIInsightBox 
          featureName={selectedKecamatan} 
          data={selectedKecamatan && statsData ? statsData.find(s => (s.kecamatan || s.KECAMATAN || "").toUpperCase() === selectedKecamatan.toUpperCase()) : {}} 
          contextType="statistik_kecamatan" 
          requireClick={true}
          customClass="bottom-6" 
        />
      </div>
    </div>
  );
};

export default LandingPage;
