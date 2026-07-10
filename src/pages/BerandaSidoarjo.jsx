import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl } from "react-leaflet";
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

const BerandaSidoarjo = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
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

  const getStyle = () => {
    return {
      fillColor: "#2563eb", // Tailwind blue-600
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.85,
    };
  };

  const getHoverStyle = () => {
    return {
      fillColor: "#1d4ed8", // Tailwind blue-700
      weight: 2,
      opacity: 1,
      color: "white",
      fillOpacity: 1,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    const desaName = props.DESA || props.KECAMATAN;

    const tooltipContent = `
      <div style="font-family: 'Inter', sans-serif; text-align: center; padding: 4px;">
        <div style="font-weight: bold; font-size: 14px;">${desaName}</div>
        <div style="font-size: 11px; color: #666;">Kecamatan ${props.KECAMATAN}</div>
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
        l.setStyle(getHoverStyle());
        l.bringToFront();
      },
      mouseout: (e) => {
        const l = e.target;
        l.setStyle(getStyle());
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
            className="w-full sm:w-auto px-6 py-2 bg-white rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg border border-gray-200 text-sm md:text-base"
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

      {/* Map Container */}
      <div className="w-full flex-grow relative pb-6 md:pb-10 px-4 md:px-12" style={{ height: "75vh", minHeight: "500px" }}>
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
            <ZoomControl position="bottomright" />
            <AutoZoom geojsonData={geojsonData} />
            <GeoJSON
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
