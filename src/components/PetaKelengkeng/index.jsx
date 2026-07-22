/* eslint-disable no-undef */
/* eslint-disable react/jsx-no-undef */
/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useRef, memo, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  LayersControl,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import CustomMapControls, { useBasemap } from "../CustomMapControls";
import AIInsightBox from "../AIInsightBox";
import "leaflet/dist/leaflet.css";
import L, { divIcon } from "leaflet";
import { Transition } from "@headlessui/react";
import api6 from "../../utils/api6.js";
import { message } from "antd";
import CountUp from "react-countup";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { BeatLoader } from "react-spinners";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import * as turf from "@turf/turf";

export default function MapSection() {
  const [selectedClassification, setSelectedClassification] = useState("all");
  const [selectedtUsaha, setSelectedtUsaha] = useState("all");
  const [mapInstance, setMapInstance] = useState(null);
  const [isDataOpen, setIsDataOpen] = useState(false);
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(true);
  const [isFetched, setIsFetched] = useState(false);
  const [data, setData] = useState([]);
  const [dataAgregat, setDataAgregat] = useState({});
  const [dataRumahTangga, setDataRumahTangga] = useState([]);
  const [selectedRT, setSelectedRT] = useState("desa");
  const [loading, setLoading] = useState(false);
  const [filteredData, setFilteredData] = useState(
    data ? (data.length > 0 ? data[0] : {}) : {}
  );
  const [showRT, setShowRT] = useState(true);
  const [showIndividu, setIndividu] = useState(true);
  const [visualization, setVisualization] = useState("umkm");
  const toggleRT = () => setShowRT(!showRT);
  const changeVisualization = (type) => setVisualization(type);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await api6.get("/api/peta?nmdesa=SIMOKETAWANG");
      const features = response.data.features || [];
      const rawPolygons = features.filter(f => f.geometry && f.geometry.type !== "Point");
      
      const seenRt = new Set();
      const polygons = [];
      rawPolygons.forEach(f => {
        // Ensure rt and rw exist in lowercase for compatibility
        if (f.properties.RT) f.properties.rt = f.properties.RT;
        if (f.properties.RW) f.properties.rw = f.properties.RW;
        
        // Ensure kode exists
        if (!f.properties.kode && f.properties.rt) {
          f.properties.kode = f.properties.rt;
        }

        const rtKey = f.properties.rt || "unknown_rt";
        if (!seenRt.has(rtKey)) {
          seenRt.add(rtKey);
          polygons.push(f);
        }
      });

      const formattedData = polygons.map(f => {

        // Count businesses inside this polygon dynamically
        const rt = f.properties.rt;
        const rw = f.properties.rw;
        let count = 0;
        
        // Find points that belong to this RT/RW using spatial join
        features.forEach(pt => {
          if (pt.geometry && pt.geometry.type === "Point" && pt.properties.marker_type === "Kelengkeng") {
            try {
              if (turf.booleanPointInPolygon(pt, f)) {
                const pohon = Number.parseInt(pt.properties.jumlah_pohon) || 0;
                count += pohon > 0 ? pohon : 1; // if jumlah_pohon is 0 or missing, at least count it as 1 to avoid 0 if it exists
              }
            } catch (e) {}
          }
        });
        f.properties.jml_unit_usaha_klengkeng = count;

        return {
          type: "FeatureCollection",
          features: [f]
        };
      });
      
      // Sort by RT ascending
      formattedData.sort((a, b) => {
        const rtA = parseInt(a.features[0].properties.rt) || 0;
        const rtB = parseInt(b.features[0].properties.rt) || 0;
        return rtA - rtB;
      });
      
      setData(formattedData);
    } catch (error) {
      message.error(`Terjadi kesalahan muat peta: ${error.message}`, 5);
    } finally {
      setLoading(false);
    }
  };

  const fetchDataAgregat = async () => {
    // Will be calculated dynamically after RumahTangga is fetched
  };

  const fetchDataRumahTangga = async () => {
    setLoading(true);
    try {
      const response = await api6.get("/api/peta?nmdesa=SIMOKETAWANG");
      const features = response.data.features || [];
      const polygons = features.filter(f => f.geometry && f.geometry.type !== "Point");

      const points = features
        .filter(f => f.geometry && f.geometry.type === "Point" && f.properties.marker_type === "Kelengkeng")
        .filter(f => {
          const lng = f.geometry.coordinates[0];
          const lat = f.geometry.coordinates[1];
          // Simoketawang rough bounds
          return lng >= 112.58 && lng <= 112.62 && lat >= -7.46 && lat <= -7.43;
        })
        .map(f => {
          let assignedRt = null;
          try {
            const matchingPoly = polygons.find(poly => turf.booleanPointInPolygon(f, poly));
            if (matchingPoly) {
              assignedRt = matchingPoly.properties.RT || matchingPoly.properties.rt;
            }
          } catch(e) {}

          return {
            ...f.properties,
            rt: assignedRt,
            latitude: f.geometry.coordinates[1],
            longitude: f.geometry.coordinates[0],
          };
        });
      setDataRumahTangga(points);
      
      // Calculate Aggregates
      let jmlPohon = 0;
      let belum = 0;
      let sudah = 0;
      points.forEach(item => {
        const pohon = Number.parseInt(item.jumlah_pohon) || 0;
        const volume = Number.parseFloat(item.volume_produksi) || 0;
        jmlPohon += pohon;
        if (volume > 0) sudah += pohon;
        else belum += pohon;
      });
      
      setDataAgregat({
        jml_pohon: jmlPohon,
        jml_pohon_blm_berproduksi: belum,
        jml_pohon_sdh_berproduksi: sudah
      });

    } catch (error) {
      message.error(`Terjadi kesalahan muat kelengkeng: ${error.message}`, 5);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isFetched) {
      setLoading(true);
      Promise.all([fetchData(), fetchDataAgregat(), fetchDataRumahTangga()])
        .then(() => setIsFetched(true))
        .catch((error) => {
          message.error(`Terjadi kesalahan: ${error.message}`, 5);
        })
        .finally(() => setLoading(false));
    }
  }, [isFetched]);

  // Function to determine style based on feature properties
  const getStyle = (data) => {
    const density = data.features[0].properties.jml_unit_usaha_klengkeng || 0;
    return {
      fillColor: getColor(density),
      weight: 1,
      opacity: 1,
      color: "#1e293b",
      dashArray: "",
      fillOpacity: density > 0 ? 0.7 : 0.2,
    };
  };

  const getColor = (density) => {
    return density >= 50
      ? "#022c22" // emerald 950
      : density >= 35
      ? "#047857" // emerald 700
      : density >= 20
      ? "#10b981" // emerald 500
      : density >= 10
      ? "#34d399" // emerald 400
      : density >= 1
      ? "#6ee7b7" // emerald 300
      : "rgba(16, 185, 129, 0.1)"; // transparent
  };

  const markerIcon = divIcon({
    className: "custom-marker-icon",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: #10b981; border-radius: 9999px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 2px solid white;">
        <span class="material-icons" style="color: white; font-size: 18px;">park</span>
      </div>
    `,
  });

  let selectedLayer = null; // Track the currently selected layer

  const onEachFeature = (feature, layer) => {
    layer.on({
      mouseover: (e) => {
        const layer = e.target;
        if (layer !== selectedLayer) {
          layer.setStyle({
            weight: 2,
            color: "#1e293b",
            dashArray: "",
            fillOpacity: 0.7,
          });
        }

        const keysLayer = ["RT", "RW", "Dusun", "Jumlah Usaha"];
        const keysToShow = ["rt", "rw", "dusun", "jml_unit_usaha_klengkeng"];

        const popupContent = `<div>
        <strong>Informasi RT:</strong><br>
        ${keysToShow
          .map(
            (key, index) =>
              `${keysLayer[index]}: ${feature.properties[key] || "N/A"}`
          )
          .join("<br>")}
      </div>`;

        const popup = layer
          .bindPopup(popupContent, {
            autoPan: false,
          })
          .openPopup(e.latlng);

        popup.setLatLng(e.latlng);
      },

      mouseout: (e) => {
        const layer = e.target;
        if (layer !== selectedLayer) {
          layer.setStyle({
            weight: 1,
            color: "#1e293b",
            dashArray: "",
            fillOpacity: 0.5,
          });
        }
        layer.closePopup();
      },

      click: (e) => {
        const layer = e.target;

        // Reset previous selected layer style
        if (selectedLayer) {
          selectedLayer.setStyle({
            weight: 2,
            color: "#1e293b",
            dashArray: "",
            fillOpacity: 0.5,
          });
        }

        // Set the current layer as the selected layer
        if (selectedLayer === layer) {
          selectedLayer = null;
          setSelectedRT("desa");
        } else {
          selectedLayer = layer;
          setSelectedRT(feature.properties.kode);
          layer.setStyle({
            weight: 4,
            color: "#1e293b",
            dashArray: "",
            fillOpacity: 0.7, // Ensure opacity is set to 0.7 when clicked
          });
        }
      },
    });
  };

  useEffect(() => {
    if (data && data.length > 0) {
      // Periksa apakah data ada dan tidak kosong
      if (selectedRT === "desa") {
        setFilteredData(data[0]);
      } else {
        const filtered = data.find(
          (item) => item.features[0].properties.kode === selectedRT
        );
        setFilteredData(filtered || data[0]); // Fallback to data[0] if no match is found
      }
    } else {
      // Jika data tidak ada atau kosong, Anda bisa mengatur filteredData ke nilai default
      setFilteredData(null); // Atau data default lainnya jika diperlukan
    }
  }, [selectedRT, data]);

  function capitalizeWords(arr) {
    if (!Array.isArray(arr)) {
      console.error("capitalizeWords expects an array but received:", arr);
      return arr; // Or handle the error as needed
    }

    return arr
      .map((str) => {
        if (typeof str !== "string") {
          str = String(str); // Convert to string if it's not already
        }
        return str
          .split(/[-_/]/) // Pisahkan berdasarkan "-" dan "/"
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      })
      .join(" ") // Combine the processed strings with a space
      .replace(/\s\/\s/, "/"); // Gabungkan kembali "/" tanpa spasi
  }

  function calculateCentroid(geometry) {
    let totalX = 0,
      totalY = 0,
      totalPoints = 0;

    const processRing = (ring) => {
      ring.forEach((coordinate) => {
        totalX += coordinate[0];
        totalY += coordinate[1];
        totalPoints++;
      });
    };

    if (geometry.type === "Polygon") {
      geometry.coordinates.forEach(processRing);
    } else if (geometry.type === "MultiPolygon") {
      geometry.coordinates.forEach((polygon) => {
        polygon.forEach(processRing);
      });
    }

    if (totalPoints === 0) return [0, 0];
    return [totalY / totalPoints, totalX / totalPoints];
  }

  const tempatUsaha = {
    all: "Semua Produk",
    kopi_biji_klengkeng: "Kopi Biji Klengkeng",
    Kerajinan_tangan: "Kerajinan Tangan dari Daun (contoh: pigura, kipas)",
    batik_ecoprint: "Batik Ecoprint",
    minuman: "Minuman Klengkeng (contoh: Susu jelly, sirup)",
    makanan: "Makanan Kelengkeng (Selai, Strudel)",
    tidak_dimanfaatkan: "Tidak Dimanfaatkan",
  };

  const classifications = {
    all: "Semua Jenis",
    jml_pohon_new_crystal: "New Crystal",
    jml_pohon_pingpong: "Pingpong",
    jml_pohon_metalada: "Matalada",
    jml_pohon_diamond_river: "Diamond River",
    jml_pohon_merah: "Merah",
  };

  const variables = {
    jml_pohon_new_crystal: "jml_pohon_new_crystal",
    jml_pohon_pingpong: "jml_pohon_pingpong",
    jml_pohon_metalada: "jml_pohon_metalada",
    jml_pohon_diamond_river: "jml_pohon_diamond_river",
    jml_pohon_merah: "jml_pohon_merah",
  };

  const dataJenis = [
    {
      name: "Belum",
      value: dataAgregat.jml_pohon_blm_berproduksi || 0,
    },
    {
      name: "Sudah",
      value: dataAgregat.jml_pohon_sdh_berproduksi || 0,
    },
  ];

  const handleClassificationChange = (event) => {
    setSelectedClassification(event.target.value);
  };

  const handletUsahaChange = (event) => {
    setSelectedtUsaha(event.target.value);
  };

  const MemoizedGeoJSON = memo(({ data, style, onEachFeature }) => (
    <GeoJSON data={data} style={style} onEachFeature={onEachFeature} />
  ));

  MemoizedGeoJSON.displayName = "MemoizedGeoJSON";

  const filtered = useMemo(() => {
    return dataRumahTangga.filter(
      (item) => {
        // Safe RT check: check rt_rw_dusun, rt, RT, or fallback to true if we don't have that data so markers don't vanish unconditionally
        const rtMatch = selectedRT === "desa" || 
                        (item.rt_rw_dusun && item.rt_rw_dusun.includes(selectedRT)) ||
                        (item.rt && String(item.rt) === selectedRT) ||
                        (item.RT && String(item.RT) === selectedRT) ||
                        (!item.rt_rw_dusun && !item.rt && !item.RT); // If no RT data exists on the point, show it anyway

        // Safe Classification check
        const classMatch = selectedClassification === "all" ||
                           (selectedClassification in variables &&
                            item[variables[selectedClassification]] !== undefined &&
                            item[variables[selectedClassification]] !== 0 &&
                            item[variables[selectedClassification]] !== "0");

        // Safe Pemanfaatan check
        const normalizedItemUsaha = item.pemanfaatan_produk ? item.pemanfaatan_produk.toLowerCase().replace(/\s+/g, '_') : "";
        const normalizedSelectedUsaha = selectedtUsaha.toLowerCase();
        const usahaMatch = selectedtUsaha === "all" || normalizedItemUsaha.includes(normalizedSelectedUsaha);

        return rtMatch && classMatch && usahaMatch;
      }
    );
  }, [dataRumahTangga, selectedRT, selectedClassification, selectedtUsaha]);

  const CustomMarker = memo(
    ({ item }) => (
      <Marker
        position={[parseFloat(item.latitude), parseFloat(item.longitude)]}
        icon={markerIcon}
      >
        <Popup>
          <div className="z-100 min-w-[200px] p-1">
            <strong className="block text-emerald-700 text-base mb-2 border-b pb-1">Informasi Usaha</strong>
            <div className="text-sm space-y-1 text-gray-700">
              <p><b>Jumlah Pohon:</b> {item.jumlah_pohon}</p>
              <p><b>Volume Produksi:</b> {item.volume_produksi} kg</p>
              <p><b>Pemanfaatan Produk:</b><br/>{capitalizeWords(item.pemanfaatan_produk)}</p>
            </div>
          </div>
        </Popup>
      </Marker>
    ),
    []
  );

  CustomMarker.displayName = "CustomMarker";

  const Colors = ["#a7f3d0", "#10b981"]; // Two emerald colors for charts
  const LegendMenu = () => {
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleExpand2 = () => {
      setIsExpanded(!isExpanded);
    };

    return (
      <div className="relative">
        {/* Tombol Simbol Legenda */}
        <button
          onClick={toggleExpand2}
          className={`w-full py-1.5 px-3 rounded-lg flex items-center justify-center focus:outline-none transition-colors shadow-sm border ${
            isExpanded ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-700 hover:bg-gray-100 border-gray-200"
          }`}
          aria-label="Toggle Legend"
        >
          {/* Ikon untuk tombol */}
          <span className="material-icons">legend_toggle</span>
        </button>

        {/* Menu yang akan diperluas ketika tombol diklik */}
        {isExpanded && (
          <div
            className="absolute left-full -bottom-2 ml-3 p-4 w-[20vh] bg-white rounded-md shadow-md text-gray-800"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.8)", // Semi-transparent background
              backdropFilter: "blur(12px)", // Blur effect
            }}
          >
            <div className="mb-1 text-sm font-semibold text-right">
              Jumlah Usaha
            </div>
            <div className="relative h-6 mb-2 rounded-full">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to right, #34d399, #10b981, #059669, #064e3b)",
                  borderRadius: "99px",
                }}
              ></div>
            </div>
            <div className="flex justify-between px-2 mt-1">
              <span className="text-xs">0</span>
              <span className="text-xs">50+</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-inter overflow-x-hidden">
      {/* Header Info */}
      <div className="text-center shrink-0 z-10 mt-4 md:mt-6 flex flex-col items-center px-4">
        <div className="animate-float">
          <p className="font-bold tracking-[0.3em] uppercase text-base md:text-lg mb-1 typewriter-text-custom" style={{ color: "#2563eb", opacity: 1 }}>
            Jelajahi
          </p>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight leading-none animate-color-shift cursor-default">
          Peta Potensi Kelengkeng Desa SIMOKETAWANG
        </h1>
        <p className="italic text-sm sm:text-base md:text-lg font-medium m-0" style={{ color: "black", opacity: 1 }}>
          Arahkan kursor ke wilayah untuk melihat informasi singkat
        </p>
      </div>

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
        .leaflet-interactive:focus,
        .leaflet-clickable,
        .leaflet-zoom-animated .leaflet-interactive {
          outline: none !important;
          border: none !important;
        }
      `}</style>

      {/* Map Container */}
      <div 
        className="flex-1 w-full relative z-0 min-h-[500px] px-4 md:px-12 pb-4 flex flex-col mt-6" 
      >
        <div className="flex-1 w-full bg-gray-300/60 border-[3px] border-gray-400/40 rounded-2xl overflow-hidden shadow-sm relative backdrop-blur-sm">
          <div className="absolute top-0 left-0 z-0 w-full h-full font-sfProDisplay">
            <MapContainer
              center={[-7.446033620089397, 112.60262064240202]}
              zoom={16}
              minZoom={12}
              maxBounds={[[-7.65, 112.5], [-7.3, 112.85]]}
              maxBoundsViscosity={1.0}
              scrollWheelZoom={true}
              className="w-full h-full"
              touchZoom={true}
              whenCreated={setMapInstance}
              zoomControl={false}
              doubleClickZoom={true}
            >
          <TileLayer
            url={activeBasemap.url}
            attribution={activeBasemap.attribution}
            maxZoom={activeBasemap.maxZoom}
          />
          <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap}>
            <div className="relative pointer-events-auto">
              <button
                className="w-10 h-10 bg-white/90 backdrop-blur-md hover:bg-white text-gray-700 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:shadow-xl hover:text-emerald-600 active:scale-95"
                onClick={(e) => { e.stopPropagation(); setIsFilterOpen(!isFilterOpen); }}
                title="Filter"
              >
                <span className="material-icons">filter_list</span>
              </button>
              <Transition
                show={isFilterOpen}
                className="absolute top-0 right-full mr-3 z-10 w-64 p-4 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl text-gray-800"
                enter="transition ease-out duration-300"
                enterFrom="opacity-0 transform translate-x-4"
                enterTo="opacity-100 transform translate-x-0"
                leave="transition ease-in duration-200"
                leaveFrom="opacity-100 transform translate-x-0"
                leaveTo="opacity-0 transform translate-x-4"
              >
                <div onClick={(e) => e.stopPropagation()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Tahun
                      </label>
                      <select
                        id="tahun"
                        name="tahun"
                        className="block w-full py-2 px-3 text-sm border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition-colors"
                      >
                        <option value="2024">2024</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        RT
                      </label>
                      <select
                        id="rt"
                        name="rt"
                        className="block w-full py-2 px-3 text-sm border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition-colors"
                        value={selectedRT}
                        onChange={(e) => setSelectedRT(e.target.value)}
                      >
                        <option value="desa">Semua RT</option>
                        {data && data.length > 0 ? (
                          data.map((item) => {
                            const { rt, kode } = item.features[0].properties;
                            return (
                              <option key={rt} value={kode}>
                                {rt}
                              </option>
                            );
                          })
                        ) : (
                          <option value="" disabled>
                            No RT
                          </option>
                        )}
                      </select>
                    </div>
                  </div>

                  <label className="block mt-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Jenis Kelengkeng
                  </label>
                  <select
                    id="jenis"
                    name="jenis"
                    className="block w-full py-2 px-3 text-sm border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition-colors"
                    onChange={handleClassificationChange}
                    value={selectedClassification}
                  >
                    {Object.entries(classifications).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>

                  <label className="block mt-4 text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Pemanfaatan Produk
                  </label>
                  <select
                    id="tUsaha"
                    name="tUsaha"
                    className="block w-full py-2 px-3 text-sm border-gray-200 bg-gray-50 text-gray-800 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 rounded-lg transition-colors"
                    onChange={handletUsahaChange}
                    value={selectedtUsaha}
                  >
                    {Object.entries(tempatUsaha).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </Transition>
            </div>
          </CustomMapControls>
          {data ? (
            data.length > 0 &&
            data.map((geoJsonData, index) => (
              <React.Fragment key={index}>
                <MemoizedGeoJSON
                  key={index}
                  data={geoJsonData}
                  style={getStyle(geoJsonData)}
                  onEachFeature={onEachFeature}
                />
                {showRT && (
                  <Marker
                    key={`marker-${geoJsonData.features[0].properties.kode}`}
                    position={calculateCentroid(
                      geoJsonData.features[0].geometry
                    )}
                    icon={divIcon({
                      className: "custom-label",
                      html: `<div class="w-[75px] text-white text-[0.8rem] font-bold absolute p-2"
                        style="
                          -webkit-text-stroke-width: 0.1px;
                          -webkit-text-stroke-color: black;
                          text-shadow: 1px 1px #000;
                        ">RT ${
                          geoJsonData.features[0].properties.rt || "No label"
                        }</div>`,
                    })}
                  />
                )}
              </React.Fragment>
            ))
          ) : (
            <BeatLoader />
          )}
          {showIndividu && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
              {filtered.map((item, idx) => (
                <CustomMarker key={`marker-individu-${idx}`} item={item} />
              ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>

      <div className="absolute inset-0 pointer-events-none font-sfProDisplay">
        <button
          className="absolute top-4 left-4 z-10 px-6 py-2 bg-white/95 backdrop-blur-xl border border-gray-100 text-gray-700 hover:text-emerald-600 rounded-xl shadow-lg hover:shadow-xl flex items-center pointer-events-auto transition-all font-bold text-sm"
          onClick={() => setIsVisualizationOpen(!isVisualizationOpen)}
        >
          <span className="mr-2 material-icons text-emerald-500">analytics</span>
          Statistik
        </button>

        <Transition
          show={isVisualizationOpen}
          enter="transition ease-out duration-300"
          enterFrom="opacity-0 transform scale-95"
          enterTo="opacity-100 transform scale-100"
          leave="transition ease-in duration-200"
          leaveFrom="opacity-100 transform scale-100"
          leaveTo="opacity-0 transform scale-95"
          className="absolute top-16 left-4 z-10 w-64 max-h-[77vh] p-4 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl text-gray-800 overflow-y-auto pointer-events-auto custom-scrollbar"
        >
          <div className="text-center">
            {filteredData?.features?.[0] ? (
              <>
                {selectedRT !== "desa" ? (
                  <>
                    <div className="mb-4">
                      <p className="bg-gray-100 border border-gray-200 rounded-full p-1.5 text-xs text-gray-700 font-semibold flex items-center">
                        <span className="mr-1 text-emerald-500 material-icons text-sm">
                          location_on
                        </span>
                        RT {filteredData.features[0].properties.rt} RW{" "}
                        {filteredData.features[0].properties.rw} Dsn{" "}
                        {filteredData.features[0].properties.dusun}
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4 text-left shadow-sm">
                      <div className="text-4xl font-black text-emerald-600">
                        <CountUp
                          start={0}
                          end={
                            filteredData.features[0].properties
                              .jml_unit_usaha_klengkeng || 0
                          }
                          duration={3}
                        />
                      </div>
                      <p className="text-xm">Pohon Kelengkeng</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4 text-left shadow-sm">
                      <p className="mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider">Produksi</p>
                      <PieChart width={175} height={175}>
                        <Pie
                          data={[
                            {
                              name: "Belum",
                              value:
                                filteredData.features[0].properties
                                  .jml_pohon_blm_berproduksi || 0,
                            },
                            {
                              name: "Sudah",
                              value:
                                filteredData.features[0].properties
                                  .jml_pohon_sdh_berproduksi || 0,
                            },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={50}
                        >
                          {[
                            {
                              name: "Belum",
                              value:
                                filteredData.features[0].properties
                                  .jml_pohon_blm_berproduksi || 0,
                            },
                            {
                              name: "Sudah",
                              value:
                                filteredData.features[0].properties
                                  .jml_pohon_sdh_berproduksi || 0,
                            },
                          ].map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={Colors[index % Colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{
                            fontSize: "12px",
                            marginTop: "1rem",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        />
                      </PieChart>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="bg-gray-100 border border-gray-200 rounded-full p-1.5 text-xs text-gray-700 font-semibold flex items-center">
                        <span className="mr-1 text-emerald-500 material-icons text-sm">
                          location_on
                        </span>
                        Desa Simoketawang
                      </p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4 text-left shadow-sm">
                      <div className="text-4xl font-black text-emerald-600">
                        <CountUp
                          start={0}
                          end={dataAgregat.jml_pohon || 0}
                          duration={3}
                        />
                      </div>
                      <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mt-1">Pohon Kelengkeng</p>
                    </div>

                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl mb-4 text-left shadow-sm">
                      <p className="mb-2 text-sm font-bold text-gray-500 uppercase tracking-wider">Status Produksi</p>
                      <PieChart width={175} height={175}>
                        <Pie
                          data={dataJenis}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={75}
                          innerRadius={50}
                        >
                          {dataJenis.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={Colors[index % Colors.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          layout="horizontal"
                          align="center"
                          verticalAlign="bottom"
                          wrapperStyle={{
                            fontSize: "12px",
                            marginTop: "2rem",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        />
                      </PieChart>
                    </div>
                  </>
                )}
              </>
            ) : null}
          </div>
        </Transition>
        <div
          className="absolute bottom-4 left-4 z-10 w-auto p-2 bg-white rounded-md shadow-md text-gray-800 pointer-events-auto"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(12px)", // Blur effect
          }}
        >
          <div className="flex flex-col gap-2">
            <button
              className={`py-1.5 px-3 rounded-lg flex items-center gap-1 font-semibold transition-colors shadow-sm border ${
                showRT ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              onClick={toggleRT}
            >
              {showRT ? (
                <div className="flex items-center">
                  <span className="mr-2 text-xl material-icons">
                    visibility
                  </span>{" "}
                  RT
                </div>
              ) : (
                <div className="flex items-center">
                  <span className="mr-2 text-xl material-icons">
                    visibility_off
                  </span>{" "}
                  RT
                </div>
              )}
            </button>
            <LegendMenu />
          </div>
        </div>

        {/* ── AI INSIGHT — inside map, bottom right */}
        <AIInsightBox 
          desaName="Simoketawang"
          featureName={selectedRT === "desa" ? "Semua Wilayah" : `RT ${selectedRT}`}
          contextType="kelengkeng"
          requireClick={true}
          customClass="bottom-4 right-4"
          data={dataAgregat}
        />
      </div>
      </div>
      </div>
    </div>
  );
}
