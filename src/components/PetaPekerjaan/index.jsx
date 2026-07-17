import { useState, useEffect, memo, useMemo, useCallback, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import CustomMapControls, { useBasemap } from "../CustomMapControls";
import "leaflet/dist/leaflet.css";
import CountUp from "react-countup";
import { BeatLoader } from "react-spinners";
import DemographicsChart from "./DemographicsChart";
import FilterPanel from "./FilterPanel";
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

const Dashboard = ({ desaName: propsDesaName }) => {
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
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [chartType, setChartType] = useState("doughnut");

  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

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
          ? `/api/pekerjaan?nmdesa=${encodeURIComponent(desaName)}` 
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
        fillColor: "#e5e7eb",
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
                key={`geojson-${allOriginalData.length}-${JSON.stringify(activeFilters)}`}
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

        {/*Filter Panel*/}
        <div className="absolute top-40 right-4 z-[1000]">
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
            <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
              {filteredData.length > 0
                ? filteredData.length
                : allRawData.length}
            </div>
          </button>
        ) : (
          <div className="relative">
            <button
              onClick={() => setIsFilterPanelOpen(false)}
              className="absolute top-2 right-2 z-50 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-full shadow-md transition-all duration-200"
              style={{ width: "24px", height: "24px" }}
            >
              <svg
                className="w-4 h-4"
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
            <FilterPanel
              onFilterChange={handleFilterChange}
              filteredCount={filteredData.length}
              totalCount={allRawData.length}
            />
          </div>
        )}
      </div>

      {/*Panel Overlay*/}
      <div
        className={`absolute top-4 left-14 z-10 transition-all duration-300 ${
          isPanelMinimized ? "w-16" : "w-80"
        }`}
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
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
            <>
              <div className="p-3 border-b border-gray-200">
                <button
                  onClick={handleResetView}
                  className="w-full bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-all duration-200 font-medium text-sm"
                >
                  Reset Tampilan
                </button>
              </div>

              <div className="p-2 border-b border-gray-200">
                <h3 className="font-medium text-gray-800 mb-1.5 text-xs">
                  Data Pekerjaan
                </h3>
                {loading ? (
                  <div className="flex justify-center items-center h-12">
                    <BeatLoader color="#4A90E2" size={8} />
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="bg-blue-50 p-1 rounded-lg transition-all duration-300 hover:bg-blue-100">
                      <p className="text-xs text-gray-600 mb-1">
                        Total Penduduk 15-64 Tahun
                      </p>
                      <p className="text-xl font-bold text-blue-600">
                        <CountUp
                          end={processedData.totalPenduduk || 0}
                          duration={1.5}
                        />
                      </p>
                      {filteredData.length > 0 && (
                        <p className="text-xs text-gray-500">
                          dari {allRawData.length} total
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-2 border-b border-gray-200">
                <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setCurrentDataKey("jenisKelamin")}
                    className={`px-2 py-2 text-xs font-medium rounded-md transition-all duration-300 ${
                      currentDataKey === "jenisKelamin"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Jenis Kelamin
                  </button>
                  <button
                    onClick={() => setCurrentDataKey("statusPekerjaan")}
                    className={`px-2 py-2 text-xs font-medium rounded-md transition-all duration-300 ${
                      currentDataKey === "statusPekerjaan"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Pekerjaan
                  </button>
                  <button
                    onClick={() => setCurrentDataKey("umur")}
                    className={`px-2 py-2 text-xs font-medium rounded-md transition-all duration-300 ${
                      currentDataKey === "umur"
                        ? "bg-blue-600 text-white shadow-md"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-200"
                    }`}
                  >
                    Umur
                  </button>
                </div>
              </div>

              <div className="p-2 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setChartType("bar")}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300 ${
                      chartType === "bar"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                    }`}
                  >
                    Batang
                  </button>
                  <button
                    onClick={() => setChartType("doughnut")}
                    className={`py-2 px-3 rounded-lg text-xs font-medium transition-all duration-300 ${
                      chartType === "doughnut"
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                    }`}
                  >
                    Lingkaran
                  </button>
                </div>
              </div>

              <div className="p-3">
                <div className="h-56 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 shadow-inner border border-blue-100 transition-all duration-300 hover:shadow-lg">
                  {loading ? (
                    <div className="flex justify-center items-center h-full">
                      <BeatLoader color="#4A90E2" size={8} />
                    </div>
                  ) : (
                    <DemographicsChart
                      chartData={processedData[currentDataKey]}
                      chartType={chartType}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Updated Legend Peta */}
      <div className="absolute bottom-6 left-14 z-[1000]">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 p-2 max-w-[240px] overflow-hidden transition-all duration-300 hover:shadow-3xl">
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-2">
            <div
              className="flex justify-between items-center mb-2 cursor-pointer hover:bg-indigo-100 rounded p-1 transition-colors duration-200"
              onClick={() => setIsLegendMinimized(!isLegendMinimized)}
            >
              <h4 className="text-xs font-semibold text-gray-800 flex items-center">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-2"></span>
                Legend
              </h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLegendMinimized(!isLegendMinimized);
                }}
                className="text-gray-500 hover:text-gray-800 text-sm transition-colors hover:bg-gray-200 rounded px-1"
              >
                {isLegendMinimized ? "▲" : "▼"}
              </button>
            </div>

            {!isLegendMinimized && (
              <div className="space-y-2">
                {/* Updated legend with only two colors */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{
                        backgroundColor: employmentColors["tidak bekerja"],
                      }}
                    ></div>
                    <span className="text-xs text-gray-700">Tidak Bekerja</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded border border-gray-300"
                      style={{ backgroundColor: employmentColors["bekerja"] }}
                    ></div>
                    <span className="text-xs text-gray-700">Bekerja</span>
                  </div>
                </div>

                <div className="bg-blue-50 rounded p-2 border border-blue-200 mt-3">
                  <div className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Area:</span>
                      <span className="font-medium text-blue-700 truncate ml-1">
                        {selectedAreaTitle}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data:</span>
                      <span className="font-medium text-blue-700">
                        {processedData.totalPenduduk || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* AI Insight Box at the bottom middle */}
      <AIInsightBox 
        featureName={selectedAreaTitle}
        contextType="pekerjaan"
        data={{
          totalPenduduk: filteredData.length,
          dominanPekerjaan: filteredData.length > 0 
            ? (Object.entries(
                filteredData.reduce((acc, curr) => {
                  const status = categorizeEmploymentStatus(curr.status_pekerjaan_utama);
                  acc[status] = (acc[status] || 0) + 1;
                  return acc;
                }, {})
              ).sort((a, b) => b[1] - a[1])[0] || [])[0] || "Tidak diketahui"
            : "Tidak ada data",
          lakiLaki: filteredData.filter(d => (d.jenis_kelamin || "").toLowerCase() === "laki-laki").length,
          perempuan: filteredData.filter(d => (d.jenis_kelamin || "").toLowerCase() === "perempuan").length
        }}
      />

    </div>
  );
};

export default memo(Dashboard);
