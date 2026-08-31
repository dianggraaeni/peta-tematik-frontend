import { useState, useEffect, memo, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import CustomMapControls, { useBasemap } from "../CustomMapControls";
import "leaflet/dist/leaflet.css";
import CountUp from "react-countup";
import { BeatLoader } from "react-spinners";
import DemographicsChart from "./DemographicsChart";
import FilterPanel from "./FilterPanel";
import AIInsightBox from "../AIInsightBox";
import RightSidebar from "../RightSidebar";
import L from "leaflet";

import api6 from "../../utils/api6.js";
import { message } from "antd";
import { useNavigate } from "react-router-dom";

// Map Resizer to fix Leaflet scrambled tiles on mount
const MapResizer = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 400);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

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

const Dashboard = ({ desaName: propsDesaName, hideCards }) => {
  const navigate = useNavigate();
  // === STATE ===
  const [geojsonData, setGeojsonData] = useState(null);
  const [allRawData, setAllRawData] = useState([]);
  const [allOriginalData, setAllOriginalData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [desaName, setDesaName] = useState(propsDesaName || "SIDOARJO");
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [currentDataKey, setCurrentDataKey] = useState("jenisKelamin");
  const [selectedAreaTitle, setSelectedAreaTitle] = useState(`Desa ${desaName || "Sidoarjo"}`);
  const [isTableVisible, setTableVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState({ rt: null, rw: null, nmdesa: null });
  const selectedAreaRef = useRef({ rt: null, rw: null, nmdesa: null });
  const geoJsonRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const [chartType, setChartType] = useState("doughnut");

  const [isFilterMinimized, setIsFilterMinimized] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

  const [activeFilters, setActiveFilters] = useState({
    gender: "",
    ageGroup: "",
    employment: "",
    workField: "",
  });

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

  const employmentColors = {
    "tidak bekerja": "#60a5fa", // Lighter blue
    bekerja: "#2563eb", // Vibrant Blue
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

  // === IMPROVED FILTER LOGIC ===
  const applyFilters = useCallback(
    (data, filters) => {
      return data.filter((item) => {
        // Gender filter
        if (
          filters.gender &&
          item.jenis_kelamin.toLowerCase() !== filters.gender
        ) {
          return false;
        }

        // Age group filter
        if (filters.ageGroup) {
          const age = Number.parseInt(item.umur, 10);
          if (isNaN(age)) return filters.ageGroup === "Tidak Diketahui";

          switch (filters.ageGroup) {
            case "< 17":
              if (age >= 17) return false;
              break;
            case "17-25":
              if (age < 17 || age > 25) return false;
              break;
            case "26-35":
              if (age < 26 || age > 35) return false;
              break;
            case "36-45":
              if (age < 36 || age > 45) return false;
              break;
            case "46-55":
              if (age < 46 || age > 55) return false;
              break;
            case "> 55":
              if (age <= 55) return false;
              break;
          }
        }

        // Employment filter - kembali ke kategori detail
        if (filters.employment) {
          const itemStatus = (
            item.Status_Pekerjaan_Utama ||
            item.status_pekerjaan_utama ||
            item.STATUS_PEKERJAAN_UTAMA ||
            "Tidak Bekerja"
          )
            .toLowerCase()
            .trim();

          if (itemStatus !== filters.employment) {
            return false;
          }
        }

        // Work Field Filter dengan logika yang lebih fleksibel
        if (filters.workField) {
          const itemWorkField = getWorkFieldValue(item);

          if (!itemWorkField) {
            return false;
          }

          const normalizedItemField = itemWorkField.toUpperCase().trim();
          const filterValue = filters.workField.toUpperCase().trim();

          const isMatch =
            normalizedItemField === filterValue ||
            normalizedItemField.startsWith(filterValue + " ") ||
            normalizedItemField.startsWith(filterValue + "-") ||
            normalizedItemField.startsWith(filterValue + " -") ||
            (filterValue.length === 1 &&
              normalizedItemField.charAt(0) === filterValue);

          if (!isMatch) {
            return false;
          }
        }

        return true;
      });
    },
    [getWorkFieldValue]
  );

  // Update filtered data when filters or raw data change
  useEffect(() => {
    const filtered = applyFilters(allRawData, activeFilters);
    setFilteredData(filtered);
  }, [allRawData, activeFilters, applyFilters]);

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
    const dataToProcess = filteredData.length > 0 ? filteredData : allRawData;

    if (dataToProcess.length === 0) return {};

    const jenisKelaminCounts = {};
    const statusPekerjaanCounts = {};
    const statusPekerjaanMapCounts = {};
    const umurCounts = {
      "< 17": 0,
      "17-25": 0,
      "26-35": 0,
      "36-45": 0,
      "46-55": 0,
      "> 55": 0,
      "Tidak Diketahui": 0,
    };

    dataToProcess.forEach((item) => {
      let jk = (item.jenis_kelamin || "tidak diketahui").toLowerCase().trim();
      if (jk === "pria" || jk === "male") jk = "laki-laki";
      else if (jk === "wanita" || jk === "female") jk = "perempuan";
      jenisKelaminCounts[jk] = (jenisKelaminCounts[jk] || 0) + 1;

      // Status pekerjaan untuk chart (detail)
      const status = (
        item.Status_Pekerjaan_Utama ||
        item.status_pekerjaan_utama ||
        item.STATUS_PEKERJAAN_UTAMA ||
        "Tidak Bekerja"
      )
        .toLowerCase()
        .trim();
      statusPekerjaanCounts[status] = (statusPekerjaanCounts[status] || 0) + 1;

      // Status pekerjaan untuk peta (2 kategori)
      const categorizedStatus = categorizeEmploymentStatus(status);
      statusPekerjaanMapCounts[categorizedStatus] =
        (statusPekerjaanMapCounts[categorizedStatus] || 0) + 1;

      const umur = Number.parseInt(item.umur, 10);
      if (isNaN(umur)) umurCounts["Tidak Diketahui"]++;
      else if (umur < 17) umurCounts["< 17"]++;
      else if (umur <= 25) umurCounts["17-25"]++;
      else if (umur <= 35) umurCounts["26-35"]++;
      else if (umur <= 45) umurCounts["36-45"]++;
      else umurCounts["> 55"]++;
    });

    const jkLabels = Object.keys(jenisKelaminCounts);
    const jkColors = jkLabels.map((label) =>
      label === "laki-laki"
        ? "#4361ee"
        : label === "perempuan"
        ? "#f72585"
        : "#adb5bd"
    );

    // Chart tetap menggunakan warna original dengan highlight
    const statusLabels = Object.keys(statusPekerjaanCounts);
    const statusColors = highlightMostFrequent(statusPekerjaanCounts);

    return {
      totalPenduduk: dataToProcess.length,
      jenisKelamin: {
        labels: jkLabels.map((l) => l.replace(/\b\w/g, (s) => s.toUpperCase())),
        values: Object.values(jenisKelaminCounts),
        colors: jkColors,
        title: "Distribusi Jenis Kelamin",
      },
      statusPekerjaan: {
        labels: statusLabels.map((l) =>
          l.replace(/\b\w/g, (s) => s.toUpperCase())
        ),
        values: Object.values(statusPekerjaanCounts),
        colors: statusColors,
        title: "Distribusi Status Pekerjaan",
      },
      statusPekerjaanMap: statusPekerjaanMapCounts,
      umur: {
        labels: Object.keys(umurCounts),
        values: Object.values(umurCounts),
        colors: highlightMostFrequent(umurCounts),
        title: "Distribusi Kelompok Umur",
      },
    };
  }, [
    filteredData,
    allRawData,
    categorizeEmploymentStatus,
    highlightMostFrequent,
  ]);

  // === CALCULATE DOMINANT EMPLOYMENT BY AREA ===
  const enrichedGeojsonData = useMemo(() => {
    if (!geojsonData) return geojsonData;

    const baseData = allOriginalData.length > 0 ? allOriginalData : allRawData;
    const dataForMap = applyFilters(baseData, activeFilters);

    if (baseData.length === 0) return geojsonData;

    const areaData = {};

    dataForMap.forEach((item) => {
      const rt = item.RT || item.rt || item.Rt || item.rT;
      const rw = item.RW || item.rw || item.Rw || item.rW;

      if (!rt || !rw) {
        return;
      }

      const formattedRT = rt.toString().padStart(3, "0");
      const formattedRW = rw.toString().padStart(3, "0");
      const key = `${formattedRT}-${formattedRW}`;

      if (!areaData[key]) {
        areaData[key] = {
          total: 0,
          employmentCounts: {},
          rt: rt,
          rw: rw,
        };
      }

      const rawStatus =
        item.Status_Pekerjaan_Utama ||
        item.status_pekerjaan_utama ||
        item.STATUS_PEKERJAAN_UTAMA ||
        "Tidak Bekerja";

      const categorizedStatus = categorizeEmploymentStatus(rawStatus);

      areaData[key].employmentCounts[categorizedStatus] =
        (areaData[key].employmentCounts[categorizedStatus] || 0) + 1;
      areaData[key].total += 1;
    });

    // Sisanya tetap sama...
    Object.keys(areaData).forEach((key) => {
      const area = areaData[key];
      let maxCount = 0;
      let dominantStatus = "tidak bekerja";

      Object.entries(area.employmentCounts).forEach(([status, count]) => {
        if (count > maxCount) {
          maxCount = count;
          dominantStatus = status;
        }
      });

      area.dominantEmployment = dominantStatus;
      area.dominantEmploymentCount = maxCount;
    });

    const enrichedData = {
      ...geojsonData,
      features: geojsonData.features.map((feature) => {
        const rt = feature.properties.RT || feature.properties.rt;
        const rw = feature.properties.RW || feature.properties.rw;

        const rt_formatted = rt ? rt.toString().padStart(3, "0") : null;
        const rw_formatted = rw ? rw.toString().padStart(3, "0") : null;

        const possibleKeys = [
          `${rt_formatted}-${rw_formatted}`,
          `${rt}-${rw}`,
          `${rt ? rt.toString() : ''}-${rw ? rw.toString() : ''}`,
          `${rt ? rt.toString().padStart(2, "0") : ''}-${rw ? rw.toString().padStart(2, "0") : ''}`,
        ];

        let areaInfo = null;
        for (const key of possibleKeys) {
          if (areaData[key]) {
            areaInfo = areaData[key];
            break;
          }
        }

        if (!areaInfo) {
          areaInfo = {
            dominantEmployment: "tidak bekerja",
            dominantEmploymentCount: 0,
            total: 0,
          };
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            dominantEmployment: areaInfo.dominantEmployment,
            dominantEmploymentCount: areaInfo.dominantEmploymentCount,
            totalPopulation: areaInfo.total,
          },
        };
      }),
    };

    return enrichedData;
  }, [geojsonData, allOriginalData, allRawData, categorizeEmploymentStatus]);

  // === FETCH DATA ===
  useEffect(() => {
    const fetchGeoData = async () => {
      try {
        const url = desaName && desaName !== "SIDOARJO" 
          ? `/api/peta?nmdesa=${encodeURIComponent(desaName.replace(/\s+/g, ''))}` 
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
          ? `/api/pekerjaan?nmdesa=${encodeURIComponent(desaName.replace(/\s+/g, ''))}` 
          : "/api/pekerjaan";
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
      let apiUrl = "/api/pekerjaan";
      if (rt && rw) {
        apiUrl += `?rt=${rt}&rw=${rw}`;
        if (nmdesa) apiUrl += `&nmdesa=${encodeURIComponent(nmdesa)}`;
      } else if (desaName && desaName !== "SIDOARJO") {
        apiUrl += `?nmdesa=${encodeURIComponent(desaName.replace(/\s+/g, ''))}`;
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
      const totalPopulation = props.totalPopulation || 0;
      const dominantEmployment = props.dominantEmployment;

      const currentSelected = selectedAreaRef.current;
      const rt = props.RT || props.rt;
      const rw = props.RW || props.rw;
      
      const isSelected = currentSelected.rt == rt && currentSelected.rw == rw;
      const isSpotlightActive = currentSelected.rt !== null;

      if (totalPopulation > 0 && dominantEmployment) {
        // Use the new two-color scheme
        const fillColor = employmentColors[dominantEmployment] || "#D3D3D3";

        return {
          fillColor: fillColor,
          weight: isSelected ? 2 : 1,
          color: isSelected ? "#ffffff" : (isSpotlightActive ? "rgba(30, 41, 59, 0.4)" : "#1e293b"),
          fillOpacity: isSelected ? 0.7 : (isSpotlightActive ? 0.4 : 0.5),
        };
      }
      return {
        fillColor: "#ffffff",
        weight: isSelected ? 2 : 1,
        color: isSelected ? "#ffffff" : (isSpotlightActive ? "rgba(30, 41, 59, 0.4)" : "#1e293b"),
        fillOpacity: isSelected ? 0.7 : (isSpotlightActive ? 0.3 : 0.4),
      };
    },
    [employmentColors]
  );

  const getHoverStyle = useCallback(() => {
    return {
      fillColor: "#facc15",
      opacity: 1,
      weight: 2,
      color: "#0f172a",
      dashArray: "",
      fillOpacity: 0.7,
    };
  }, []);

  const onEachFeature = useCallback(
    (feature, layer) => {
      const props = feature.properties;

      let dominantText = "Tidak Ada Data";
      if (
        props.dominantEmployment &&
        props.dominantEmployment !== "tidak ada data"
      ) {
        dominantText = props.dominantEmployment.replace(/\b\w/g, (s) =>
          s.toUpperCase()
        );
      }

      const tooltipContent = `
        <div style="font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px; max-width: 250px;">
          <div style="font-weight: bold; color: #1f2937; margin-bottom: 6px; font-size: 13px;">${
            props.nmdesa || "Tidak Diketahui"
          }</div>
          <div style="color: #374151; margin-bottom: 3px;"><strong>RT/RW:</strong> ${
            props.RT || "?"
          }/${props.RW || "?"}</div>
          <div style="color: #dc2626; font-weight: 600; margin-bottom: 3px;">Status Dominan:</div>
          <div style="color: #dc2626; font-weight: 500; margin-bottom: 4px; padding-left: 6px;">${dominantText}</div>
          <div style="color: #059669; font-weight: 600; background-color: #f0fdf4; padding: 4px 6px; border-radius: 3px; text-align: center; font-size: 11px;">
            ${props.dominantEmploymentCount || 0} dari ${
        props.totalPopulation || 0
      } orang
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
        props.RT || "?"
      }</div>
      <div style="color: #374151; font-size: 11px;"><strong>RW:</strong> ${
        props.RW || "?"
      }</div>
    </div>
    <div style="color: #374151; margin-bottom: 3px; font-size: 11px;"><strong>Dusun:</strong> ${
      props.dusun || "Tidak Diketahui"
    }</div>
    <div style="color: #374151; margin-bottom: 6px; font-size: 11px;"><strong>Kecamatan:</strong> ${
      props.kecamatan || "Tidak Diketahui"
    }</div>
    <div style="color: #dc2626; font-weight: 600; margin-bottom: 3px; font-size: 12px;">Status Pekerjaan Dominan:</div>
    <div style="color: #dc2626; font-weight: 500; margin-bottom: 6px; padding: 4px 6px; background-color: #fef2f2; border-radius: 3px; border-left: 2px solid #dc2626; font-size: 11px;">${dominantText}</div>
    <div style="color: #059669; font-weight: 600; background-color: #f0fdf4; padding: 6px 8px; border-radius: 4px; text-align: center; border: 1px solid #bbf7d0; font-size: 11px;">
      <strong>Jumlah:</strong> ${props.dominantEmploymentCount || 0} dari ${
        props.totalPopulation || 0
      } orang
      <div style="font-size: 10px; color: #065f46; margin-top: 1px;">
        (${
          props.totalPopulation > 0
            ? Math.round(
                (props.dominantEmploymentCount / props.totalPopulation) * 100
              )
            : 0
        }% dari total populasi)
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
      if (typeof layer.setStyle === 'function') {
        layer.setStyle(originalStyle);
      }

      layer.on({
        mouseover: (e) => {
          const hoveredLayer = e.target;
          if (typeof hoveredLayer.setStyle === 'function') {
            hoveredLayer.setStyle(getHoverStyle());
          }
          if (typeof hoveredLayer.bringToFront === 'function') {
            hoveredLayer.bringToFront();
          }
        },

        mouseout: (e) => {
          const layerTarget = e.target;
          if (typeof layerTarget.setStyle === 'function') {
            layerTarget.setStyle(originalStyle);
          }
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
    setSelectedAreaTitle(`Seluruh ${desaName || "Sidoarjo"}`);
    setActiveFilters({
      gender: "",
      ageGroup: "",
      employment: "",
      workField: "",
    });

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

  const handleFilterChange = (filters) => {
    setActiveFilters(filters);
  };

  return (
    <div className="flex w-full h-full overflow-hidden relative">
      <div className="flex-grow relative h-full">
      <style>{`
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

      {geojsonData ? (
        <MapContainer
          center={[-7.379, 112.73]}
          zoom={13}
          minZoom={12}
          maxZoom={18}
          zoomSnap={0.5}
          zoomDelta={0.5}
          maxBounds={[[-8.0, 112.0], [-7.0, 113.5]]}
          maxBoundsViscosity={1.0}
          className="w-full h-full absolute inset-0 z-0"
          doubleClickZoom={true}
          zoomControl={false}
          scrollWheelZoom={true}
        >
          <TileLayer url={activeBasemap.url} attribution={activeBasemap.attribution} maxZoom={activeBasemap.maxZoom} />
          <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} onLayerOpenChange={setIsLayerOpen} isDetail={true} />
          <MapResizer />
          <AutoZoom geojsonData={geojsonData} />
          {enrichedGeojsonData && (
            <GeoJSON
              ref={geoJsonRef}
              key={`geojson-${allOriginalData.length}-${JSON.stringify(activeFilters)}`}
              data={enrichedGeojsonData}
              style={(feature) => getMapStyle(feature.properties)}
              onEachFeature={onEachFeature}
            />
          )}
        </MapContainer>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 absolute inset-0 z-0">
          <BeatLoader color="#4A90E2" size={10} />
        </div>
      )}

      {/* ── TOP BAR OVERLAY ── */}
      <div className="absolute top-3 left-3 z-[1000] flex items-start gap-2 pointer-events-none">
        {/* Back Button */}
        <button
          onClick={() => navigate('/peta-tematik')}
          className="shrink-0 pointer-events-auto w-11 h-11 bg-white rounded-2xl shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          title="Kembali ke Peta Tematik"
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

          {/* ── FILTER — fixed icon below zoom (+/-), panel expands LEFT */}

          {!hideCards && (
            <div className="absolute top-[256px] right-4 z-[1000] pointer-events-auto">
              <button
                className="relative w-11 h-11 bg-white/95 backdrop-blur-xl shadow-md rounded-2xl border border-gray-100 flex items-center justify-center text-gray-700 hover:bg-gray-50 transition-all active:scale-95"
                onClick={() => setIsFilterMinimized(!isFilterMinimized)}
                title={isFilterMinimized ? "Buka Filter" : "Tutup Filter"}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                {(activeFilters.gender || activeFilters.ageGroup || activeFilters.employment || activeFilters.workField) && (
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full border-2 border-white"/>
                )}
              </button>
              {!isFilterMinimized && (
                <div className="absolute top-0 right-full mr-2 w-[calc(100vw-80px)] sm:w-72 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-gray-100 overflow-hidden">
                  <div className="p-3 pb-2 border-b border-gray-100 text-xs flex justify-between items-center">
                    <div className="flex items-center gap-2 text-blue-600 font-bold">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                      <span>Filter Data</span>
                    </div>
                    <button onClick={() => setIsFilterMinimized(true)} className="text-gray-400 hover:text-gray-700">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                  <FilterPanel onFilterChange={handleFilterChange} filteredCount={filteredData.length} totalCount={allRawData.length} />
                </div>
              )}
            </div>
          )}





      </div>

      {!hideCards && (
        <RightSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          desaName={desaName}
          themeName="DETAIL DESA"
          themeIcon="/pict/des-can.png"
        >
          <div className="flex flex-col gap-4 p-4">
            <h2 className="font-medium text-sm truncate">{selectedAreaTitle}</h2>
            
            <div className="border-b border-gray-200 pb-2">
              <button onClick={handleResetView} className="w-full bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2.5 rounded-lg transition-all font-medium text-xs">
                Reset Tampilan
              </button>
            </div>
            
            <div className="border-b border-gray-200 pb-2">
              <h3 className="font-medium text-gray-800 mb-1 text-[10px]">Data Pekerjaan</h3>
              {loading ? (
                <div className="flex justify-center items-center h-10"><BeatLoader color="#4A90E2" size={6} /></div>
              ) : (
                <div className="bg-blue-50 p-2 rounded-lg text-center">
                  <p className="text-[10px] text-gray-600 mb-0.5">Total Penduduk 15-64 Thn</p>
                  <p className="text-lg font-bold text-blue-600"><CountUp end={processedData.totalPenduduk || 0} duration={1.5} /></p>
                  {filteredData.length > 0 && <p className="text-[9px] text-gray-500">dari {allRawData.length} total</p>}
                </div>
              )}
            </div>
            
            <div className="border-b border-gray-200 pb-2">
              <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                {["jenisKelamin","statusPekerjaan","umur"].map(key => (
                  <button key={key} onClick={() => setCurrentDataKey(key)} className={`px-1 py-1.5 text-[9px] font-medium rounded-md transition-all ${currentDataKey === key ? "bg-blue-600 text-white shadow-md" : "text-gray-600 hover:bg-gray-200"}`}>
                    {key === "jenisKelamin" ? "J. Kelamin" : key === "statusPekerjaan" ? "Pekerjaan" : "Umur"}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="border-b border-gray-200 pb-2">
              <div className="grid grid-cols-2 gap-1">
                {["bar","doughnut"].map(type => (
                  <button key={type} onClick={() => setChartType(type)} className={`py-1.5 px-1.5 rounded-lg text-[9px] font-medium transition-all ${chartType === type ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                    {type === "bar" ? "Batang" : "Lingkaran"}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <div className="h-44 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-1.5 shadow-inner border border-blue-100">
                {loading ? <div className="flex justify-center items-center h-full"><BeatLoader color="#4A90E2" size={6} /></div> : <DemographicsChart chartData={processedData[currentDataKey]} chartType={chartType} />}
              </div>
            </div>

            {/* Legend Peta Pekerjaan */}
            <div className="mt-2 bg-white border border-gray-100 p-2 rounded-xl shadow-sm">
              <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5 text-center">
                Legenda Warna Peta
              </h3>
              <p className="text-[9px] text-gray-400 text-center mb-2 leading-tight">
                Warna area menunjukkan Status Bekerja Dominan
              </p>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center text-[9px]">
                  <span className="w-3 h-3 rounded-full mr-2 shrink-0 border border-gray-200 shadow-sm" style={{ backgroundColor: "#2563eb" }}></span>
                  <span className="text-gray-700 font-medium truncate">Bekerja</span>
                </div>
                <div className="flex items-center text-[9px]">
                  <span className="w-3 h-3 rounded-full mr-2 shrink-0 border border-gray-200 shadow-sm" style={{ backgroundColor: "#60a5fa" }}></span>
                  <span className="text-gray-700 font-medium truncate">Tidak Bekerja</span>
                </div>
              </div>
            </div>
          </div>
          {/* AI Insight — tampil langsung tanpa perlu klik RT */}
          <AIInsightBox
            desaName={desaName}
            featureName={selectedArea.rt && selectedArea.rt !== 'all' ? `RT ${selectedArea.rt} RW ${selectedArea.rw}` : desaName}
            contextType="sosial_kependudukan_rw"
            requireClick={true}
            inline={true}
            customClass="!static !w-full !mt-2"
            data={selectedArea.rt ? (selectedArea.rt !== 'all' ? selectedData : aggregateRW(selectedArea.rw)) : {}}
          />
        </RightSidebar>
      )}
    </div>
  );
};

export default memo(Dashboard);
