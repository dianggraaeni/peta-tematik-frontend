import React, { useState, useEffect } from "react";
import { MapContainer, GeoJSON, useMap, ZoomControl, TileLayer } from "react-leaflet";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@nextui-org/react";
import { FaMapMarkedAlt } from "react-icons/fa";

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

const LandingPage = () => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [statsData, setStatsData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch the boundaries GeoJSON from public folder
    fetch("/data/Administrasi_Desa.geojson")
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error("Error loading boundaries:", err));

    // Fetch statistical data
    fetch("/data/statistikSidoarjo.json")
      .then((res) => res.json())
      .then((data) => setStatsData(data))
      .catch((err) => console.error("Error loading stats:", err));
  }, []);

  // Helper function to get stats for a district
  const getDistrictStats = (kecamatanName) => {
    if (!kecamatanName || !statsData.length) return null;
    return statsData.find(
      (stat) => stat.kecamatan.toUpperCase() === kecamatanName.toUpperCase()
    );
  };

  // Choropleth color scale (Light Blue to Dark Blue) based on density
  // Max density in data is around 7400, min is around 740.
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
    return {
      fillColor: getColor(density),
      weight: 1,
      opacity: 1,
      color: "white",
      dashArray: "3",
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature, layer) => {
    const stats = getDistrictStats(feature.properties.KECAMATAN);
    if (stats) {
      const tooltipContent = `
        <div class="p-2 font-inter">
          <strong class="text-lg block border-b pb-1 mb-1">${feature.properties.KECAMATAN}</strong>
          <div class="text-sm">
            <p><strong>Penduduk:</strong> ${stats.jumlah_penduduk.toLocaleString('id-ID')} jiwa</p>
            <p><strong>Kepadatan:</strong> ${Math.round(stats.kepadatan_penduduk).toLocaleString('id-ID')} jiwa/km²</p>
            <p><strong>Luas Wilayah:</strong> ${stats.luas_wilayah} km²</p>
            <p><strong>Desa/Kelurahan:</strong> ${stats.jumlah_desa_dan_kelurahan}</p>
          </div>
        </div>
      `;
      layer.bindTooltip(tooltipContent, {
        sticky: true,
        className: "bg-white/90 backdrop-blur-sm border-none shadow-lg rounded-xl text-pdarkblue",
      });
      
      // Hover effects
      layer.on({
        mouseover: (e) => {
          const l = e.target;
          l.setStyle({
            weight: 3,
            color: "#666",
            dashArray: "",
            fillOpacity: 0.9,
          });
          l.bringToFront();
        },
        mouseout: (e) => {
          // Reset style
          const originalStyle = getStyle(feature);
          e.target.setStyle(originalStyle);
        },
      });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8fafc] flex flex-col font-inter">
      {/* Header Area */}
      <div className="w-full bg-white shadow-sm border-b px-8 py-6 flex flex-col md:flex-row items-center justify-between z-10 relative">
        <div className="flex items-center gap-4 mb-4 md:mb-0">
          <img src="/pict/logo_dc.png" alt="Logo Desa Cantik" className="w-16 h-16 object-contain" />
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937]">Statistik Kependudukan</h1>
            <p className="text-sm text-gray-500 font-semibold tracking-wide uppercase">BPS Kabupaten Sidoarjo</p>
          </div>
        </div>
        
        <Button
          color="primary"
          size="lg"
          radius="md"
          className="font-semibold shadow-md"
          endContent={<FaMapMarkedAlt className="ml-2" />}
          onClick={() => navigate('/peta-tematik')}
        >
          Menuju Peta Tematik Desa
        </Button>
      </div>

      {/* Map Area */}
      <div className="w-full flex-grow relative p-4 md:p-8">
        <div className="w-full h-full min-h-[600px] bg-gray-100 border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg relative z-0">
          {geojsonData ? (
            <MapContainer
              center={[-7.45, 112.7]}
              zoom={11}
              style={{ width: "100%", height: "100%" }}
              zoomControl={false}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          
          {/* Legend */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100">
            <h4 className="font-bold text-sm text-gray-700 mb-2">Kepadatan Penduduk</h4>
            <p className="text-xs text-gray-500 mb-3">(jiwa/km²)</p>
            <div className="flex flex-col gap-1 text-xs text-gray-600">
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#08306b]"></span> &gt; 7000</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#08519c]"></span> 5000 - 7000</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#2171b5]"></span> 3500 - 5000</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#4292c6]"></span> 2500 - 3500</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#6baed6]"></span> 1500 - 2500</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#9ecae1]"></span> 1000 - 1500</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#c6dbef]"></span> 500 - 1000</div>
              <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm inline-block bg-[#deebf7]"></span> &lt; 500</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
