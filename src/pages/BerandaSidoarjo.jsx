import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import CustomMapControls, { useBasemap } from "../components/CustomMapControls";
import "leaflet/dist/leaflet.css";
import AIInsightBox from "../components/AIInsightBox";

const getKepadatanColor = (pop) => {
  if (pop > 10000) return "#1e3a8a";
  if (pop > 7000) return "#1d4ed8";
  if (pop > 4000) return "#3b82f6";
  if (pop > 2000) return "#60a5fa";
  if (pop > 0) return "#93c5fd";
  return "#e5e7eb";
};

const getRasioColor = (l, p) => {
  if (p === 0) return "#e5e7eb";
  const rjk = (l / p) * 100;
  if (rjk > 105) return "#1e3a8a"; 
  if (rjk > 102) return "#3b82f6";
  if (rjk > 98) return "#9ca3af"; 
  if (rjk > 95) return "#ec4899"; 
  return "#be185d";
};

// Auto Zoom to fit Sidoarjo or selected Desa
const MapController = ({ geojsonData, selectedDesa, geoJsonRef }) => {
  const map = useMap();
  
  // Initial zoom to fit Sidoarjo
  useEffect(() => {
    if (geojsonData && map && !selectedDesa) {
      const tempLayer = L.geoJSON(geojsonData);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [5, 5] });
      }
    }
  }, [geojsonData, map]);

    useEffect(() => {
      if (selectedDesa && geoJsonRef.current && map) {
        geoJsonRef.current.eachLayer((layer) => {
          const layerDesa = (layer.feature.properties.DESA || layer.feature.properties.nmdesa || layer.feature.properties.KECAMATAN || "").toUpperCase();
          if (layerDesa === selectedDesa) {
            map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
            // Optionally open tooltip
            layer.openTooltip();
          }
        });
      }
    }, [selectedDesa, map, geoJsonRef]);

  return null;
};

const desaTematikInfo = {
  "SIMOKETAWANG": ["Pertanian Pertambangan", "Ekonomi Perdagangan"],
  "GROGOL": ["Pertanian Pertambangan"],
  "SIMO ANGIN ANGIN": ["Ekonomi Perdagangan", "Sosial Kependudukan"],
  "SIMOANGINANGIN": ["Ekonomi Perdagangan", "Sosial Kependudukan"],
  "SIDOKEPUNG": ["Sosial Kependudukan"]
};

const filterThemes = ["Sosial Kependudukan", "Ekonomi Perdagangan", "Pertanian Pertambangan"];

