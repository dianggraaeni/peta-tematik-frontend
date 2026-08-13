import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import CustomMapControls, { useBasemap } from "../CustomMapControls";
import "leaflet/dist/leaflet.css";
import CountUp from "react-countup";
import { BeatLoader } from "react-spinners";
import L from "leaflet";
import { fetchVillageDataForKecamatan } from "../../utils/openDataApi";
import { useNavigate } from "react-router-dom";
import RightSidebar from "../RightSidebar";

// ===========================================
// AUTO ZOOM
// ===========================================
const AutoZoom = ({ geojsonData, hasData }) => {
  const map = useMap();
  useEffect(() => {
    if (geojsonData && map) {
      const tempLayer = L.geoJSON(geojsonData);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        const isMobile = window.innerWidth < 768;
        map.fitBounds(bounds, {
          paddingTopLeft: isMobile || !hasData ? [20, 20] : [340, 50], // Account for the 320px left panel on desktop if data exists
          paddingBottomRight: [50, 50],
          maxZoom: 14,
        });
      }
    }
  }, [geojsonData, map, hasData]);
  return null;
};

// ===========================================
// CHOROPLETH COLORS
// ===========================================
const getKepadatanColor = (jumlah, max) => {
  if (!jumlah || jumlah === 0) return "#3b82f6"; // solid blue instead of pale blue
  const ratio = jumlah / max;
  if (ratio > 0.8) return "#1e3a8a";
  if (ratio > 0.6) return "#1d4ed8";
  if (ratio > 0.4) return "#3b82f6";
  if (ratio > 0.2) return "#60a5fa";
  return "#93c5fd";
};

// ===========================================
// MAIN COMPONENT
// ===========================================
const getDesaName = (props) => {
  let name = props.nama_desa || props.nmdesa || props.NMDESA || props.NAMOBJ || props.WADMKD || props.DESA || props.KELURAHAN || props.Desa || "Tanpa Nama";
  if (!name.toLowerCase().startsWith("desa ") && !name.toLowerCase().startsWith("kelurahan ")) {
    name = "Desa " + name;
  }
  return name;
};

