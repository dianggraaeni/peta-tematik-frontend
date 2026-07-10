import React, { useState, useEffect, useRef } from "react";
import { MapContainer, GeoJSON, useMap } from "react-leaflet";
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
        map.fitBounds(bounds, { padding: [20, 20] });
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
    <div className="w-full min-h-screen bg-[#e0f2fe] flex flex-col items-center pt-10 relative">
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
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          color: #374151 !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>

      {/* Header Info */}
      <div className="text-center z-10 mb-6 mt-2">
        <p className="text-[#2563eb] font-bold tracking-[0.3em] uppercase text-sm mb-3">
          Jelajahi
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          Peta Tematik Desa Kabupaten Sidoarjo
        </h1>
        <p className="italic text-sm md:text-base font-medium" style={{ color: "black", opacity: 1 }}>
          Arahkan kursor ke wilayah untuk melihat informasi singkat
        </p>
      </div>

      <div className="w-full flex-grow relative pb-10 px-4 md:px-12" style={{ height: "75vh" }}>
        
        {/* Search Bar Overlay - Top Left within the map container */}
        <div ref={searchRef} className="absolute top-4 left-4 md:left-12 z-[1000] w-64 md:w-80">
          <div className="relative">
            <input
              type="text"
              placeholder="Cari desa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              className="w-full px-4 py-3 pl-10 bg-white rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-800 placeholder-gray-400"
            />
            <svg
              className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
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
                    <div className="font-semibold text-gray-800">{result.DESA}</div>
                    <div className="text-xs text-gray-500">Kecamatan {result.KECAMATAN}</div>
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

        {geojsonData ? (
          <MapContainer
            center={[-7.45, 112.7]}
            zoom={11}
            minZoom={10}
            maxZoom={14}
            maxBounds={[[-7.7, 112.4], [-7.2, 113.0]]}
            maxBoundsViscosity={1.0}
            style={{ height: "100%", width: "100%", background: "transparent" }}
            zoomControl={true}
            dragging={true}
            scrollWheelZoom={true}
            doubleClickZoom={true}
          >
            <AutoZoom geojsonData={geojsonData} />
            <GeoJSON
              data={geojsonData}
              style={getStyle}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="animate-pulse text-gray-500 font-semibold">Memuat peta...</div>
          </div>
        )}
      </div>

      {/* Login Button Absolute Top Right */}
      <button 
        onClick={() => navigate('/login')}
        className="absolute top-6 right-8 px-6 py-2 bg-white text-gray-800 rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-lg border border-gray-200"
      >
        Masuk Admin
      </button>
    </div>
  );
};

export default BerandaSidoarjo;
