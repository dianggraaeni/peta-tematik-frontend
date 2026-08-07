import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer, LayersControl, useMapEvents } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import CustomMapControls, { useBasemap } from "../components/CustomMapControls";
import "leaflet/dist/leaflet.css";
import AIInsightBox from "../components/AIInsightBox";
import { fetchKabupatenData } from "../utils/openDataApi";

// Auto Zoom to fit Sidoarjo or selected Kecamatan
const MapController = ({ geojsonData, selectedKecamatan, geoJsonRef }) => {
  const map = useMap();
  
  useEffect(() => {
    if (geojsonData && map && !selectedKecamatan) {
      map.setView([-7.4478, 112.7183], 11);
    }
  }, [geojsonData, map, selectedKecamatan]);

  useEffect(() => {
    if (selectedKecamatan && geoJsonRef.current && map) {
      geoJsonRef.current.eachLayer((layer) => {
        if (layer.feature.properties.KECAMATAN === selectedKecamatan) {
          map.flyToBounds(layer.getBounds(), { padding: [50, 50], duration: 1.5 });
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
  const [apiKabupatenData, setApiKabupatenData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showDataKecamatan, setShowDataKecamatan] = useState(false);
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [mapMode, setMapMode] = useState("kepadatan");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const searchRef = useRef(null);
  const geoJsonRef = useRef(null);
  const selectedKecamatanRef = useRef(null);
  const isFeatureClicked = useRef(false);
  const navigate = useNavigate();

  const kecamatanWithDetail = {
    "TARIK": "tarik",
    "PRAMBON": "prambon",
    "KREMBUNG": "krembung",
    "PORONG": "porong",
    "JABON": "jabon",
    "TANGGULANGIN": "tanggulangin",
    "CANDI": "candi",
    "TULANGAN": "tulangan",
    "WONOAYU": "wonoayu",
    "SUKODONO": "sukodono",
    "SIDOARJO": "sidoarjo",
    "BUDURAN": "buduran",
    "SEDATI": "sedati",
    "WARU": "waru",
    "GEDANGAN": "gedangan",
    "TAMAN": "taman",
    "KRIAN": "krian",
    "BALONGBENDO": "balongbendo"
  };

  const handleNavigateKecamatan = (kecName) => {
    const slug = kecamatanWithDetail[kecName?.toUpperCase()];
    if (slug) {
      navigate(`/detail-kecamatan/${slug}`);
    }
  };

  useEffect(() => {
    fetch("/data/Administrasi_Kecamatan.geojson")
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error loading boundaries:", err));

    fetch("/data/statistikSidoarjo.json")
      .then((res) => res.json())
      .then((data) => setStatsData(data))
      .catch((err) => console.error("Error loading stats:", err));

    fetch("/data/penduduk.json")
      .then((res) => res.json())
      .then((data) => setPendudukData(data))
      .catch((err) => console.error("Error loading penduduk:", err));
      
    fetchKabupatenData().then(data => {
      if (data && data.length > 0) {
        setApiKabupatenData(data);
      }
    });
  }, []);

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
      .slice(0, 5);
    
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
    selectedKecamatanRef.current = kecamatanName;
    setSearchTerm(kecamatanName);
    setIsSearchFocused(false);
  };

  const getDistrictStats = (kecamatanName) => {
    if (!kecamatanName || !statsData.length) return null;
    const baseStat = statsData.find(
      (stat) => stat.kecamatan.toUpperCase() === kecamatanName.toUpperCase()
    );
    if (!baseStat) return null;

    if (apiKabupatenData) {
      const liveData = apiKabupatenData.find(d => d.kecamatan === baseStat.kecamatan.toUpperCase());
      if (liveData) {
        const liveJumlah = liveData.total;
        const kepadatan = baseStat.luas_wilayah > 0 ? liveJumlah / baseStat.luas_wilayah : 0;
        return {
          ...baseStat,
          jumlah_penduduk: liveJumlah,
          kepadatan_penduduk: kepadatan
        };
      }
    }
    return baseStat;
  };

  const totalLuas = statsData.reduce((sum, stat) => sum + stat.luas_wilayah, 0);
  const totalPenduduk = apiKabupatenData 
    ? apiKabupatenData.reduce((sum, d) => sum + d.total, 0)
    : statsData.reduce((sum, stat) => sum + stat.jumlah_penduduk, 0);
  const avgKepadatan = totalLuas > 0 ? (totalPenduduk / totalLuas) : 0;
  
  const sidoarjoAgregat = React.useMemo(() => {
    let L = 0, P = 0, total = 0, kk = 0;
    if (apiKabupatenData) {
      apiKabupatenData.forEach(d => {
        L += d.L;
        P += d.P;
        total += d.total;
        kk += Math.round(d.total / 3.8);
      });
    } else if (pendudukData) {
      Object.values(pendudukData).forEach((desa) => {
        L += desa.L;
        P += desa.P;
        total += desa.total_penduduk;
        kk += desa.total_kk || 0;
      });
    }
    return { L, P, total, kk };
  }, [apiKabupatenData, pendudukData]);

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
    if (!p) return "#bfdbfe";
    const rjk = (l / p) * 100;
    if (rjk > 105) return "#1e3a8a"; 
    if (rjk > 102) return "#3b82f6";
    if (rjk > 98) return "#9ca3af"; 
    if (rjk > 95) return "#ec4899"; 
    return "#be185d";
  };

  const kecamatanDemografi = React.useMemo(() => {
    const agg = {};
    if (apiKabupatenData) {
      apiKabupatenData.forEach(d => {
        agg[d.kecamatan] = { L: d.L, P: d.P, total: d.total };
      });
    } else if (pendudukData) {
      Object.values(pendudukData).forEach((desa) => {
        const kec = (desa.Kecamatan || "").toUpperCase();
        if (!agg[kec]) {
          agg[kec] = { L: 0, P: 0, total: 0 };
        }
        agg[kec].L += desa.L;
        agg[kec].P += desa.P;
        agg[kec].total += desa.total_penduduk;
      });
    }
    return agg;
  }, [apiKabupatenData, pendudukData]);

  const getStyle = (feature) => {
    const kecName = feature.properties.KECAMATAN.toUpperCase();
    const stats = getDistrictStats(kecName);
    const density = stats ? stats.kepadatan_penduduk : 0;
    const isSelected = selectedKecamatan === feature.properties.KECAMATAN;
    
    let fillColor = "#bfdbfe";
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
      color: isSelected ? "#ffffff" : "#475569", 
      dashArray: isSelected ? "" : "3",
      fillOpacity: isSelected ? 0.7 : 0.5, 
    };
  };

  const getHoverStyle = (feature) => {
    return {
      fillColor: "#facc15",
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
          <div style="font-weight: bold; font-size: 14px;">Kecamatan ${props.KECAMATAN}</div>
          <div style="font-size: 11px; text-align: left; margin-top: 6px;">
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
          if (selectedKecamatanRef.current === props.KECAMATAN && kecamatanWithDetail[props.KECAMATAN?.toUpperCase()]) {
            handleNavigateKecamatan(props.KECAMATAN);
          } else {
            setSelectedKecamatan(props.KECAMATAN);
            selectedKecamatanRef.current = props.KECAMATAN;
          }
          setTimeout(() => { isFeatureClicked.current = false; }, 50);
        }
      });
    }
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
              legendSlot={
                <div className={`transition-all duration-300 ${isLegendMinimized ? 'w-11 h-11 rounded-full' : 'w-48 rounded-2xl'} bg-white/95 backdrop-blur-md shadow-md border border-gray-100 overflow-hidden`}>
                  <div
                    className={`font-bold text-gray-800 ${isLegendMinimized ? 'h-full flex justify-center items-center cursor-pointer text-gray-700 hover:bg-gray-50' : 'px-4 py-3 border-b border-gray-100 text-xs flex justify-between items-center cursor-pointer hover:bg-gray-50'}`}
                    onClick={() => setIsLegendMinimized(!isLegendMinimized)}
                  >
                    {!isLegendMinimized && <span>{mapMode === "kepadatan" ? "Kepadatan" : "Rasio Kelamin"}</span>}
                    <button title={isLegendMinimized ? "Buka Legenda" : "Tutup Legenda"} className={isLegendMinimized ? "text-gray-700" : "text-gray-400"}>
                      {isLegendMinimized ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                      )}
                    </button>
                  </div>
                  {!isLegendMinimized && (
                    <div className="p-3 pt-2 text-[10px] space-y-1">
                      {mapMode === "kepadatan" && [
                        { color: "#1e3a8a", label: "> 7.000" },
                        { color: "#1d4ed8", label: "5.000 – 7.000" },
                        { color: "#2563eb", label: "3.500 – 5.000" },
                        { color: "#3b82f6", label: "2.500 – 3.500" },
                        { color: "#60a5fa", label: "1.500 – 2.500" },
                        { color: "#93c5fd", label: "1.000 – 1.500" },
                        { color: "#bfdbfe", label: "500 – 1.000" },
                        { color: "#dbeafe", label: "< 500" },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2"><span className="w-3 h-3 rounded shrink-0" style={{ background: color }}/><span className="text-gray-600">{label}</span></div>
                      ))}
                      {mapMode === "rasio" && [
                        { color: "#1e3a8a", label: ">105 Dominan L" },
                        { color: "#3b82f6", label: "102–105 Lebih L" },
                        { color: "#9ca3af", label: "98–102 Seimbang" },
                        { color: "#ec4899", label: "95–98 Lebih P" },
                        { color: "#be185d", label: "<95 Dominan P" },
                      ].map(({ color, label }) => (
                        <div key={label} className="flex items-center gap-2"><span className="w-3 h-3 rounded shrink-0" style={{ background: color }}/><span className="text-gray-600">{label}</span></div>
                      ))}
                    </div>
                  )}
                </div>
              }
            />
            <MapController geojsonData={geojsonData} selectedKecamatan={selectedKecamatan} geoJsonRef={geoJsonRef} />
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
              placeholder="Cari kecamatan..."
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
                onClick={() => { setSearchTerm(""); setSearchResults([]); setSelectedKecamatan(null); }}
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
                searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelectSearch(result.KECAMATAN)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0 flex items-center gap-3"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-gray-800">Kecamatan {result.KECAMATAN}</div>
                      <div className="text-xs text-gray-400">Kabupaten Sidoarjo</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-4 text-sm text-gray-400 text-center">
                  Kecamatan tidak ditemukan
                </div>
              )}
            </div>
          )}
        </div>

        {/* Map mode selector */}
        <div
          className={`relative bg-white rounded-2xl shadow-md shrink-0 pointer-events-auto flex items-center overflow-hidden ring-2 ${
            mapMode === "kepadatan" ? "ring-blue-500" : "ring-purple-500"
          }`}
        >
          <select
            value={mapMode}
            onChange={(e) => { e.stopPropagation(); setMapMode(e.target.value); }}
            className="pl-4 pr-9 py-3 text-sm font-semibold text-gray-700 bg-transparent outline-none appearance-none cursor-pointer"
            style={{ minWidth: "145px" }}
          >
            <option value="kepadatan">Kepadatan</option>
            <option value="rasio">Rasio L/P</option>
          </select>
          <div className="absolute right-3 pointer-events-none">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
        
        {/* Peta Tematik Button */}
        <button
          onClick={() => navigate("/peta-tematik")}
          className="hidden md:flex bg-[#2563eb] rounded-2xl shadow-md px-4 py-3 text-sm font-bold text-white hover:bg-[#1d4ed8] items-center shrink-0 pointer-events-auto transition-colors gap-2"
        >
          <span>Peta Tematik</span>
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7"></polyline>
              <polyline points="6 17 11 12 6 7"></polyline>
            </svg>
          </div>
        </button>

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
          Masuk Admin
        </button>
      </div>

      {/* ── INFO PANEL (left side – demografi only) ── */}
      {showInfoPanel && (
        <div
          className="absolute top-[4.5rem] left-3 z-[999] w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl panel-scroll overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 6rem)" }}
        >
          {sidoarjoAgregat && (
            <div className="p-4">
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
        </div>
      )}

      {/* ── SELECTED KECAMATAN CARD (Google Maps style — bottom left) ── */}
      <div
        className={`absolute bottom-6 left-3 z-[1000] w-72 transition-all duration-300 ease-out ${
          selectedKecamatan ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          {/* Header */}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-base text-gray-900 leading-tight">
                  Kecamatan {selectedKecamatan ? selectedKecamatan.charAt(0).toUpperCase() + selectedKecamatan.slice(1).toLowerCase() : ""}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">Kabupaten Sidoarjo</p>
              </div>
              <button
                onClick={() => setSelectedKecamatan(null)}
                className="w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 shrink-0 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>

          {/* Kecamatan Stats */}
          {selectedKecamatan && statsData && statsData.find(s => s.kecamatan.toUpperCase() === selectedKecamatan.toUpperCase()) && (() => {
            const stats = getDistrictStats(selectedKecamatan);
            if (!stats) return null;
            return (
              <div className="px-5 py-3 border-t border-gray-50 grid grid-cols-2 gap-3 text-center">
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-0.5">Penduduk</div>
                  <div className="font-bold text-sm text-gray-800">
                    {stats.jumlah_penduduk.toLocaleString("id-ID")}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-medium mb-0.5">Kepadatan</div>
                  <div className="font-bold text-sm text-gray-800">
                    {Math.round(stats.kepadatan_penduduk).toLocaleString("id-ID")}/km²
                  </div>
                </div>
              </div>
            );
          })()}

          {/* CTA button */}
          <div className="px-4 py-3 border-t border-gray-50">
            {selectedKecamatan && kecamatanWithDetail[selectedKecamatan?.toUpperCase()] ? (
              <button
                onClick={() => handleNavigateKecamatan(selectedKecamatan)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
                  <path d="M8 2v16M16 6v16" />
                </svg>
                Lihat Detail Kecamatan
              </button>
            ) : (
              <div className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl text-center text-sm font-medium">
                Data detail belum tersedia
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── AI INSIGHT BOX ── */}
      <AIInsightBox 
        featureName={selectedKecamatan} 
        data={selectedKecamatan && statsData ? statsData.find(s => (s.kecamatan || "").toUpperCase() === selectedKecamatan.toUpperCase()) : {}} 
        contextType="statistik_kecamatan" 
        requireClick={true}
        customClass="bottom-6 right-4" 
      />
    </div>
  );
};

export default LandingPage;
