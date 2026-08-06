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

    
    // Prioritaskan Detail Desa jika desa ini adalah Desa Tematik
    const isTematik = desaTematikInfo[desaName.toUpperCase()] || desaTematikInfo[normalizedName];
    
    if (isTematik) {
      if (normalizedName === "SIMOANGINANGIN") {
        navigate("/detail-simoanginangin");
      } else if (normalizedName === "SIMOKETAWANG") {
        navigate("/detail-simoketawang");
      } else if (normalizedName === "WAUNG") {
        navigate("/detail-waung");
      } else {
        // Fallback untuk desa tematik lain (misal Sidokepung, Grogol)
        navigate(`/detail?desa=${encodeURIComponent(desaName)}`);
      }
      return;
    }

    // Jika tidak ada di keduanya
    navigate(`/detail?desa=${encodeURIComponent(desaName)}`);
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
      color: isSelected ? (mapMode === "tematik" ? "#FFD700" : "#ffffff") : "#475569", // Gold for tematik selected, else white
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
      color: isSelected ? (mapMode === "tematik" ? "#FFD700" : "#ffffff") : "#1e293b",
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
    const map = useMap();
    useMapEvents({
      click: () => {
        if (!isFeatureClicked.current) {
          setSelectedDesa(null);
          setSelectedDesaId(null);
        }
      },
      dragstart: () => {
        // Close all open tooltips when user starts dragging the map
        if (geoJsonRef.current) {
          geoJsonRef.current.eachLayer((layer) => {
            layer.closeTooltip();
          });
        }
        map.closeTooltip();
      },
    });
    return null;
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const rawName = props.DESA || props.nmdesa || props.KECAMATAN || "";
    const desaName = rawName.toUpperCase();
    let displayName = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
    
    if (displayName && !displayName.toLowerCase().startsWith("desa ") && !displayName.toLowerCase().startsWith("kelurahan ")) {
      displayName = "Desa " + displayName;
    }
    
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
        l.openTooltip();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getStyleRef.current(feature));
        l.closeTooltip();
      },
      click: (e) => {
        isFeatureClicked.current = true;
        const nmkec = props.KECAMATAN || props.nmkec || "";
        if (selectedDesaRef.current === desaName) {
          handleNavigateDetail(desaName, nmkec);
        } else {
          setSelectedDesa(desaName);
          setSelectedDesaId(iddesa);
          setSelectedKecamatan(nmkec);
        }
        setTimeout(() => { isFeatureClicked.current = false; }, 50);
      },
    });
  };

  return (
    <div className="w-screen h-screen relative overflow-hidden bg-gray-200">
      <style>{`
        .beranda-tooltip {
          background: white !important;
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .beranda-tooltip::before {
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

      {/* ── FULLSCREEN MAP ── */}
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

      {/* ── TOP BAR OVERLAY (Google Maps style) ── */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex items-start gap-2 pointer-events-none">
      
        {/* INFO PANEL TOGGLE BUTTON */}
        <button
          onClick={() => setShowInfoPanel(!showInfoPanel)}
          className={`shrink-0 pointer-events-auto w-11 h-11 rounded-2xl shadow-md flex items-center justify-center transition-all ${
            showInfoPanel ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"
          }`}
          title="Informasi Peta"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Logo card */}
        <div className="hidden md:flex bg-white rounded-2xl shadow-md px-3 py-2.5 items-center gap-2 shrink-0 pointer-events-auto">
          <img src="/pict/petis-darjo.png" alt="Sidoarjo" className="h-7 object-contain" />
          <div className="w-px h-5 bg-gray-200 shrink-0" />
          <img src="/pict/des-can.png" alt="Desa Cantik" className="h-7 object-contain" />
        </div>

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

        {/* Help */}
        <button
          onClick={() => navigate("/bantuan")}
          className="bg-white rounded-full shadow-md w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 shrink-0 pointer-events-auto transition-colors"
          title="Panduan Penggunaan"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>

        {/* Login */}
        <button
          onClick={() => navigate("/login")}
          className="hidden sm:flex bg-white rounded-2xl shadow-md px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 items-center shrink-0 pointer-events-auto transition-colors"
        >
          Masuk
        </button>
      </div>

      {/* ── INFO + LEGEND PANEL (left side) ── */}
      {showInfoPanel && (
        <div
          className="absolute top-[4.5rem] left-3 z-[999] w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl panel-scroll overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 6rem)" }}
        >
          {/* Demographics */}
          {sidoarjoAgregat && (
            <div className="p-4 border-b border-gray-50">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Demografi Sidoarjo</p>
              <div className="bg-blue-50 rounded-xl px-3 py-2.5 mb-2">
                <div className="text-[10px] text-blue-500 font-bold uppercase">Total Populasi</div>
                <div className="font-extrabold text-lg text-blue-800 leading-tight">
                  {sidoarjoAgregat.total.toLocaleString("id-ID")}
                  <span className="text-sm font-semibold ml-1 text-blue-600">Jiwa</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
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

          {/* Legend */}
          <div className="p-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              {mapMode === "kepadatan" ? "Kepadatan (Jiwa/km²)" : mapMode === "rasio" ? "Rasio Jenis Kelamin" : "Legenda Tema"}
            </p>
            {mapMode === "kepadatan" && (
              <div className="flex flex-col gap-2">
                {[
                  { color: "#1e3a8a", label: "> 10.000" },
                  { color: "#1d4ed8", label: "7.000 – 10.000" },
                  { color: "#3b82f6", label: "4.000 – 7.000" },
                  { color: "#60a5fa", label: "2.000 – 4.000" },
                  { color: "#93c5fd", label: "> 0" },
                  { color: "#e5e7eb", label: "Tidak ada data" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            )}
            {mapMode === "rasio" && (
              <div className="flex flex-col gap-2">
                {[
                  { color: "#1e3a8a", label: ">105 Dominan L" },
                  { color: "#3b82f6", label: "102–105 Lebih L" },
                  { color: "#9ca3af", label: "98–102 Seimbang" },
                  { color: "#ec4899", label: "95–98 Lebih P" },
                  { color: "#be185d", label: "<95 Dominan P" },
                ].map(({ color, label }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded shrink-0" style={{ background: color }} />
                    <span className="text-xs text-gray-600">{label}</span>
                  </div>
                ))}
              </div>
            )}
            {mapMode === "tematik" && (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded shrink-0 bg-amber-400" />
                  <span className="text-xs text-gray-600">Desa Tematik</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded shrink-0 bg-gray-200" />
                  <span className="text-xs text-gray-600">Desa Lainnya</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SELECTED DESA CARD (Google Maps style — bottom left) ── */}
      <div
        className={`absolute bottom-6 left-3 z-[1000] w-72 transition-all duration-300 ease-out ${
          selectedDesa ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
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
            {/* Tematik badges */}
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

          {/* Population stats */}
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

          {/* CTA button */}
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

      {/* ── AI INSIGHT BOX ── */}
      <AIInsightBox
        desaName={selectedDesa || "SIDOARJO"}
        featureName={selectedDesa ? `Desa ${selectedDesa}` : "Kabupaten Sidoarjo"}
        contextType="demografi"
        requireClick={true}
        customClass="bottom-6 right-16"
        data={sidoarjoAgregat}
      />

      {/* ── BACK TO PETA STATISTIK ── */}
      <button
        onClick={() => navigate("/")}
        className="absolute bottom-6 right-4 z-[1000] bg-white rounded-full shadow-md w-11 h-11 flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
        title="Kembali ke Peta Statistik"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </button>
    </div>
  );
};


export default BerandaSidoarjo;