const DetailKecamatanMap = ({ kecamatanSlug, kecamatanName }) => {
  const navigate = useNavigate();
  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedDesa, setSelectedDesa] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const [hoveredDesa, setHoveredDesa] = useState(null);
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [loading, setLoading] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const geoJsonRef = useRef(null);

  const [fetchedApiData, setFetchedApiData] = useState(null);

  // Determine if we should show dummy data (only if API fails and it's buduran/balongbendo)
  const isDummyData = !fetchedApiData && (kecamatanSlug === 'balongbendo' || kecamatanSlug === 'buduran');

  // Population data per desa
  const desaStats = useMemo(() => {
    if (!geojsonData) return {};
    const stats = {};
    
    geojsonData.features.forEach((f, i) => {
      const name = getDesaName(f.properties);
      const plainName = name.replace(/^Desa\s+/i, '').replace(/^Kelurahan\s+/i, '').toLowerCase();
      
      // Try to find real API data for this village
      const realData = fetchedApiData ? fetchedApiData.find(d => d.desa === plainName) : null;
      
      if (realData) {
        stats[name] = {
          total: realData.total,
          laki: realData.L,
          perempuan: realData.P,
          kk: Math.round(realData.total / 3.8), // Estimated KK
          rjk: realData.P > 0 ? Math.round((realData.L / realData.P) * 100) : 0,
          luas: f.properties.luas ? (f.properties.luas * 111 * 111).toFixed(2) : 0,
        };
      } else if (isDummyData) {
        // Fallback to dummy data
        const base = 1500 + (i * 317 + 421) % 3500;
        const laki = Math.round(base * (0.48 + Math.random() * 0.04));
        const perempuan = base - laki;
        stats[name] = {
          total: base,
          laki,
          perempuan,
          kk: Math.round(base / 3.8),
          rjk: Math.round((laki / perempuan) * 100),
          luas: f.properties.luas ? (f.properties.luas * 111 * 111).toFixed(2) : 0,
        };
      } else {
        // No data available
        stats[name] = {
          total: 0,
          laki: 0,
          perempuan: 0,
          kk: 0,
          rjk: 0,
          luas: 0,
        };
      }
    });
    return stats;
  }, [geojsonData, kecamatanSlug, fetchedApiData, isDummyData]);

  const maxPenduduk = useMemo(() => {
    return Math.max(...Object.values(desaStats).map((d) => d.total), 1);
  }, [desaStats]);

  const totalKecamatan = useMemo(() => {
    const all = Object.values(desaStats);
    return {
      total: all.reduce((s, d) => s + d.total, 0),
      laki: all.reduce((s, d) => s + d.laki, 0),
      perempuan: all.reduce((s, d) => s + d.perempuan, 0),
      kk: all.reduce((s, d) => s + d.kk, 0),
      jumlahDesa: all.length,
    };
  }, [desaStats]);

  const hasData = useMemo(() => {
    return Object.values(desaStats).some(d => d.total > 0);
  }, [desaStats]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    Promise.all([
      fetch(`/data/kecamatan_${kecamatanSlug}.geojson`).then((res) => {
        if (!res.ok) throw new Error("GeoJSON not found");
        return res.json();
      }),
      fetchVillageDataForKecamatan(kecamatanName)
    ])
    .then(([geoData, apiData]) => {
      if (isMounted) {
        setGeojsonData(geoData);
        if (apiData && apiData.length > 0) {
          setFetchedApiData(apiData);
        } else {
          setFetchedApiData(null);
        }
        setLoading(false);
      }
    })
    .catch((err) => {
      if (isMounted) {
        console.error("Error loading data:", err);
        setLoading(false);
      }
    });

    return () => { isMounted = false; };
  }, [kecamatanSlug, kecamatanName]);

  const getStyle = useCallback(
    (feature) => {
      const name = getDesaName(feature.properties);
      const stat = desaStats[name];
      const hasData = stat && stat.total > 0;
      const isSelected = selectedDesa === name;
      const isHovered = hoveredDesa === name;
      
      return {
        fillColor: hasData ? getKepadatanColor(stat.total, maxPenduduk) : "#3b82f6",
        fillOpacity: isSelected ? 0.8 : isHovered ? 0.7 : 0.5,
        color: isSelected ? "#1e3a8a" : isHovered ? (hasData ? "#3b82f6" : "#9ca3af") : "#ffffff",
        weight: isSelected ? 3 : isHovered ? 2.5 : 1.5,
      };
    },
    [desaStats, maxPenduduk, selectedDesa, hoveredDesa]
  );

  const onEachFeature = useCallback(
    (feature, layer) => {
      const name = getDesaName(feature.properties);
      const stat = desaStats[name];

      const tooltipContent = `<div style="font-family:sans-serif;padding:6px 10px;border-radius:8px;font-size:13px;">
          <b style="color:#1e3a8a">${name}</b>
        </div>`;

      layer.bindTooltip(tooltipContent, { sticky: true, className: "custom-tooltip" });

      layer.on({
        mouseover: (e) => {
          setHoveredDesa(name);
          e.target.setStyle({
            fillOpacity: 0.7,
            color: (stat && stat.total > 0) ? "#3b82f6" : "#9ca3af",
            weight: 2.5,
          });
        },
        mouseout: (e) => {
          setHoveredDesa(null);
          if (geoJsonRef.current) geoJsonRef.current.resetStyle(e.target);
        },
        click: (e) => {
          if (stat && stat.total > 0) {
            setSelectedDesa((prev) => (prev === name ? null : name));
          }
          // Efek zoom saat desa diklik
          const layer = e.target;
          if (layer && layer._map) {
            const isMobile = window.innerWidth < 768;
            layer._map.flyToBounds(layer.getBounds(), {
              paddingTopLeft: isMobile || !(stat && stat.total > 0) ? [20, 20] : [340, 50],
              paddingBottomRight: [50, 50],
              maxZoom: 15,
              duration: 1.0 // animasi
            });
          }
        },
      });
    },
    [desaStats]
  );

  const selectedStat = selectedDesa ? desaStats[selectedDesa] : null;

  // Basemap tiles
  const basemapTiles = {
    standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    satellite:
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    topo: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <BeatLoader color="#3b82f6" size={14} />
          <p className="mt-3 text-blue-700 font-semibold text-sm">
            Memuat peta {kecamatanName}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full h-full overflow-hidden">
      <style>{`
        .leaflet-control-zoom {
          border: none !important;
          border-radius: 12px !important;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
          display: flex;
          flex-direction: column;
          margin-right: 1rem !important;
          margin-bottom: 1rem !important;
          overflow: hidden !important;
          background-color: white !important;
        }
        .leaflet-control-zoom-in, .leaflet-control-zoom-out {
          background-color: white !important;
          color: #374151 !important;
          border: none !important;
          width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: 400 !important;
          font-size: 1.25rem !important;
          transition: background-color 0.15s !important;
        }
        .leaflet-control-zoom-in {
          border-bottom: 1px solid #f3f4f6 !important;
        }
        .leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
          background-color: #f9fafb !important;
        }
        .leaflet-control-attribution { display: none !important; }
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      `}</style>
      {/* =========================================
          MAP CONTAINER
      ========================================= */}
      <div className="flex-grow relative h-full">
      <MapContainer
        center={[-7.4, 112.6]}
        zoom={12}
        minZoom={11}
        maxBounds={[[-8.0, 112.0], [-7.0, 113.5]]}
        maxBoundsViscosity={1.0}
        className="w-full h-full absolute inset-0 z-0"
        zoomControl={false}
      >
        <TileLayer
          url={basemapTiles[activeBasemap] || basemapTiles.standard}
          attribution="&copy; OpenStreetMap contributors"
        />

        {geojsonData && (
          <>
            <AutoZoom geojsonData={geojsonData} hasData={hasData} />
            <GeoJSON
              key={`${kecamatanSlug}-${JSON.stringify(selectedDesa)}-${JSON.stringify(hoveredDesa)}`}
              ref={geoJsonRef}
              data={geojsonData}
              style={getStyle}
              onEachFeature={onEachFeature}
            />
          </>
        )}

        <CustomMapControls
          activeBasemap={activeBasemap}
          setActiveBasemap={setActiveBasemap}
          isLayerOpen={isLayerOpen}
          setIsLayerOpen={setIsLayerOpen}
        />
        
        {/* Hint */}
        {(!selectedDesa && hasData) && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-xs text-gray-600 border border-gray-200">
              Klik desa untuk melihat detail statistik
            </div>
          </div>
        )}
      </MapContainer>

      {/* ── TOP BAR OVERLAY ── */}
      <div className="absolute top-3 left-3 z-[1000] flex items-start gap-2 pointer-events-none">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="shrink-0 pointer-events-auto w-11 h-11 bg-white rounded-2xl shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50 transition-colors"
          title="Kembali ke Peta Statistik"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        {/* Title Card */}
        <div className="bg-white rounded-2xl shadow-md px-4 py-2.5 flex flex-col justify-center shrink-0 pointer-events-auto">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none mb-1">Kecamatan</div>
          <div className="font-extrabold text-sm text-gray-800 leading-none">{kecamatanName}</div>
        </div>
      </div>
      
      </div> {/* End map area */}

      {/* =========================================
          RIGHT SIDEBAR
      ========================================= */}
      <RightSidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} desaName={kecamatanName.toUpperCase()} themeName="DETAIL KECAMATAN">
        {hasData ? (
          <>
            {/* Kecamatan Summary */}
            <div className="bg-blue-50 rounded-xl px-3 py-2.5">
              <div className="text-[10px] text-blue-500 font-bold uppercase">Total Populasi</div>
              <div className="font-extrabold text-lg text-blue-800 leading-tight">
                <CountUp end={totalKecamatan.total} duration={1.5} separator="." />
                <span className="text-sm font-semibold ml-1 text-blue-600">Jiwa</span>
              </div>
              <div className="text-[10px] text-blue-400 mt-0.5">{totalKecamatan.jumlahDesa} desa/kelurahan</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-sky-50 rounded-xl px-3 py-2">
                <div className="text-[10px] text-sky-500 font-bold">Laki-laki</div>
                <div className="font-bold text-sm text-sky-800">
                  <CountUp end={totalKecamatan.laki} duration={1.5} separator="." />
                </div>
              </div>
              <div className="bg-pink-50 rounded-xl px-3 py-2">
                <div className="text-[10px] text-pink-500 font-bold">Perempuan</div>
                <div className="font-bold text-sm text-pink-800">
                  <CountUp end={totalKecamatan.perempuan} duration={1.5} separator="." />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl px-3 py-2">
              <div className="text-[10px] text-gray-400 font-bold uppercase">Kepala Keluarga</div>
              <div className="font-bold text-sm text-gray-700">
                <CountUp end={totalKecamatan.kk} duration={1.5} separator="." />
              </div>
            </div>

            {/* Selected Desa Detail */}
            {selectedDesa && selectedStat ? (
              <div className="bg-white border border-gray-100 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-blue-900 text-xs">{selectedDesa}</h3>
                  <button onClick={() => setSelectedDesa(null)} className="text-gray-400 hover:text-gray-600">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
                <div className="space-y-1 mb-3">
                  {[
                    { label: "Jumlah Penduduk", val: selectedStat.total, unit: "jiwa", color: "#1d4ed8" },
                    { label: "Laki-laki", val: selectedStat.laki, unit: "jiwa", color: "#4361ee" },
                    { label: "Perempuan", val: selectedStat.perempuan, unit: "jiwa", color: "#f72585" },
                    { label: "Kepala Keluarga", val: selectedStat.kk, unit: "KK", color: "#7c3aed" },
                    { label: "Rasio J.K.", val: selectedStat.rjk, unit: "", color: "#0891b2" },
                  ].map(({ label, val, unit, color }) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-gray-50">
                      <span className="text-[10px] text-gray-500">{label}</span>
                      <span className="text-[10px] font-bold" style={{ color }}>
                        <CountUp end={val} duration={1} separator="." />
                        {unit && <span className="font-normal ml-0.5">{unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
                <button 
                  onClick={() => navigate(`/detail-desa/${kecamatanSlug}/${selectedDesa.replace(/^(Desa|Kelurahan)\s+/i, '').toLowerCase().replace(/\s+/g, '-')}`)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors flex justify-center items-center gap-1"
                >
                  Lihat Detail Desa
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            ) : (
              <div>
                <p className="text-[10px] text-gray-400 mb-2 font-bold uppercase tracking-wider">Daftar Desa</p>
                <div className="space-y-0.5">
                  {geojsonData && geojsonData.features.map((f, i) => {
                    const name = getDesaName(f.properties);
                    const stat = desaStats[name];
                    return (
                      <button
                        key={`${name}-${i}`}
                        onClick={() => setSelectedDesa(name)}
                        className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                      >
                        <span className="text-[11px] text-gray-700 group-hover:text-blue-800 font-medium">{name}</span>
                        <span className="text-[10px] text-gray-400 group-hover:text-blue-600">{stat ? stat.total.toLocaleString("id-ID") : "-"}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-xs text-gray-400 py-4">Data tidak tersedia</div>
        )}
      </RightSidebar>

    </div>
  );
};

export default DetailKecamatanMap;
