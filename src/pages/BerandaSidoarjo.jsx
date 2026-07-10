import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Auto Zoom to fit Sidoarjo
const AutoZoom = ({ geojsonData }) => {
  const map = useMap();
  useEffect(() => {
    if (geojsonData && map) {
      const tempLayer = L.geoJSON(geojsonData);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [5, 5] });
      }
    }
  }, [geojsonData, map]);
  return null;
};

const desaTematikInfo = {
  "Simoketawang": ["Kelengkeng", "UMKM"],
  "Grogol": ["Sayuran"],
  "Simoanginangin": ["UMKM", "Ketenagakerjaan"],
  "Sidokepung": ["Ketenagakerjaan"]
};

const filterThemes = ["Kelengkeng", "Sayuran", "UMKM", "Ketenagakerjaan"];

const BerandaSidoarjo = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeThemes, setActiveThemes] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchThemeQuery, setSearchThemeQuery] = useState("");
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the boundaries GeoJSON from public folder
    fetch("/data/Administrasi_Desa.geojson")
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error loading boundaries:", err));
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
        const desa = (props.DESA || props.KECAMATAN || "").toLowerCase();
        return desa.includes(term);
      })
      .slice(0, 5); // Limit to 5 results for clean UI
    
    // Remove duplicates if any
    const uniqueResults = [];
    const seen = new Set();
    for (const res of results) {
      if (!seen.has(res.DESA)) {
        seen.add(res.DESA);
        uniqueResults.push(res);
      }
    }
    
    setSearchResults(uniqueResults);
  }, [searchTerm, geojsonData]);

  const handleSelectVillage = (desaName) => {
    navigate(`/detail?desa=${encodeURIComponent(desaName)}`);
  };

  const toggleTheme = (theme) => {
    setActiveThemes((prev) =>
      prev.includes(theme)
        ? prev.filter((t) => t !== theme)
        : [...prev, theme]
    );
  };

  const getStyle = (feature) => {
    const desaName = feature.properties.DESA || feature.properties.KECAMATAN;
    const isTematik = desaTematikInfo[desaName] !== undefined;
    const villageThemes = desaTematikInfo[desaName] || [];
    
    // Highlight if no themes selected (show all thematic) OR if village has any of the selected themes
    const isHighlighted = activeThemes.length === 0 
      ? isTematik 
      : villageThemes.some(t => activeThemes.includes(t));

    return {
      fillColor: isHighlighted ? "#2563eb" : "#3b82f6", // Highlighted solid blue vs base blue
      weight: isHighlighted ? 2 : 1,
      opacity: 1,
      color: "white", // White border
      fillOpacity: isHighlighted ? 0.85 : 0.15, // Transparent for non-highlighted so satellite shows
    };
  };

  const getHoverStyle = (feature) => {
    const desaName = feature.properties.DESA || feature.properties.KECAMATAN;
    const isTematik = desaTematikInfo[desaName] !== undefined;
    const villageThemes = desaTematikInfo[desaName] || [];
    
    const isHighlighted = activeThemes.length === 0 
      ? isTematik 
      : villageThemes.some(t => activeThemes.includes(t));

    return {
      fillColor: isHighlighted ? "#1e40af" : "#2563eb",
      weight: 3,
      opacity: 1,
      color: "white", // White on hover
      fillOpacity: isHighlighted ? 1 : 0.4,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const desaName = props.DESA || props.KECAMATAN;
    const villageThemes = desaTematikInfo[desaName] || [];
    const temaString = villageThemes.length > 0 ? villageThemes.join(", ") : null;

    const tooltipContent = `
      <div style="font-family: 'Inter', sans-serif; text-align: center; padding: 4px;">
        <div style="font-weight: bold; font-size: 14px;">${desaName}</div>
        <div style="font-size: 11px; color: #666;">Kecamatan ${props.KECAMATAN}</div>
        ${temaString ? `<div style="font-size: 11px; font-weight: bold; color: #1e40af; margin-top: 4px; padding: 2px 6px; background: #eff6ff; border-radius: 4px; border: 1px solid #bfdbfe;">Potensi: ${temaString}</div>` : ''}
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
        l.setStyle(getHoverStyle(feature));
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getStyle(feature));
      },
      click: () => {
        handleSelectVillage(desaName);
      },
    });
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
      <div className="w-full flex flex-col sm:flex-row justify-between items-center px-4 py-4 md:px-8 md:pt-6 gap-4 sm:gap-0 z-[1000]">
        
        {/* Search Bar */}
        <div ref={searchRef} className="w-full sm:w-72 md:w-80 relative order-2 sm:order-1">
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
                    onClick={() => handleSelectVillage(result.DESA)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="font-semibold text-sm md:text-base" style={{ color: "#1f2937" }}>{result.DESA}</div>
                    <div className="text-xs" style={{ color: "#6b7280" }}>Kecamatan {result.KECAMATAN}</div>
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

        {/* Login Button */}
        <div className="w-full sm:w-auto flex justify-end order-1 sm:order-2">
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-6 py-2 bg-white rounded-full font-bold transition-all shadow-lg border-2 border-transparent hover:border-[#2563eb] hover:shadow-xl hover:-translate-y-0.5 text-sm md:text-base"
            style={{ color: "#1f2937" }}
          >
            Masuk Admin
          </button>
        </div>
      </div>

      {/* Header Info */}
      <div className="text-center z-10 mb-4 md:mb-6 mt-2 flex flex-col items-center px-4">
        <div className="animate-float">
          <p className="text-[#2563eb] font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-2 typewriter-text">
            Jelajahi
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 tracking-tight leading-none animate-color-shift cursor-default">
          Peta Tematik Desa Kabupaten Sidoarjo
        </h1>
        <p className="italic text-xs sm:text-sm md:text-base font-medium m-0" style={{ color: "black", opacity: 1 }}>
          Arahkan kursor ke wilayah untuk melihat informasi singkat
        </p>
      </div>

      {/* Theme Filter Area */}
      <div className="w-full px-4 md:px-12 flex justify-start md:justify-end items-center mb-4 relative z-[2000] gap-3">
        
        {/* Active Theme Chips */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar flex-grow md:flex-grow-0 justify-end" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
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
        <div className="relative flex-shrink-0">
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

      {/* Map Container */}
      <div className="w-full flex-grow relative pb-6 md:pb-10 px-4 md:px-12" style={{ height: "70vh", minHeight: "500px" }}>
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
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
              maxZoom={17}
            />
            <ZoomControl position="bottomright" />
            <AutoZoom geojsonData={geojsonData} />
            <GeoJSON
              key={`geojson-${activeThemes.join("-")}`}
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
        </div>
      </div>
    </div>
  );
};

export default BerandaSidoarjo;
