import { useState, useEffect, useRef, memo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import BeatLoader from "react-spinners/BeatLoader";
import CountUp from "react-countup";
import CustomMapControls from "../CustomMapControls";
import UmkmCharts from "./UmkmCharts";
import AIInsightBox from "../AIInsightBox";
import RightSidebar from "../RightSidebar";
import api6 from "../../utils/api6";
import { useNavigate } from "react-router-dom";

// Get KBLI Category Name
const getKbliName = (kbli) => {
  const mapping = {
    "A": "Pertanian, Kehutanan & Perikanan",
    "C": "Industri Pengolahan / Kerajinan",
    "G": "Perdagangan Eceran & Grosir",
    "I": "Penyediaan Akomodasi & Kuliner",
    "S": "Jasa Lainnya (Salon, Bengkel, dll)",
  };
  return mapping[kbli] || "Kategori Lainnya";
};

// Dominant KBLI extraction
const getDominantKbli = (item) => {
  const counts = {
    A: item.jml_umkm_kbli_a || 0,
    C: item.jml_umkm_kbli_c || 0,
    G: item.jml_umkm_kbli_g || 0,
    I: item.jml_umkm_kbli_i || 0,
    S: item.jml_umkm_kbli_s || 0,
  };
  let maxKbli = "Lainnya";
  let maxVal = 0;
  Object.entries(counts).forEach(([k, v]) => {
    if (v > maxVal) {
      maxVal = v;
      maxKbli = k;
    }
  });
  return { kbli: maxKbli, count: maxVal };
};

const kbliColors = {
  A: "#10b981", // Emerald green
  C: "#f59e0b", // Amber
  G: "#3b82f6", // Blue
  I: "#ef4444", // Red
  S: "#8b5cf6", // Purple
};

const AutoZoom = ({ geojsonData }) => {
  const map = useMap();
  useEffect(() => {
    if (geojsonData && geojsonData.features && geojsonData.features.length > 0) {
      try {
        const bounds = L.geoJSON(geojsonData).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      } catch (e) {
        console.error("AutoZoom error:", e);
      }
    }
  }, [geojsonData, map]);
  return null;
};

const Dashboard = ({ desaName: propsDesaName, hideCards }) => {
  const navigate = useNavigate();
  const [desaName] = useState(propsDesaName || "SIMOANGINANGIN");
  const [geojsonData, setGeojsonData] = useState(null);
  const [allRawData, setAllRawData] = useState([]);
  const [allOriginalData, setAllOriginalData] = useState([]);
  const [selectedArea, setSelectedArea] = useState({ rt: "", rw: "" });
  const [selectedAreaTitle, setSelectedAreaTitle] = useState(`Desa ${desaName}`);
  
  const [activeBasemap, setActiveBasemap] = useState({
    name: "Satelit",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
  });

  const [isFilterMinimized, setIsFilterMinimized] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const geoJsonRef = useRef(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Fetch geojson and raw UMKM data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const villageFormatted = desaName.charAt(0).toUpperCase() + desaName.slice(1).toLowerCase();
        
        // 1. Fetch GeoJSON from new endpoint
        const geoRes = await api6.get(`/api/upload-data/geojson-desa?nmdesa=${villageFormatted}`);
        const rawGeojson = geoRes.data;
        
        // 2. Fetch all raw data from database
        const umkmRes = await api6.get(`/api/umkm?nmdesa=${villageFormatted}`);
        
        setAllRawData(umkmRes.data || []);
        setAllOriginalData(umkmRes.data || []);
        
        setGeojsonData(rawGeojson);
      } catch (err) {
        console.error("Error fetching UMKM data:", err);
      }
    };
    fetchData();
  }, [desaName]);

  // Aggregate stats
  const processedData = (() => {
    let list = allRawData;
    const totalUmkm = list.reduce((sum, item) => sum + (item.jml_umkm || 0), 0);
    
    // Find dominant KBLI Category overall
    const kbliTotals = { A: 0, C: 0, G: 0, I: 0, S: 0 };
    list.forEach(item => {
      kbliTotals.A += item.kbli_a || 0;
      kbliTotals.C += item.kbli_c || 0;
      kbliTotals.G += item.kbli_g || 0;
      kbliTotals.I += item.kbli_i || 0;
      kbliTotals.S += item.kbli_s || 0;
    });
    
    let dominantKbli = "None";
    let max = -1;
    Object.entries(kbliTotals).forEach(([k, v]) => {
      if (v > max) {
        max = v;
        dominantKbli = k;
      }
    });

    return {
      totalPenduduk: totalUmkm, // Used in CountUp
      totalUmkm,
      dominantKbli
    };
  })();

  const getMapStyle = (properties) => {
    if (properties.marker_type === "UMKM") return {};
    const rt = properties.RT || properties.rt;
    const rw = properties.RW || properties.rw;
    const match = allRawData.find(item => item.rt === String(rt) && item.rw === String(rw));
    
    if (!match || (match.jml_umkm || 0) === 0) {
      return { fillColor: "#cbd5e1", fillOpacity: 0.2, color: "#94a3b8", weight: 1.5 };
    }
    const dom = getDominantKbli(match);
    const color = kbliColors[dom.kbli] || "#94a3b8";
    
    const isSelected = selectedArea.rt === String(rt) && selectedArea.rw === String(rw);
    return {
      fillColor: color,
      fillOpacity: isSelected ? 0.85 : 0.6,
      color: isSelected ? "#ffffff" : color,
      weight: isSelected ? 3 : 1.5,
    };
  };

  const onEachFeature = (feature, layer) => {
    const props = feature.properties;
    
    if (props.marker_type === "UMKM") {
      let kbliClean = props.kategori_kbli || "Lainnya";
      if (kbliClean.includes('_')) kbliClean = kbliClean.split('_')[1].toUpperCase();
      
      const popupContent = `
        <div style="font-family: 'Inter', sans-serif; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-weight: 700; color: #1e293b;">${props.nama_usaha || 'UMKM'}</h4>
          <p style="margin: 0 0 2px 0; font-size: 11px; color: #475569;">${props.alamat || '-'}</p>
          <p style="margin: 0 0 2px 0; font-size: 11px; color: #2563eb;">KBLI: <strong>${kbliClean} (${getKbliName(kbliClean)})</strong></p>
          <p style="margin: 0; font-size: 11px; color: #64748b;">Kegiatan: ${props.kegiatan_utama_usaha || '-'}</p>
        </div>
      `;
      layer.bindPopup(popupContent, { offset: L.point(0, -5) });
      return;
    }

    const rt = props.RT || props.rt;
    const rw = props.RW || props.rw;
    const match = allRawData.find(item => item.rt === String(rt) && item.rw === String(rw));
    
    let popupContent = `<div style="font-family: 'Inter', sans-serif; padding: 4px;">
      <h4 style="margin: 0 0 6px 0; font-weight: 700; color: #1e293b; border-bottom: 1px solid #e2e8f0; pb: 4px;">RT ${rt} / RW ${rw}</h4>`;
    
    if (match && match.jml_umkm > 0) {
      const dom = getDominantKbli(match);
      popupContent += `
        <p style="margin: 0 0 4px 0; font-size: 11px; color: #475569;">Total UMKM: <strong style="color: #2563eb;">${match.jml_umkm}</strong></p>
        <p style="margin: 0; font-size: 10px; color: #64748b;">Dominan KBLI: <strong>${dom.kbli} (${getKbliName(dom.kbli)})</strong></p>
      `;
    } else {
      popupContent += `<p style="margin: 0; font-size: 11px; color: #94a3b8; italic;">Tidak ada data UMKM</p>`;
    }
    popupContent += `</div>`;

    layer.bindPopup(popupContent, { closeButton: false, offset: L.point(0, -10) });

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ weight: 3, color: "#ffffff", fillOpacity: 0.8 });
        l.openPopup();
      },
      mouseout: (e) => {
        const l = e.target;
        if (geoJsonRef.current) {
          geoJsonRef.current.resetStyle(l);
        }
        l.closePopup();
      },
      click: (e) => {
        setSelectedArea({ rt: String(rt), rw: String(rw) });
        setSelectedAreaTitle(`RT ${rt} / RW ${rw}`);
        if (match) {
          setAllRawData([match]);
        } else {
          setAllRawData([]);
        }
      }
    });
  };

  const handleReset = () => {
    setSelectedArea({ rt: "", rw: "" });
    setSelectedAreaTitle(`Desa ${desaName}`);
    setAllRawData(allOriginalData);
    if (geoJsonRef.current) {
      geoJsonRef.current.resetStyle();
    }
  };

  const enrichedGeojsonData = (() => {
    if (!geojsonData || !geojsonData.features) return null;
    const features = geojsonData.features.map(f => {
      const rt = f.properties.RT || f.properties.rt;
      const rw = f.properties.RW || f.properties.rw;
      const match = allOriginalData.find(item => item.rt === String(rt) && item.rw === String(rw));
      const dom = match ? getDominantKbli(match) : { kbli: "None", count: 0 };
      return {
        ...f,
        properties: {
          ...f.properties,
          totalUmkm: match ? match.jml_umkm : 0,
          dominantKbli: dom.kbli
        }
      };
    });
    return { ...geojsonData, features };
  })();

  return (
    <div className="flex w-full h-full overflow-hidden relative font-sans">
      <style jsx global>{`
        .leaflet-interactive:focus,
        .leaflet-clickable,
        .leaflet-zoom-animated .leaflet-interactive {
          outline: none !important;
          border: none !important;
        }
      `}</style>

      {/* MAIN MAP AREA */}
      <div className="flex-grow relative h-full">
        {/* ── TOP BAR OVERLAY REMOVED, BUT KEEPING BACK BUTTON IF NEEDED ── */}
        <div className="absolute top-3 left-3 z-[1000] flex items-start gap-2 pointer-events-none">
          <button
            onClick={() => navigate('/peta-tematik')}
            className="shrink-0 pointer-events-auto w-11 h-11 bg-white rounded-2xl shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
            title="Kembali"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          {/* Title Card */}
          <div className="bg-white rounded-2xl shadow-md px-4 py-2.5 flex flex-col justify-center shrink-0 pointer-events-auto">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Desa</div>
            <div className="font-extrabold text-sm text-gray-800 leading-none">{desaName}</div>
          </div>
        </div>

        {geojsonData ? (
          <MapContainer
            center={[-7.379, 112.73]}
            zoom={13}
            minZoom={12}
            maxZoom={24}
            zoomSnap={0.5}
            zoomDelta={0.5}
            maxBounds={[[-8.0, 112.0], [-7.0, 113.5]]}
            maxBoundsViscosity={1.0}
            className="w-full h-full absolute inset-0 z-0"
            doubleClickZoom={true}
            zoomControl={false}
            scrollWheelZoom={true}
          >
            <TileLayer url={activeBasemap.url} attribution={activeBasemap.attribution} maxNativeZoom={activeBasemap.maxZoom || 19} maxZoom={24} />
            <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} onLayerOpenChange={setIsLayerOpen} isDetail={true} />
            <AutoZoom geojsonData={geojsonData} />
            {enrichedGeojsonData && (
              <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={21} maxClusterRadius={40}>
                <GeoJSON
                  ref={geoJsonRef}
                  key={`geojson-${allOriginalData.length}`}
                  data={enrichedGeojsonData}
                  style={(feature) => getMapStyle(feature.properties)}
                  onEachFeature={onEachFeature}
                  pointToLayer={(feature, latlng) => {
                    if (feature.properties.marker_type === "UMKM") {
                      let kbli = feature.properties.kategori_kbli || "";
                      if (kbli.includes('_')) kbli = kbli.split('_')[1].toUpperCase();
                      const color = kbliColors[kbli] || "#3b82f6";
                      
                      const customIcon = L.divIcon({
                        className: 'custom-umkm-marker',
                        html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                        iconSize: [16, 16],
                        iconAnchor: [8, 8]
                      });
                      return L.marker(latlng, { icon: customIcon });
                    }
                    return L.marker(latlng);
                  }}
                />
              </MarkerClusterGroup>
            )}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gray-100 absolute inset-0 z-0">
            <BeatLoader color="#4A90E2" size={10} />
          </div>
        )}

      </div>

      {/* RIGHT SIDEBAR */}
      {!hideCards && (
        <RightSidebar
          desaName={desaName}
          themeName="PETA UMKM"
        >
          {/* CONTENT THAT WAS IN LEFT PANEL */}
          <div className="flex flex-col gap-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-blue-600 text-white px-3 py-2 flex justify-between items-center">
                <h2 className="font-medium text-sm truncate">{selectedAreaTitle}</h2>
              </div>
              <div className="p-3">
                <div className="flex gap-2 mb-3">
                  <button onClick={handleReset} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 rounded text-xs font-semibold transition-colors shadow-sm">
                    Reset
                  </button>
                </div>
                <h2 className="text-xs font-bold text-gray-800 text-center mb-2 pb-1 border-b border-blue-100">Data UMKM</h2>
                <div className="bg-blue-50 rounded-lg p-2 mb-3 border border-blue-100">
                  <p className="text-xs text-gray-500 font-medium text-center">Total UMKM</p>
                  <p className="text-2xl font-extrabold text-blue-600 text-center my-0">
                    <CountUp end={processedData?.totalPenduduk || 0} duration={2} separator="." />
                  </p>
                  {selectedArea.rt && selectedArea.rw && (
                    <p className="text-[10px] text-gray-400 text-center mt-1">RT {selectedArea.rt} / RW {selectedArea.rw}</p>
                  )}
                </div>
                <div className="w-full">
                  <UmkmCharts data={allRawData} />
                </div>
              </div>
            </div>
            {/* AI Insight */}
            {selectedArea.rt && (
              <AIInsightBox
                desaName={desaName}
                featureName={selectedAreaTitle}
                contextType="umkm"
                requireClick={true}
                inline={true}
                customClass="!static !w-full !mt-2"
                data={{ totalUmkm: processedData.totalUmkm, dominanKbli: getKbliName(processedData.dominantKbli) }}
              />
            )}
          </div>
        </RightSidebar>
      )}
    </div>
  );
};

export default memo(Dashboard);