const BerandaSidoarjo = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [pendudukData, setPendudukData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeThemes, setActiveThemes] = useState([]);
  const [selectedDesa, setSelectedDesa] = useState(null);
  const [selectedDesaId, setSelectedDesaId] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchThemeQuery, setSearchThemeQuery] = useState("");
  const [mapMode, setMapMode] = useState("tematik"); // "tematik", "kepadatan", "rasio"
  const [activeBasemap, setActiveBasemap] = useBasemap();
  
  const searchRef = useRef(null);
  const geoJsonRef = useRef(null);
  const selectedDesaRef = useRef(null);
  const isFeatureClicked = useRef(false);
  const navigate = useNavigate();

  const sidoarjoAgregat = React.useMemo(() => {
    if (!pendudukData) return null;
    let L = 0, P = 0, total = 0, kk = 0;
    Object.values(pendudukData).forEach(d => {
      L += d.L; P += d.P; total += d.total_penduduk; kk += d.total_kk;
    });
    return { L, P, total, kk };
  }, [pendudukData]);

  useEffect(() => {
    selectedDesaRef.current = selectedDesa;
  }, [selectedDesa]);

  useEffect(() => {
    // Fetch the new boundaries GeoJSON and Population Data
    Promise.all([
      fetch("/data/peta_sidoarjo.geojson").then((res) => res.json()),
      fetch("/data/penduduk.json").then((res) => res.json())
    ])
      .then(([geoJson, penduduk]) => {
        setGeojsonData(geoJson);
        setPendudukData(penduduk);
      })
      .catch((err) => console.error("Error loading data:", err));
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
        const desa = (props.DESA || props.nmdesa || props.KECAMATAN || "").toLowerCase();
        return desa.includes(term);
      })
      .slice(0, 5); // Limit to 5 results for clean UI
    
    // Remove duplicates if any
    const uniqueResults = [];
    const seen = new Set();
    for (const res of results) {
      const nm = res.DESA || res.nmdesa;
      if (!seen.has(nm)) {
        seen.add(nm);
        uniqueResults.push(res);
      }
    }
    
    setSearchResults(uniqueResults);
  }, [searchTerm, geojsonData]);

  const handleNavigateDetail = (desaName) => {
    const normalizedName = desaName.replace(/\s+/g, '').toUpperCase();
    if (normalizedName === "SIMOANGINANGIN") {
      navigate("/detail-simoanginangin");
    } else {
      navigate(`/detail?desa=${encodeURIComponent(desaName)}`);
    }
  };

  const handleSelectSearch = (desaName) => {
    if (selectedDesa === desaName) {
      handleNavigateDetail(desaName);
    } else {
      setSelectedDesa(desaName);
      setSearchTerm(desaName);
      setIsSearchFocused(false);
    }
  };

  const toggleTheme = (theme) => {
    setActiveThemes((prev) =>
      prev.includes(theme)
        ? prev.filter((t) => t !== theme)
        : [...prev, theme]
    );
  };

  const getStyle = (feature) => {
    const rawName = feature.properties.DESA || feature.properties.nmdesa || feature.properties.KECAMATAN || "";
    const desaName = rawName.toUpperCase();
    const iddesa = feature.properties.iddesa;
    const isSelected = selectedDesa === desaName || (selectedDesa && selectedDesa.toUpperCase() === desaName);
    
    let fillColor;
    if (mapMode === "kepadatan") {
      const pData = pendudukData && pendudukData[iddesa];
      fillColor = getKepadatanColor(pData ? pData.total_penduduk : 0);
    } else if (mapMode === "rasio") {
      const pData = pendudukData && pendudukData[iddesa];
      fillColor = pData ? getRasioColor(pData.L, pData.P) : "#e5e7eb";
    } else {
      const isTematik = desaTematikInfo[desaName] !== undefined;
      const villageThemes = desaTematikInfo[desaName] || [];
      const isHighlighted = activeThemes.length === 0 
        ? isTematik 
        : villageThemes.some(t => activeThemes.includes(t));
      
      if (activeThemes.length > 0) {
        fillColor = isHighlighted ? "#f59e0b" : "#e5e7eb"; // Amber for matching, grey for others
      } else {
        fillColor = isTematik ? "#fbbf24" : "#e5e7eb";
      }
    }

    return {
      fillColor,
      opacity: 1,
      color: isSelected ? "#ffffff" : "#475569", // Slate dark grey
      weight: isSelected ? 3 : 2,
      dashArray: isSelected ? "" : "3",
      fillOpacity: (mapMode === "tematik" && activeThemes.length > 0 && !fillColor.includes("f59e0b")) ? 0.3 : (isSelected ? 0.7 : 0.5),
    };
  };

  const getHoverStyle = (feature) => {
    const rawName = feature.properties.DESA || feature.properties.nmdesa || feature.properties.KECAMATAN || "";
    const desaName = rawName.toUpperCase();
    const isTematik = desaTematikInfo[desaName] !== undefined;
    const villageThemes = desaTematikInfo[desaName] || [];
    const isSelected = selectedDesa === desaName || (selectedDesa && selectedDesa.toUpperCase() === desaName);
    
    if (mapMode === "kepadatan" || mapMode === "rasio") {
        return {
          ...getStyle(feature),
          weight: isSelected ? 3 : 2,
          color: isSelected ? "#ffffff" : "#1e293b",
          dashArray: "",
          fillOpacity: 0.7
        };
      }

    const isHighlighted = activeThemes.length === 0 
      ? isTematik 
      : villageThemes.some(t => activeThemes.includes(t));

    const fillColor = (activeThemes.length > 0) 
      ? (isHighlighted ? "#d97706" : "#cbd5e1")
      : (isHighlighted ? "#eab308" : "#cbd5e1");

    return {
      ...getStyle(feature),
      fillColor: fillColor,
      weight: isSelected ? 3 : 2,
      color: isSelected ? "#ffffff" : "#1e293b",
      dashArray: "",
      fillOpacity: 0.8,
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
        const layerDesa = layer.feature.properties.DESA || layer.feature.properties.nmdesa || layer.feature.properties.KECAMATAN;
        if (selectedDesa && layerDesa === selectedDesa) {
          layer.bringToFront();
        }
      });
    }
  }, [selectedDesa, activeThemes, pendudukData, mapMode]);

  const MapClickHandler = () => {
    useMapEvents({
      click: () => {
        if (!isFeatureClicked.current) {
          setSelectedDesa(null);
          setSelectedDesaId(null);
        }
      },
    });
    return null;
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const rawName = props.DESA || props.nmdesa || props.KECAMATAN || "";
    const desaName = rawName.toUpperCase();
    const displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    
    const iddesa = props.iddesa;
    const villageThemes = desaTematikInfo[desaName] || [];
    const temaString = villageThemes.length > 0 ? villageThemes.join(", ") : null;
    const pData = pendudukData && pendudukData[iddesa] ? pendudukData[iddesa] : null;

    let tooltipContent = `
      <div style="font-family: 'Inter', sans-serif; text-align: center; padding: 4px;">
        <div style="font-weight: bold; font-size: 14px;">${displayName}</div>
        <div style="font-size: 11px; color: #666;">Kecamatan ${props.KECAMATAN || props.nmkec || ""}</div>
        ${temaString ? `<div style="font-size: 11px; font-weight: bold; color: #1e40af; margin-top: 4px; padding: 2px 6px; background: #eff6ff; border-radius: 4px; border: 1px solid #bfdbfe;">Tema: ${temaString}</div>` : ''}
    `;

    if (pData) {
      tooltipContent += `
        <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e5e7eb; font-size: 11px; text-align: left;">
          <div style="display: flex; justify-content: space-between;"><span>Penduduk:</span> <strong>${pData.total_penduduk.toLocaleString('id-ID')} Jiwa</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>L/P:</span> <strong>${pData.L.toLocaleString('id-ID')} / ${pData.P.toLocaleString('id-ID')}</strong></div>
          <div style="display: flex; justify-content: space-between;"><span>Jumlah KK:</span> <strong>${pData.total_kk.toLocaleString('id-ID')}</strong></div>
        </div>
      `;
    }

    tooltipContent += `</div>`;

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
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getStyleRef.current(feature));
      },
      click: (e) => {
        isFeatureClicked.current = true;
        if (selectedDesaRef.current === desaName) {
          handleNavigateDetail(desaName);
        } else {
          setSelectedDesa(desaName);
          setSelectedDesaId(iddesa);
        }
        setTimeout(() => { isFeatureClicked.current = false; }, 50);
      },
    });
  };

  return (
    <div className="w-full min-h-screen bg-[#e0f2fe] flex flex-col relative overflow-x-hidden" onClick={() => setSelectedDesa(null)}>
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
        @keyframes blink {
          50% { border-color: transparent; }
        }

        /* Leaflet Controls Focus Style */
        .leaflet-bar a:active,
        .leaflet-bar a:focus,
        .leaflet-bar button:active,
        .leaflet-bar button:focus {
          outline: none !important;
          box-shadow: inset 0 0 0 2px #2563eb !important;
          color: #2563eb !important;
        }
        
        .animate-color-shift {
          animation: colorShift 5s ease-in-out infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
          display: inline-block;
        }
        .typewriter-text {
          display: inline-block;
          overflow: hidden;
          white-space: nowrap;
          border-right: 3px solid #2563eb;
          animation: typing 2s steps(20, end) forwards, blink 0.75s step-end infinite;
          max-width: 0;
          padding-right: 4px;
        }
      `}</style>

      {/* Top Navigation Bar - Responsive */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-center px-4 py-3 md:px-8 md:py-4 gap-4 sm:gap-0 z-[1000] bg-[#bae6fd] shadow-sm rounded-b-xl md:rounded-b-2xl">
        
        {/* Search Bar */}
        <div ref={searchRef} className="w-full sm:w-1/3 flex justify-start relative order-2 sm:order-1" onClick={(e) => e.stopPropagation()}>
          <div className="relative w-full sm:w-72 md:w-80">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari desa..."
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
                    onClick={() => handleSelectSearch(result.DESA || result.nmdesa)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="font-semibold text-sm md:text-base" style={{ color: "#1f2937" }}>{result.DESA || result.nmdesa}</div>
                    <div className="text-xs" style={{ color: "#6b7280" }}>Kecamatan {result.KECAMATAN || result.nmkec}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500 text-center italic">
                  Desa tidak ditemukan
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Center Logos */}
        <div className="w-full sm:w-1/3 flex justify-center items-center gap-4 sm:gap-6 order-1 sm:order-2">
          <img src="/pict/logo_sidoarjo.png" alt="Sidoarjo" className="h-10 md:h-12 object-contain" />
          <img src="/pict/logo_bps.png" alt="BPS" className="h-10 md:h-12 object-contain" />
          <img src="/pict/logo_dc.png" alt="Desa Cantik" className="h-10 md:h-12 object-contain" />
        </div>

        {/* Action Buttons */}
        <div className="w-full sm:w-1/3 flex gap-3 justify-end order-3">
          <button 
            onClick={() => navigate('/')}
            className="w-full sm:w-auto pr-5 pl-1.5 py-1.5 bg-[#2563eb] text-white rounded-full font-bold transition-all shadow-lg border-[3px] border-[#2563eb] hover:bg-[#1d4ed8] hover:border-[#1d4ed8] hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base flex items-center justify-center gap-3"
          >
            <div className="w-7 h-7 md:w-8 md:h-8 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="11 17 6 12 11 7"></polyline>
                <polyline points="18 17 13 12 18 7"></polyline>
              </svg>
            </div>
            <span>Peta Statistik</span>
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
      <div className="text-center z-10 mt-10 md:mt-16 mb-4 md:mb-6 flex flex-col items-center px-4">
        <div className="animate-float">
          <p className="text-[#2563eb] font-bold tracking-[0.3em] uppercase text-sm md:text-base mb-2 typewriter-text">
            Jelajahi
          </p>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight leading-none animate-color-shift cursor-default">
          Peta Tematik Desa Kabupaten Sidoarjo
        </h1>
        <p className="italic text-sm sm:text-base md:text-lg font-medium m-0" style={{ color: "black", opacity: 1 }}>
          Arahkan kursor ke wilayah untuk melihat informasi singkat
        </p>
      </div>

      {/* Theme Filter Area */}
      <div className="w-full px-4 md:px-12 flex flex-col md:flex-row justify-between items-center mb-4 relative z-[2000] gap-3">
        
        {/* Map Mode Buttons */}
        <div className="flex bg-white rounded-lg shadow-sm p-1 border border-gray-200">
          <button 
            onClick={(e) => { e.stopPropagation(); setMapMode("tematik"); }}
            className={`px-3 py-1.5 text-xs md:text-sm font-bold rounded-md transition-all ${mapMode === "tematik" ? "bg-[#eab308] text-white shadow-sm" : "text-gray-500 hover:bg-gray-100"}`}
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

        <div className="flex flex-grow justify-end items-center gap-3">
          {/* Active Theme Chips */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar justify-end" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {activeThemes.map((theme) => (
              <div key={theme} className="flex items-center gap-1 px-3 py-1.5 bg-[#eff6ff] border-2 border-[#bfdbfe] text-[#1e40af] rounded-full text-xs font-bold shadow-sm whitespace-nowrap">
                {theme}
                <button onClick={() => toggleTheme(theme)} className="text-[#1d4ed8] hover:text-[#1e3a8a] ml-1 transition-colors">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>
            ))}
            <style>{`
              .overflow-x-auto::-webkit-scrollbar {
                display: none;
              }
            `}</style>
          </div>

          {/* Filter Dropdown */}
        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#2563eb] text-white rounded-lg shadow-lg hover:bg-[#1d4ed8] hover:shadow-xl transition-all font-bold tracking-wide border-2 border-transparent active:border-white focus:border-white focus:outline-none"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="7" x2="20" y2="7"></line>
              <line x1="7" y1="12" x2="17" y2="12"></line>
              <line x1="10" y1="17" x2="14" y2="17"></line>
            </svg>
            Tema {activeThemes.length > 0 && <span className="bg-white text-[#2563eb] text-[10px] px-2 py-0.5 rounded-full ml-1">{activeThemes.length}</span>}
          </button>
          
          {isFilterOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[2000] flex flex-col max-h-[60vh]">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pilih Tema</span>
                {activeThemes.length > 0 && (
                  <button onClick={() => setActiveThemes([])} className="text-xs font-bold text-red-500 hover:text-red-700 underline">Reset</button>
                )}
              </div>
              
              {/* Search Theme Input */}
              <div className="px-3 py-2 bg-white border-b border-gray-50 shrink-0">
                <input
                  type="text"
                  placeholder="Cari tema..."
                  value={searchThemeQuery}
                  onChange={(e) => setSearchThemeQuery(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#2563eb] text-[#1f2937]"
                />
              </div>

              <div className="overflow-y-auto no-scrollbar">
              {filterThemes
                .filter(theme => theme.toLowerCase().includes(searchThemeQuery.toLowerCase()))
                .map((theme) => {
                  const isSelected = activeThemes.includes(theme);
                  return (
                    <button
                      key={theme}
                      onClick={() => toggleTheme(theme)}
                      className="w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-b-0 flex justify-between items-center hover:bg-blue-50"
                    >
                      <span className={`font-medium ${isSelected ? "text-[#1d4ed8] font-bold" : "text-[#1f2937]"}`}>
                        {theme}
                      </span>
                      {isSelected && (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                    </button>
                  );
                })}
              {filterThemes.filter(theme => theme.toLowerCase().includes(searchThemeQuery.toLowerCase())).length === 0 && (
                <div className="px-4 py-4 text-center text-sm text-gray-400 font-medium">Tema tidak ditemukan</div>
              )}
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Map Container */}
      <div 
        className="w-full flex-grow relative pb-6 md:pb-10 px-4 md:px-12" 
        style={{ height: "70vh", minHeight: "500px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-full bg-gray-300/60 border-[3px] border-gray-400/40 rounded-2xl overflow-hidden shadow-sm relative backdrop-blur-sm">
          {geojsonData ? (
            <MapContainer
              center={[-7.45, 112.7]}
              zoom={11}
              minZoom={10}
              maxZoom={14}
              zoomSnap={0.5}
              zoomDelta={0.5}
              maxBounds={[[-7.7, 112.4], [-7.2, 113.0]]}
              maxBoundsViscosity={1.0}
              style={{ height: "100%", width: "100%", background: "transparent" }}
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
              selectedDesa={selectedDesa} 
              geoJsonRef={geoJsonRef} 
            />
            <GeoJSON
              key={`geojson-${activeThemes.join("-")}`}
              ref={geoJsonRef}
              data={geojsonData}
              style={getStyle}
              onEachFeature={onEachFeature}
            />
            <MapClickHandler />
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-gray-500 font-semibold text-sm md:text-base">Memuat peta...</div>
          </div>
        )}

        {/* Dashboard Ringkasan */}
        {sidoarjoAgregat && (
          <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl p-4 border border-gray-100/50 hidden md:block">
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
        {mapMode === "tematik" && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-100/50 text-xs hidden sm:block">
            <div className="font-bold text-gray-700 mb-2">Keterangan Peta Tematik</div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-4 h-4 rounded bg-[#fbbf24] border border-[#f59e0b]"></span> 
              <span>Desa Tematik</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#e5e7eb] border border-gray-300"></span> 
              <span>Belum Dipetakan</span>
            </div>
          </div>
        )}
        {mapMode === "kepadatan" && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-100/50 text-xs hidden sm:block">
            <div className="font-bold text-gray-700 mb-2">Kepadatan Penduduk (Jiwa)</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#1e3a8a]"></span> &gt; 10.000</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#1d4ed8]"></span> 7.000 - 10.000</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#3b82f6]"></span> 4.000 - 7.000</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#60a5fa]"></span> 2.000 - 4.000</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#93c5fd]"></span> &lt; 2.000</div>
          </div>
        )}
        {mapMode === "rasio" && (
          <div className="absolute bottom-6 left-4 z-[1000] bg-white/90 backdrop-blur-md shadow-lg rounded-xl p-3 border border-gray-100/50 text-xs hidden sm:block">
            <div className="font-bold text-gray-700 mb-2">Rasio L/P (Sex Ratio)</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#1e3a8a]"></span> &gt; 105 (Dominan Laki-laki)</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#3b82f6]"></span> 102 - 105 (Lebih banyak Laki-laki)</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#9ca3af]"></span> 98 - 102 (Seimbang)</div>
            <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded bg-[#ec4899]"></span> 95 - 98 (Lebih banyak Perempuan)</div>
            <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-[#be185d]"></span> &lt; 95 (Dominan Perempuan)</div>
          </div>
        )}
        
        {/* Selected Village Action Card */}
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${selectedDesa ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
            <div className="bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-4 md:p-5 flex flex-col items-center gap-3 border border-gray-100/50 max-w-sm w-[90vw]">
              <div className="text-center">
                <h3 className="font-extrabold text-lg md:text-xl text-gray-800">{selectedDesa}</h3>
                <p className="text-xs md:text-sm text-gray-500 font-medium mt-0.5">
                  {selectedDesa && desaTematikInfo[selectedDesa] ? `Memiliki ${desaTematikInfo[selectedDesa].length} Potensi Tematik` : 'Desa di Kabupaten Sidoarjo'}
                </p>
              </div>
              <button 
                onClick={() => {
                  if (selectedDesa) {
                    handleNavigateDetail(selectedDesa);
                  }
                }}
                className="w-full py-2.5 px-6 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              >
                <span>Lihat Detail Desa</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default BerandaSidoarjo;
