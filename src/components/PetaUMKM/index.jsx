import { useState, useEffect, memo, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import CustomMapControls, { useBasemap } from "../CustomMapControls";
import "leaflet/dist/leaflet.css";
import CountUp from "react-countup";
import { BeatLoader } from "react-spinners";
import UmkmCharts from "./UmkmCharts";
import FilterPanelUmkm from "./FilterPanelUmkm";
import AIInsightBox from "../AIInsightBox";
import L from "leaflet";

import api6 from "../../utils/api6.js";
import { message } from "antd";

// Auto Zoom
const AutoZoom = ({ geojsonData }) => {
  const map = useMap();

  useEffect(() => {
    if (geojsonData && map) {
      const tempLayer = L.geoJSON(geojsonData);
      const bounds = tempLayer.getBounds();

      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [20, 20],
          maxZoom: 16,
        });
      }
    }
  }, [geojsonData, map]);

  return null;
};

const Dashboard = ({ initialDesaName }) => {
  // === STATE ===
  const [geojsonData, setGeojsonData] = useState(null);
  const [allRawData, setAllRawData] = useState([]);
  const [allOriginalData, setAllOriginalData] = useState([]);
  const [currentDataKey, setCurrentDataKey] = useState("jenisKelamin");
  const [desaName, setDesaName] = useState(initialDesaName || "");
  const [selectedAreaTitle, setSelectedAreaTitle] = useState(`Desa ${desaName || "Sidoarjo"}`);
  const [isTableVisible, setTableVisible] = useState(false);
  const [activeKbliFilter, setActiveKbliFilter] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeBasemap, setActiveBasemap] = useBasemap();

  const mapCenter = [-7.4612266, 112.658755]; // Default center (Simoanginangin)
  const [selectedArea, setSelectedArea] = useState({
    rt: null,
    rw: null,
    nmdesa: desaName || "",
  });
  const selectedAreaRef = useRef({ rt: null, rw: null, nmdesa: null });
  const geoJsonRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);


  const chartColors = [
    "#0052D4",
    "#4361ee",
    "#7400b8",
    "#65C7F7",
    "#560bad",
    "#4895ef",
    "#f72585",
    "#b5179e",
  ];

  // Define KBLI categories for coloring
  const kbliColors = {
    A: "#22c55e", // Pertanian
    C: "#f97316", // Industri Pengolahan
    G: "#3b82f6", // Perdagangan
    I: "#eab308", // Akomodasi/Makan
    Lainnya: "#94a3b8" // Default
  };

  const getKbliName = (code) => {
    switch (code) {
      case 'A': return "Pertanian";
      case 'C': return "Industri Pengolahan";
      case 'G': return "Perdagangan";
      case 'I': return "Warung / Akomodasi";
      default: return "Sektor Lainnya";
    }
  };

  const getDominantKbli = (areaInfo) => {
    let maxVal = 0;
    let maxKbli = 'Lainnya';
    ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u'].forEach(letter => {
      const val = areaInfo[`jml_umkm_kbli_${letter}`] || 0;
      if (val > maxVal) {
        maxVal = val;
        maxKbli = letter.toUpperCase();
      }
    });
    return { kbli: maxKbli, count: maxVal };
  };

  const blueGradient = [
    "#90EE90",
    "#87ceeb",
    "#6495ed",
    "#4682b4",
    "#1e90ff",
    "#0000cd",
    "#00008b",
    "#00005a",
  ];

  const categorizeEmploymentStatus = useCallback((status) => {
    if (!status) return "tidak bekerja";

    const normalizedStatus = status.toLowerCase().trim();

    // Group working categories
    const workingStatuses = [
      "buruh/karyawan/pegawai",
      "pekerja bebas",
      "berusaha sendiri",
      "pekerja keluarga",
    ];

    const isWorking = workingStatuses.some((workStatus) =>
      normalizedStatus.includes(workStatus)
    );

    return isWorking ? "bekerja" : "tidak bekerja";
  }, []);

  const getWorkFieldValue = useCallback((item) => {
    const possibleFields = ["bidang_pekerjaan"];

    for (const field of possibleFields) {
      if (item[field] && item[field].toString().trim() !== "") {
        return item[field].toString().trim();
      }
    }

    return "";
  }, []);



  // === FUNGSI LOGIKA (Memoized) ===
  const highlightMostFrequent = useCallback(
    (counts) => {
      let maxCount = 0;
      let mostFrequentLabel = "";
      for (const label in counts) {
        if (counts[label] > maxCount) {
          maxCount = counts[label];
          mostFrequentLabel = label;
        }
      }
      return Object.keys(counts).map((label, index) => {
        if (
          label.toLowerCase() === mostFrequentLabel.toLowerCase() &&
          maxCount > 0
        ) {
          return "#8B0000";
        }
        return chartColors[index % chartColors.length];
      });
    },
    [chartColors]
  );

  const processedData = useMemo(() => {
    const dataToProcess = activeKbliFilter 
      ? allRawData.filter(item => getDominantKbli(item).kbli === activeKbliFilter)
      : allRawData;
    if (dataToProcess.length === 0) return { totalPenduduk: 0 };
    return {
      totalPenduduk: dataToProcess.reduce((sum, item) => sum + (item.jml_umkm || 0), 0)
    };
  }, [allRawData, activeKbliFilter]);

  const enrichedGeojsonData = useMemo(() => {
    if (!geojsonData) return geojsonData;

    let baseData = allOriginalData.length > 0 ? allOriginalData : allRawData;
    if (activeKbliFilter) {
      baseData = baseData.filter(item => getDominantKbli(item).kbli === activeKbliFilter);
    }
    if (baseData.length === 0) return geojsonData;

    const areaData = {};

    baseData.forEach((item) => {
      const rt = item.RT || item.rt || item.Rt || item.rT;
      const rw = item.RW || item.rw || item.Rw || item.rW;
      if (!rt || !rw) return;

      const formattedRT = rt.toString().padStart(3, "0");
      const formattedRW = rw.toString().padStart(3, "0");
      const key = `${formattedRT}-${formattedRW}`;
      
      areaData[key] = item;
    });

    const newGeojson = { ...geojsonData };
    newGeojson.features = newGeojson.features.map((feature) => {
      const rt = feature.properties?.RT || feature.properties?.rt;
      const rw = feature.properties?.RW || feature.properties?.rw;
      
      const rt_formatted = rt?.toString().padStart(3, "0");
      const rw_formatted = rw?.toString().padStart(3, "0");
        
      const possibleKeys = [
        `${rt_formatted}-${rw_formatted}`,
        `${rt}-${rw}`,
        `${rt?.toString()}-${rw?.toString()}`,
          `${rt?.toString().padStart(2, "0")}-${rw
            ?.toString()
            .padStart(2, "0")}`,
        ];

        let areaInfo = null;
        for (const key of possibleKeys) {
          if (areaData[key]) {
            areaInfo = areaData[key];
            break;
          }
        }

        if (areaInfo) {
          const domKbli = getDominantKbli(areaInfo);
          return {
            ...feature,
            properties: {
              ...feature.properties,
              totalUmkm: areaInfo.jml_umkm || 0,
              totalRuta: areaInfo.jml_ruta || 0,
              dominantKbli: domKbli.kbli,
              kbliCount: domKbli.count,
              rt: rt_formatted,
              rw: rw_formatted
            },
          };
        } else {
          return {
            ...feature,
            properties: {
              ...feature.properties,
              totalUmkm: 0,
              totalRuta: 0,
              dominantKbli: 'Lainnya',
              kbliCount: 0,
              rt: rt_formatted,
              rw: rw_formatted
            }
          };
        }
      });

    return newGeojson;
  }, [geojsonData, allOriginalData, allRawData, activeKbliFilter]);

  // === FETCH DATA ===
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const url = desaName && desaName !== "SIDOARJO" 
          ? `/api/peta?nmdesa=${encodeURIComponent(desaName)}` 
          : "/api/peta";
        const res = await api6.get(url);
        setGeojsonData(res.data);
      } catch (err) {
        message.error("Gagal memuat data peta geografis.");
        console.error("Fetch GeoJSON error:", err);
      }
    };
    fetchGeoData();
  }, [desaName]);

  useEffect(() => {
    const fetchOriginalData = async () => {
      try {
        const url = desaName && desaName !== "SIDOARJO" 
          ? `/api/umkm?nmdesa=${encodeURIComponent(desaName)}` 
          : "/api/umkm";
        const res = await api6.get(url);
        setAllOriginalData(res.data);
      } catch (err) {
        console.error("Fetch original data error:", err);
      }
    };
    fetchOriginalData();
  }, [desaName]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { rt, rw, nmdesa } = selectedArea;
      let apiUrl = "/api/umkm";
      if (rt && rw) {
        apiUrl += `?rt=${rt}&rw=${rw}`;
        if (desaName && desaName !== "SIDOARJO") {
          apiUrl += `&nmdesa=${encodeURIComponent(desaName)}`;
        }
      } else if (desaName && desaName !== "SIDOARJO") {
        apiUrl += `?nmdesa=${encodeURIComponent(desaName)}`;
      }
      try {
        const res = await api6.get(apiUrl);
        setAllRawData(res.data);
      } catch (err) {
        message.error(`Gagal memuat data untuk area yang dipilih.`);
        console.error("Fetch area data error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedArea]);

  // === MAP LOGIC ===
  const getMapStyle = useCallback(
    (props) => {
      const totalUmkm = props.totalUmkm || 0;
      const dominantKbli = props.dominantKbli || "Lainnya";

      const currentSelected = selectedAreaRef.current;
      const rt = props.RT || props.rt;
      const rw = props.RW || props.rw;
      
      const isSelected = currentSelected.rt != null && currentSelected.rt == rt && currentSelected.rw == rw;
      const isSpotlightActive = currentSelected.rt !== null;

      if (totalUmkm > 0) {
        const fillColor = kbliColors[dominantKbli] || "#94a3b8";

        return {
          fillColor: fillColor,
          weight: isSelected ? 3 : 2,
          color: isSelected ? "#ffffff" : (isSpotlightActive ? "rgba(30, 41, 59, 0.4)" : "#1e293b"),
          fillOpacity: isSelected ? 0.7 : (isSpotlightActive ? 0.4 : 0.5),
        };
      }
      return {
        fillColor: "#e5e7eb",
        weight: isSelected ? 3 : 2,
        color: isSelected ? "#ffffff" : (isSpotlightActive ? "rgba(30, 41, 59, 0.4)" : "#1e293b"),
        fillOpacity: isSelected ? 0.7 : (isSpotlightActive ? 0.3 : 0.4),
      };
    },
    [kbliColors]
  );

  const getHoverStyle = useCallback(() => {
    return {
      fillColor: "#facc15",
      weight: 3,
      color: "#0f172a",
      fillOpacity: 0.7,
    };
  }, []);

  const onEachFeature = useCallback(
    (feature, layer) => {
      const props = feature.properties;

      let dominantText = "Tidak Ada Data";
      if (props.totalUmkm > 0) {
        dominantText = getKbliName(props.dominantKbli);
      }

      const tooltipContent = `
        <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px; max-width: 250px;">
          <div style="font-weight: bold; color: #1f2937; margin-bottom: 6px; font-size: 13px;">${
            props.nmdesa || "Tidak Diketahui"
          }</div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; margin-bottom: 6px; font-size: 11px; color: #4b5563;">
            <span>RT: ${props.rt || "-"}</span>
            <span>RW: ${props.rw || "-"}</span>
          </div>
          <div style="color: #6b7280; font-size: 11px; margin-bottom: 2px;">Sektor Dominan:</div>
          <div style="color: #dc2626; font-weight: bold; font-size: 12px; margin-bottom: 8px;">
            ${dominantText}
          </div>
          <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; padding: 6px; text-align: center;">
            <div style="color: #166534; font-weight: bold; font-size: 11px;">
              Jumlah UMKM: ${props.totalUmkm || 0}
            </div>
            <div style="color: #15803d; font-size: 10px; margin-top: 2px;">
               (${props.kbliCount || 0} di sektor dominan)
            </div>
          </div>
        </div>
      `;

      const popupContent = `
  <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; min-width: 220px; max-width: 260px;">
    <div style="font-weight: bold; color: #1f2937; margin-bottom: 6px; font-size: 14px; border-bottom: 1px solid #e5e7eb; padding-bottom: 3px;">${
      props.nmdesa || "Tidak Diketahui"
    }</div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 6px;">
      <div style="color: #374151; font-size: 11px;"><strong>RT:</strong> ${
        props.rt || "?"
      }</div>
      <div style="color: #374151; font-size: 11px;"><strong>RW:</strong> ${
        props.rw || "?"
      }</div>
    </div>
    <div style="color: #374151; margin-bottom: 3px; font-size: 11px;"><strong>Dusun:</strong> ${
      props.dusun || "Tidak Diketahui"
    }</div>
    <div style="color: #374151; margin-bottom: 6px; font-size: 11px;"><strong>Kecamatan:</strong> ${
      props.kecamatan || "Tidak Diketahui"
    }</div>
    <div style="color: #dc2626; font-weight: 600; margin-bottom: 3px; font-size: 12px;">Sektor KBLI Dominan:</div>
    <div style="color: #dc2626; font-weight: 500; margin-bottom: 6px; padding: 4px 6px; background-color: #fef2f2; border-radius: 3px; border-left: 2px solid #dc2626; font-size: 11px;">${dominantText}</div>
    <div style="color: #059669; font-weight: 600; background-color: #f0fdf4; padding: 6px 8px; border-radius: 4px; text-align: center; border: 1px solid #bbf7d0; font-size: 11px;">
      <strong>Jumlah UMKM:</strong> ${props.totalUmkm || 0}
      <div style="font-size: 10px; color: #065f46; margin-top: 1px;">
        (${props.kbliCount || 0} di sektor dominan)
      </div>
    </div>
  </div>
`;

      layer.bindTooltip(tooltipContent, {
        permanent: false,
        direction: "top",
        offset: [0, -10],
        className: "custom-tooltip",
        opacity: 0.95,
      });

      layer.bindPopup(popupContent, {
        className: "custom-popup-compact",
        maxWidth: 280,
        minWidth: 220,
        closeButton: true,
        autoClose: false,
        closeOnClick: false,
        autoPan: false,
      });

      const originalStyle = getMapStyle(props);
      layer.setStyle(originalStyle);

      layer.on({
        mouseover: (e) => {
          const hoveredLayer = e.target;
          hoveredLayer.setStyle(getHoverStyle());
          hoveredLayer.bringToFront();
        },

        mouseout: (e) => {
          const layer = e.target;
          layer.setStyle(originalStyle);
        },

        click: (e) => {
          const clickedLayer = e.target;
          const { RT, RW, nmdesa } = clickedLayer.feature.properties;

          if (RT && RW) {
            setSelectedAreaTitle(`${nmdesa || 'Desa'} - RT ${RT}/RW ${RW}`);
            setSelectedArea({ rt: RT, rw: RW, nmdesa });
            selectedAreaRef.current = { rt: RT, rw: RW, nmdesa }; // Update ref immediately
          }

          clickedLayer._map.eachLayer((layer) => {
            if (layer.getPopup && layer.getPopup() && layer !== clickedLayer) {
              layer.closePopup();
            }
            if (layer.feature && layer.feature.properties && layer.setStyle) {
              layer.setStyle(getMapStyle(layer.feature.properties)); // Apply spotlight
            }
          });

          // Zoom to the clicked polygon smoothly, offset for the left panel
          if (clickedLayer.getBounds) {
            clickedLayer._map.flyToBounds(clickedLayer.getBounds(), { 
              paddingTopLeft: [380, 50], // Offset for the left panel
              paddingBottomRight: [50, 50],
              duration: 1.5,
              easeLinearity: 0.25
            });
          }

          clickedLayer.openPopup();
        },
      });
    },
    [getMapStyle, getHoverStyle]
  );

  const handleResetView = () => {
    setSelectedArea({ rt: null, rw: null, nmdesa: null });
    selectedAreaRef.current = { rt: null, rw: null, nmdesa: null };
    setSelectedAreaTitle(`Desa ${desaName || "Sidoarjo"}`);


    // Refresh layer styles manually
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer) => {
        if (layer.feature && layer.feature.properties && layer.setStyle) {
          layer.setStyle(getMapStyle(layer.feature.properties));
        }
        if (layer.getPopup && layer.getPopup()) {
          layer.closePopup();
        }
      });
    }
  };



  return (
    <div
      className="relative h-full w-full overflow-hidden"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <style jsx global>{`
        * {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        *::-webkit-scrollbar {
          display: none;
        }
        .leaflet-interactive {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .leaflet-interactive:hover {
          filter: brightness(1.1);
        }

        .custom-tooltip {
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        .custom-tooltip .leaflet-tooltip-content {
          margin: 0 !important;
          padding: 8px 12px !important;
        }
        .custom-tooltip::before {
          border-top-color: #e5e7eb !important;
        }

        .custom-popup .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 12px !important;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
            0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
          padding: 1px !important;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0 !important;
          padding: 16px 20px !important;
        }
        .custom-popup .leaflet-popup-close-button {
          color: #6b7280 !important;
          font-size: 18px !important;
          font-weight: bold !important;
          padding: 8px !important;
        }
        .custom-popup .leaflet-popup-close-button:hover {
          color: #374151 !important;
          background-color: #f3f4f6 !important;
          border-radius: 4px !important;
        }

        .custom-popup-compact .leaflet-popup-content-wrapper {
          background: white !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
          padding: 1px !important;
          font-family: "Inter", -apple-system, BlinkMacSystemFont, sans-serif !important;
        }
        .custom-popup-compact .leaflet-popup-content {
          margin: 0 !important;
          padding: 12px 14px !important;
        }
        .custom-popup-compact .leaflet-popup-close-button {
          color: #9ca3af !important;
          font-size: 16px !important;
          font-weight: bold !important;
          padding: 4px 3px !important;
          right: 6px !important;
          top: 6px !important;
          width: 20px !important;
          height: 20px !important;
          line-height: 12px !important;
          text-align: center !important;
          border-radius: 50% !important;
          background-color: #f9fafb !important;
          border: 1px solid #e5e7eb !important;
          transition: all 0.2s ease !important;
        }
        .custom-popup-compact .leaflet-popup-close-button:hover {
          color: #374151 !important;
          background-color: #f3f4f6 !important;
          border-color: #d1d5db !important;
          transform: scale(1.1) !important;
        }
        .custom-popup-compact .leaflet-popup-tip {
          background: white !important;
          border: 1px solid #e5e7eb !important;
        }

        .leaflet-popup {
          animation: popupFadeIn 0.3s ease-out;
        }
        @keyframes popupFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .leaflet-interactive:focus,
        .leaflet-clickable,
        .leaflet-zoom-animated .leaflet-interactive {
          outline: none !important;
          border: none !important;
        }
      `}</style>

      {/* Peta Fullscreen */}
      <div className="absolute inset-0 z-0">
        {geojsonData ? (
          <MapContainer
            center={[-7.379, 112.73]}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            doubleClickZoom={true}
            zoomControl={false}
          >
            <TileLayer
              url={activeBasemap.url}
              attribution={activeBasemap.attribution}
              maxZoom={activeBasemap.maxZoom}
            />
            <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} />
            <AutoZoom geojsonData={geojsonData} />
            {enrichedGeojsonData && (
              <GeoJSON
                ref={geoJsonRef}
                key={`geojson-${allOriginalData.length}`}
                data={enrichedGeojsonData}
                style={(feature) => getMapStyle(feature.properties)}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full bg-gray-100">
            <BeatLoader color="#4A90E2" size={10} />
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-100 z-[1000] min-w-[200px] transition-all duration-300">
            <h4 className="font-bold text-gray-800 mb-3 text-sm flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Legend UMKM
              </span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {Object.entries(kbliColors)
                .filter(([kbli]) => {
                  if (!enrichedGeojsonData || !enrichedGeojsonData.features) return true;
                  return enrichedGeojsonData.features.some(f => f.properties.dominantKbli === kbli && f.properties.totalUmkm > 0);
                })
                .map(([kbli, color]) => (
                <div key={kbli} className="flex items-center gap-3 group">
                  <span
                    className="w-4 h-4 rounded shadow-sm border border-black/10 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: color }}
                  ></span>
                  <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                    KBLI {kbli} - {getKbliName(kbli)}
                  </span>
                </div>
              ))}
            </div>
          </div>

      {/* Filter Panel */}
      <div className="absolute top-4 right-4 z-[1000]">
        {!isFilterPanelOpen ? (
          <button
            onClick={() => setIsFilterPanelOpen(true)}
            className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 hover:shadow-xl transition-all duration-300 flex items-center space-x-2 group"
          >
            <svg
              className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z"
              />
            </svg>
            <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
              Filter Data
            </span>
            {activeKbliFilter && (
              <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium ml-2">
                1 Aktif
              </div>
            )}
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsFilterPanelOpen(false)}
              className="absolute top-2 right-2 z-50 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full shadow-md transition-all duration-200"
              style={{ width: "24px", height: "24px" }}
            >
              <svg
                className="w-4 h-4 m-auto"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <FilterPanelUmkm
              onFilterChange={(filters) => setActiveKbliFilter(filters.kbliDominan)}
              filteredCount={processedData.totalPenduduk || 0}
              totalCount={allRawData.reduce((sum, item) => sum + (item.jml_umkm || 0), 0)}
              kbliColors={kbliColors}
              getKbliName={getKbliName}
            />
          </div>
        )}
      </div>



      {/*Panel Overlay*/}
      <div
        className={`absolute top-4 left-4 sm:left-14 z-10 transition-all duration-300 ${
          isPanelMinimized ? "w-16 h-12" : "w-80 max-h-[calc(100vh-130px)] flex flex-col"
        }`}
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col flex-1 min-h-0">
          <div
            className="bg-blue-600 text-white p-3 flex justify-between items-center cursor-pointer hover:bg-blue-700 transition-colors duration-200"
            onClick={() => setIsPanelMinimized(!isPanelMinimized)}
          >
            <h2
              className={`font-medium text-sm ${
                isPanelMinimized ? "hidden" : "block"
              }`}
            >
              {selectedAreaTitle}
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPanelMinimized(!isPanelMinimized);
              }}
              className="text-white hover:bg-blue-800 p-1 rounded text-sm transition-colors duration-200"
            >
              {isPanelMinimized ? "→" : "←"}
            </button>
          </div>

          {!isPanelMinimized && (
            <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1">
              <h2 className="text-lg font-bold text-gray-800 text-center mb-2 mt-1 pb-1 border-b-2 border-blue-100">
                Data UMKM
              </h2>

              <div className="bg-blue-50 rounded-lg p-2 mb-3 shadow-sm border border-blue-100 transform transition hover:scale-105">
                <p className="text-xs text-gray-500 font-medium text-center">
                  Total UMKM
                </p>
                <p className="text-3xl font-extrabold text-blue-600 text-center my-0">
                  <CountUp end={processedData?.totalPenduduk || 0} duration={2} separator="." />
                </p>
                {selectedArea.rt && selectedArea.rw && (
                  <p className="text-[10px] text-gray-400 text-center">
                    di RT {selectedArea.rt} / RW {selectedArea.rw}
                  </p>
                )}
              </div>

              <div className="flex-1 min-h-0 w-full px-1">
                <UmkmCharts 
                  data={activeKbliFilter ? allRawData.filter(item => getDominantKbli(item).kbli === activeKbliFilter) : allRawData} 
                />
              </div>

            </div>
          )}
        </div>
      </div>

      {/* AI Insight Box at the bottom middle */}
      <AIInsightBox 
        featureName={selectedAreaTitle}
        contextType="umkm"
        data={{
          totalUmkm: processedData.totalUmkm,
          dominanKbli: getKbliName(processedData.dominantKbli)
        }}
      />
    </div>
  );
};

export default memo(Dashboard);
