import React, { useState, useEffect } from "react";
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
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the boundaries GeoJSON from public folder
    fetch("/data/Administrasi_Desa.geojson")
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error loading boundaries:", err));
  }, []);

  const getStyle = () => {
    return {
      fillColor: "#0052D4", // BPS Blue
      weight: 1,
      opacity: 1,
      color: "white",
      fillOpacity: 0.9,
    };
  };

  const getHoverStyle = () => {
    return {
      fillColor: "#1f2937", // Dark almost black
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
        // Navigate to the detail page with the selected village name
        navigate(`/detail?desa=${encodeURIComponent(desaName)}`);
      },
    });
  };

  return (
    <div className="w-full min-h-screen bg-white flex flex-col items-center pt-10 relative">
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
          display: none !important;
        }
        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>

      {/* Header Info like the reference */}
      <div className="text-center z-10 mb-6">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3 tracking-tight">
          Peta Ketenagakerjaan Sidoarjo
        </h1>
        <p className="text-gray-500 italic text-sm md:text-base">
          Arahkan kursor ke wilayah untuk melihat informasi singkat
        </p>
      </div>

      <div className="w-full max-w-6xl flex-grow relative pb-10" style={{ height: "75vh" }}>
        {geojsonData ? (
          <MapContainer
            center={[-7.45, 112.7]}
            zoom={11}
            style={{ height: "100%", width: "100%", background: "transparent" }}
            zoomControl={false}
            dragging={false}
            scrollWheelZoom={false}
            doubleClickZoom={false}
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
            <div className="animate-pulse text-gray-400">Memuat peta...</div>
          </div>
        )}
      </div>

      {/* Login Button Absolute Top Right */}
      <button 
        onClick={() => navigate('/login')}
        className="absolute top-6 right-8 px-6 py-2 bg-black text-white rounded-full font-semibold hover:bg-gray-800 transition-colors shadow-lg"
      >
        Masuk Admin
      </button>
    </div>
  );
};

export default BerandaSidoarjo;
