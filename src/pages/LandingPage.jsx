import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Auto Zoom to fit Sidoarjo or selected Kecamatan
const MapController = ({ geojsonData, selectedKecamatan, geoJsonRef }) => {
  const map = useMap();
  
  // Initial zoom to fit Sidoarjo
  useEffect(() => {
    if (geojsonData && map && !selectedKecamatan) {
      const tempLayer = L.geoJSON(geojsonData);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [5, 5] });
      }
    }
  }, [geojsonData, map]);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedKecamatan, setSelectedKecamatan] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const searchRef = useRef(null);
  const geoJsonRef = useRef(null);
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
  
  // Top 5 Kecamatan
  const top5Kecamatan = [...statsData]
    .sort((a, b) => b.jumlah_penduduk - a.jumlah_penduduk)
    .slice(0, 5);
  const maxPop = top5Kecamatan.length > 0 ? top5Kecamatan[0].jumlah_penduduk : 1;

  // Choropleth color scale (Light Blue to Dark Blue) based on density
  const getColor = (density) => {
    return density > 7000 ? '#08306b' :
           density > 5000 ? '#08519c' :
           density > 3500 ? '#2171b5' :
           density > 2500 ? '#4292c6' :
           density > 1500 ? '#6baed6' :
           density > 1000 ? '#9ecae1' :
           density > 500  ? '#c6dbef' :
                            '#deebf7';
  };

  const getStyle = (feature) => {
    const stats = getDistrictStats(feature.properties.KECAMATAN);
    const density = stats ? stats.kepadatan_penduduk : 0;
    const isSelected = selectedKecamatan === feature.properties.KECAMATAN;
    
    return {
      fillColor: getColor(density),
      weight: isSelected ? 5 : 1,
      opacity: 1,
      color: isSelected ? "#ffffff" : "white", // Thick white highlight if selected
      dashArray: isSelected ? "" : "3",
      fillOpacity: isSelected ? 1 : 0.8,
    };
  };

  const getHoverStyle = (feature) => {
    const stats = getDistrictStats(feature.properties.KECAMATAN);
    const density = stats ? stats.kepadatan_penduduk : 0;
    const isSelected = selectedKecamatan === feature.properties.KECAMATAN;
    
    return {
      fillColor: getColor(density),
      weight: isSelected ? 5 : 3,
      opacity: 1,
      color: isSelected ? "#ffffff" : "#666", // White highlight if selected, otherwise grey hover
      dashArray: "",
      fillOpacity: 1,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const stats = getDistrictStats(props.KECAMATAN);
    
    if (stats) {
      const tooltipContent = `
        <div style="font-family: 'Inter', sans-serif; text-align: center; padding: 4px;">
          <div style="font-weight: bold; font-size: 14px;">${props.KECAMATAN}</div>
          <div style="font-size: 11px; color: #666; margin-bottom: 6px;">Kecamatan</div>
          <div style="font-size: 11px; text-align: left;">
            <p style="margin: 2px 0;"><strong>Penduduk:</strong> ${stats.jumlah_penduduk.toLocaleString('id-ID')} jiwa</p>
            <p style="margin: 2px 0;"><strong>Kepadatan:</strong> ${Math.round(stats.kepadatan_penduduk).toLocaleString('id-ID')} jiwa/km²</p>
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
          l.setStyle(getHoverStyle(feature));
          if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            l.bringToFront();
          }
        },
        mouseout: (e) => {
          const l = e.target;
          l.setStyle(getStyle(feature));
        },
        click: () => {
          setSelectedKecamatan(props.KECAMATAN);
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

        {/* Action Buttons */}
        <div className="w-full sm:w-auto flex gap-3 justify-end order-1 sm:order-2">
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
      <div className="text-center z-10 mb-4 md:mb-6 mt-2 flex flex-col items-center px-4">
        <div className="animate-float">
          <p className="text-[#2563eb] font-bold tracking-[0.3em] uppercase text-xs md:text-sm mb-2 typewriter-text">
            Jelajahi
          </p>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-2 tracking-tight leading-none animate-color-shift cursor-default">
          Peta Statistik Kabupaten Sidoarjo
        </h1>
        <p className="italic text-xs sm:text-sm md:text-base font-medium m-0" style={{ color: "black", opacity: 1 }}>
          Kepadatan Penduduk Sidoarjo (jiwa/km²)
        </p>
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
                attribution="Tiles &copy; Esri &mdash; Source: Esri"
                maxZoom={17}
              />
              <ZoomControl position="bottomright" />
              <MapController 
                geojsonData={geojsonData} 
                selectedKecamatan={selectedKecamatan} 
                geoJsonRef={geoJsonRef} 
              />
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

          {/* Interactive Bottom-Left Panel */}
          <div className="absolute top-6 bottom-6 left-6 z-[1000] flex items-end gap-4 pointer-events-none">
            {/* Toggle Button */}
            <button 
              onClick={() => setIsPanelOpen(!isPanelOpen)}
              className="bg-white/95 backdrop-blur-md text-gray-800 w-12 h-12 flex items-center justify-center shadow-xl rounded-2xl transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95 z-20 shrink-0 pointer-events-auto"
              title={isPanelOpen ? "Tutup Info Statistik" : "Buka Info Statistik"}
            >
              {isPanelOpen ? (
                // Double Left Arrow (Close)
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="13 17 8 12 13 7"></polyline>
                  <polyline points="18 17 13 12 18 7"></polyline>
                </svg>
              ) : (
                // Legend / List Icon (Open)
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="4" height="4" rx="1"></rect>
                  <circle cx="5" cy="12" r="2"></circle>
                  <path d="M3 18l2-2 2 2z"></path>
                  <line x1="10" y1="6" x2="21" y2="6"></line>
                  <line x1="10" y1="12" x2="21" y2="12"></line>
                  <line x1="10" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>

            {/* Panel Content (Slides out to the right) */}
            <div 
              className={`bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col h-full pointer-events-auto ${
                isPanelOpen ? "w-[320px] opacity-100 translate-x-0" : "w-0 opacity-0 -translate-x-10 pointer-events-none"
              }`}
            >
              <div className="p-5 w-[320px] h-full flex flex-col justify-between">
                {/* Header */}
                <div>
                  <h3 className="font-bold text-lg text-gray-800">Statistik Sidoarjo</h3>
                  <p className="text-xs text-gray-500">Ringkasan agregat wilayah</p>
                </div>

                {/* General Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <div className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-1">Total Penduduk</div>
                    <div className="font-extrabold text-gray-800 text-lg leading-none">{totalPenduduk.toLocaleString('id-ID')}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Jiwa</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <div className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-1">Kepadatan Rata²</div>
                    <div className="font-extrabold text-gray-800 text-lg leading-none">{Math.round(avgKepadatan).toLocaleString('id-ID')}</div>
                    <div className="text-[10px] text-gray-500 mt-1">Jiwa/km²</div>
                  </div>
                </div>

                {/* Bar Chart - Top 5 Kecamatan */}
                <div>
                  <h4 className="font-bold text-xs text-gray-700 mb-3 border-b pb-1">Top 5 Penduduk Terbanyak</h4>
                  <div className="flex flex-col gap-3">
                    {top5Kecamatan.map((kec, idx) => {
                      const widthPercent = (kec.jumlah_penduduk / maxPop) * 100;
                      return (
                        <div key={idx} className="relative">
                          <div className="flex justify-between text-[10px] mb-1 font-medium">
                            <span className="text-gray-700">{kec.kecamatan}</span>
                            <span className="text-gray-900 font-bold">{kec.jumlah_penduduk.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
                              style={{ width: `${widthPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend (Original) */}
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="font-bold text-xs text-gray-700 mb-2">Legenda Kepadatan (jiwa/km²)</h4>
                  <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-[10px] text-gray-600 font-medium">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#08306b]"></span> &gt; 7000</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#08519c]"></span> 5000 - 7000</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#2171b5]"></span> 3500 - 5000</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#4292c6]"></span> 2500 - 3500</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#6baed6]"></span> 1500 - 2500</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#9ecae1]"></span> 1000 - 1500</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#c6dbef]"></span> 500 - 1000</div>
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm inline-block shadow-sm bg-[#deebf7]"></span> &lt; 500</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
