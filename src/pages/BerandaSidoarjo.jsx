import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import CustomMapControls, { useBasemap } from "../components/CustomMapControls";
import "leaflet/dist/leaflet.css";
import AIInsightBox from "../components/AIInsightBox";
import RightSidebar from "../components/RightSidebar";

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
  
  // Initial zoom to fit Sidoarjo or reset when selection cleared
  useEffect(() => {
    if (geojsonData && map && !selectedDesa) {
      // Fixed view to prevent zooming out too far on wide screens
      map.setView([-7.4478, 112.7183], 11);
    }
  }, [geojsonData, map, selectedDesa]);

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
  "SIMOKETAWANG": ["Ekonomi Perdagangan"],
  "SIMO ANGIN ANGIN": ["Ekonomi Perdagangan"],
  "SIMOANGINANGIN": ["Ekonomi Perdagangan"],
  "SIDOKEPUNG": ["Sosial Kependudukan"],
  "WAUNG": ["Sosial Kependudukan"]
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
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchThemeQuery, setSearchThemeQuery] = useState("");
  const [mapMode, setMapMode] = useState("tematik"); // "tematik", "kepadatan", "rasio"
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
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
      });
    setSearchResults(results.slice(0, 5)); // limit to 5 results
  }, [searchTerm, geojsonData]);

  const toggleTheme = (theme) => {
    setActiveThemes((prev) =>
      prev.includes(theme) ? prev.filter((t) => t !== theme) : [...prev, theme]
    );
  };

  const getStyle = (feature) => {
    const desa = (feature.properties.DESA || feature.properties.nmdesa || feature.properties.KECAMATAN || "").toUpperCase();
    
    // Map Mode: Kepadatan
    if (mapMode === "kepadatan") {
      const data = pendudukData && pendudukData[desa];
      const color = data ? getKepadatanColor(data.kepadatan) : "#e5e7eb";
      return { fillColor: color, weight: 1, opacity: 1, color: "white", fillOpacity: 0.8 };
    }
    
    // Map Mode: Rasio
    if (mapMode === "rasio") {
      const data = pendudukData && pendudukData[desa];
      const color = data ? getRasioColor(data.rasio) : "#e5e7eb";
      return { fillColor: color, weight: 1, opacity: 1, color: "white", fillOpacity: 0.8 };
    }

    // Map Mode: Tematik
    const isDesaTematik = desaTematikInfo[desa] && desaTematikInfo[desa].length > 0;
    let matchesTheme = true;
    if (activeThemes.length > 0) {
      if (!desaTematikInfo[desa]) {
        matchesTheme = false;
      } else {
        matchesTheme = activeThemes.some(theme => desaTematikInfo[desa].includes(theme));
      }
    }

    let fillColor = "#e5e7eb";
    if (isDesaTematik) fillColor = "#fbbf24";
    if (!matchesTheme) fillColor = "#e5e7eb";
    
    return { fillColor, weight: 1, opacity: 1, color: "white", fillOpacity: 0.8 };
  };

  const onEachFeature = (feature, layer) => {
    const desa = (feature.properties.DESA || feature.properties.nmdesa || feature.properties.KECAMATAN || "").toUpperCase();
    
    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ weight: 3, color: '#666', fillOpacity: 0.9 });
        l.bringToFront();
      },
      mouseout: (e) => {
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: (e) => {
        const kec = feature.properties.KECAMATAN || "";
        setSelectedDesa(desa);
        setSelectedDesaId(desa);
        setSelectedKecamatan(kec);
      }
    });
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: () => {
        setIsSearchFocused(false);
      }
    });
    return null;
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-200 font-sans relative">
      <style>{`
          display: none !important;
        }
        .leaflet-container {
          background: #e8eaed !important;
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
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          display: flex;
          flex-direction: column;
          margin-right: 1rem !important;
          margin-bottom: 1rem !important;
          overflow: hidden !important;
          background-color: white !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: white !important;
          color: #374151 !important;
          border: none !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 400 !important;
          font-size: 1.25rem !important;
          transition: background-color 0.15s !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background-color: #f9fafb !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
        .leaflet-bar a:active, .leaflet-bar a:focus,
        .leaflet-bar button:active, .leaflet-bar button:focus {
          outline: none !important;
          box-shadow: none !important;
        }
        .panel-scroll::-webkit-scrollbar { width: 3px; }
        .panel-scroll::-webkit-scrollbar-track { background: transparent; }
        .panel-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      `}</style>

      {/* MAIN MAP AREA */}
      <div className="flex-grow relative h-full">
        <div className="absolute inset-0">
          {geojsonData ? (
            <MapContainer
              center={[-7.4478, 112.7183]}
              zoom={11}
              minZoom={11}
              maxZoom={16}
              zoomSnap={0.5}
              zoomDelta={0.5}
              maxBounds={[[-8.0, 112.0], [-7.0, 113.5]]}
              maxBoundsViscosity={1.0}
              style={{ width: "100%", height: "100%", zIndex: 0 }}
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
              <CustomMapControls
                activeBasemap={activeBasemap}
                setActiveBasemap={setActiveBasemap}
                onLayerOpenChange={setIsLayerOpen}
              />
              <MapController geojsonData={geojsonData} selectedDesa={selectedDesa} geoJsonRef={geoJsonRef} />
              <GeoJSON ref={geoJsonRef} data={geojsonData} style={getStyle} onEachFeature={onEachFeature} />
              <MapClickHandler />
            </MapContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-400 font-medium">Memuat peta...</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating controls that STAY ON THE MAP */}
        <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-start gap-2 pointer-events-none">
          {/* Search bar */}
          <div
            ref={searchRef}
            className="relative flex-1 max-w-xs pointer-events-auto z-[50]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Cari desa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-10 pr-9 py-3 bg-white rounded-2xl shadow-md border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400 text-sm font-medium"
                style={{ color: "#1f2937" }}
              />
              <svg className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setSearchTerm(""); setSearchResults([]); setSelectedDesa(null); }}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
            {/* Autocomplete dropdown */}
            {isSearchFocused && searchTerm.trim() !== "" && (
              <div
                className="absolute w-full mt-1 bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden"
                style={{ zIndex: 3000, maxHeight: "150px", overflowY: "auto" }}
              >
                {searchResults.length > 0 ? (
                  searchResults.map((result, idx) => {
                    let desaName = result.DESA || result.nmdesa;
                    if (desaName && !desaName.toLowerCase().startsWith("desa ") && !desaName.toLowerCase().startsWith("kelurahan ")) {
                      desaName = "Desa " + desaName;
                    }
                    return (
                      <button
                        key={idx}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handleSelectSearch(result.DESA || result.nmdesa)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                      >
                        <div className="w-7 h-7 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                          <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-gray-800">{desaName}</div>
                          <div className="text-xs text-gray-400">Kecamatan {result.KECAMATAN || result.nmkec}</div>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="px-4 py-4 text-sm text-gray-400 text-center">
                    Desa tidak ditemukan
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Map mode selector */}
          <div
            className={`relative bg-white rounded-2xl shadow-md shrink-0 pointer-events-auto flex items-center overflow-hidden ${
              mapMode === "tematik" ? "ring-2 ring-amber-400" :
              mapMode === "kepadatan" ? "ring-2 ring-blue-500" :
              "ring-2 ring-purple-500"
            }`}
          >
            <select
              value={mapMode}
              onChange={(e) => { e.stopPropagation(); setMapMode(e.target.value); }}
              className="pl-4 pr-9 py-3 text-sm font-semibold text-gray-700 bg-transparent outline-none appearance-none cursor-pointer"
              style={{ minWidth: "145px" }}
            >
              <option value="tematik">Peta Tematik</option>
              <option value="kepadatan">Kepadatan</option>
              <option value="rasio">Rasio L/P</option>
            </select>
            <div className="absolute right-3 pointer-events-none">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          {/* Theme filter */}
          <div className="relative shrink-0 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`bg-white rounded-2xl shadow-md px-4 py-3 flex items-center gap-2 text-sm font-semibold transition-all ${
                isFilterOpen ? "ring-2 ring-blue-500 text-blue-600" : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="17" x2="14" y2="17" />
              </svg>
              <span className="hidden sm:inline">Tema</span>
              {activeThemes.length > 0 && (
                <span className="bg-blue-500 text-white text-[10px] min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center font-bold leading-none">
                  {activeThemes.length}
                </span>
              )}
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl overflow-hidden z-[2000] flex flex-col">
                <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center shrink-0">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Pilih Tema</span>
                  {activeThemes.length > 0 && (
                    <button onClick={() => setActiveThemes([])} className="text-xs font-bold text-red-400 hover:text-red-600">Reset</button>
                  )}
                </div>
                <div className="px-3 py-2 border-b border-gray-50 shrink-0">
                  <input
                    type="text"
                    placeholder="Cari tema..."
                    value={searchThemeQuery}
                    onChange={(e) => setSearchThemeQuery(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-100 rounded-xl bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400 text-gray-700"
                  />
                </div>
                <div className="overflow-y-auto max-h-48">
                  {filterThemes
                    .filter((t) => t.toLowerCase().includes(searchThemeQuery.toLowerCase()))
                    .map((theme) => {
                      const isSelected = activeThemes.includes(theme);
                      return (
                        <button
                          key={theme}
                          onClick={() => toggleTheme(theme)}
                          className={`w-full text-left px-4 py-3 text-sm transition-colors border-b border-gray-50 last:border-b-0 flex justify-between items-center ${
                            isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <span className={`font-medium ${isSelected ? "text-blue-600" : "text-gray-700"}`}>{theme}</span>
                          {isSelected && (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  {filterThemes.filter((t) => t.toLowerCase().includes(searchThemeQuery.toLowerCase())).length === 0 && (
                    <div className="px-4 py-4 text-center text-sm text-gray-400">Tema tidak ditemukan</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Desa Card */}
        <div
          className={`absolute bottom-6 left-3 z-[1000] w-72 transition-all duration-300 ease-out ${
            selectedDesa ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-gray-900 leading-tight">
                    {selectedDesa
                      ? selectedDesa.charAt(0).toUpperCase() + selectedDesa.slice(1).toLowerCase()
                      : ""}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {selectedKecamatan ? `Kecamatan ${selectedKecamatan}` : "Kabupaten Sidoarjo"}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedDesa(null); setSelectedDesaId(null); }}
                  className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 transition-colors"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              {selectedDesa && desaTematikInfo[selectedDesa] && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {desaTematikInfo[selectedDesa].map((theme) => (
                    <span
                      key={theme}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {selectedDesaId && pendudukData && pendudukData[selectedDesaId] && (
              <div className="px-5 py-3 border-t border-gray-50 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-0.5">Penduduk</div>
                  <div className="font-bold text-sm text-gray-800">
                    {pendudukData[selectedDesaId].total_penduduk.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-0.5">L / P</div>
                  <div className="font-bold text-sm text-gray-800">
                    {pendudukData[selectedDesaId].L.toLocaleString("id-ID")}/{pendudukData[selectedDesaId].P.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-0.5">KK</div>
                  <div className="font-bold text-sm text-gray-800">
                    {pendudukData[selectedDesaId].total_kk.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            )}

            <div className="px-4 py-3 border-t border-gray-50">
              <button
                onClick={() => { if (selectedDesa) handleNavigateDetail(selectedDesa, selectedKecamatan); }}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
                  <path d="M8 2v16M16 6v16" />
                </svg>
                Lihat Detail Desa
              </button>
            </div>
          </div>
        </div>

        {/* AI Insight Box */}
        {selectedDesa && (
          <AIInsightBox
            desaName={selectedDesa}
            featureName={`Desa ${selectedDesa}`}
            contextType="demografi"
            requireClick={true}
            customClass="bottom-6 right-4"
            data={sidoarjoAgregat}
          />
        )}

        {!isSidebarOpen && (
          <button onClick={() => setIsSidebarOpen(true)} className="absolute top-1/2 right-0 z-[1000] bg-white p-2 rounded-l-lg shadow-md hover:bg-gray-50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
        )}
      </div>

      {/* RIGHT SIDEBAR */}
      <RightSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        desaName="SIDOARJO"
        themeName="PETA TEMATIK"
        themeIcon="/pict/des-can.png"
      >
        {/* Buttons / Actions */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => navigate("/login")}
            className="flex-1 bg-blue-50 text-blue-600 rounded-xl px-4 py-3 text-sm font-semibold hover:bg-blue-100 transition-colors text-center"
          >
            Masuk Admin
          </button>
          <button
            onClick={() => navigate("/bantuan")}
            className="w-12 h-12 bg-gray-50 text-gray-600 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-colors"
            title="Panduan Penggunaan"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          </button>
        </div>

        {/* Legend Panel */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4">
          <div className="font-bold text-gray-700 text-sm mb-3 pb-2 border-b border-gray-200">
            {mapMode === "kepadatan" ? "Legenda Kepadatan" : mapMode === "rasio" ? "Legenda Rasio Kelamin" : "Legenda Tema"}
          </div>
          <div className="text-xs space-y-2">
            {mapMode === "kepadatan" && [
              { color: "#1e3a8a", label: "> 10.000" },
              { color: "#1d4ed8", label: "7.000 – 10.000" },
              { color: "#3b82f6", label: "4.000 – 7.000" },
              { color: "#60a5fa", label: "2.000 – 4.000" },
              { color: "#93c5fd", label: "> 0" },
              { color: "#e5e7eb", label: "Tidak ada data" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3"><span className="w-4 h-4 rounded shrink-0" style={{ background: color }}/><span className="text-gray-600 font-medium">{label}</span></div>
            ))}
            {mapMode === "rasio" && [
              { color: "#1e3a8a", label: ">105 Dominan L" },
              { color: "#3b82f6", label: "102–105 Lebih L" },
              { color: "#9ca3af", label: "98–102 Seimbang" },
              { color: "#ec4899", label: "95–98 Lebih P" },
              { color: "#be185d", label: "<95 Dominan P" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3"><span className="w-4 h-4 rounded shrink-0" style={{ background: color }}/><span className="text-gray-600 font-medium">{label}</span></div>
            ))}
            {mapMode === "tematik" && [
              { color: "#fbbf24", label: "Desa Tematik" },
              { color: "#e5e7eb", label: "Desa Lainnya" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-3"><span className="w-4 h-4 rounded shrink-0" style={{ background: color }}/><span className="text-gray-600 font-medium">{label}</span></div>
            ))}
          </div>
        </div>

        {/* Demografi Sidoarjo Summary */}
        {sidoarjoAgregat && (
          <div className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-3">Demografi Sidoarjo</p>
            <div className="bg-blue-50 rounded-xl px-4 py-3 mb-3">
              <div className="text-[10px] text-blue-500 font-bold uppercase">Total Populasi</div>
              <div className="font-extrabold text-xl text-blue-800 leading-tight">
                {sidoarjoAgregat.total.toLocaleString("id-ID")}
                <span className="text-sm font-semibold ml-1 text-blue-600">Jiwa</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-sky-50 rounded-xl px-3 py-2">
                <div className="text-[10px] text-sky-500 font-bold">Laki-laki</div>
                <div className="font-bold text-sm text-sky-800">{sidoarjoAgregat.L.toLocaleString("id-ID")}</div>
              </div>
              <div className="bg-pink-50 rounded-xl px-3 py-2">
                <div className="text-[10px] text-pink-500 font-bold">Perempuan</div>
                <div className="font-bold text-sm text-pink-800">{sidoarjoAgregat.P.toLocaleString("id-ID")}</div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Total KK</div>
              <div className="font-bold text-sm text-gray-700">{sidoarjoAgregat.kk.toLocaleString("id-ID")}</div>
            </div>
          </div>
        )}
      </RightSidebar>
    </div>
  );
};

export default BerandaSidoarjo;
