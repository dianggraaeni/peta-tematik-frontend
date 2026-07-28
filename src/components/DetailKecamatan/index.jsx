import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import CustomMapControls, { useBasemap } from "../CustomMapControls";
import "leaflet/dist/leaflet.css";
import CountUp from "react-countup";
import { BeatLoader } from "react-spinners";
import L from "leaflet";

// ===========================================
// AUTO ZOOM
// ===========================================
const AutoZoom = ({ geojsonData }) => {
  const map = useMap();
  useEffect(() => {
    if (geojsonData && map) {
      const tempLayer = L.geoJSON(geojsonData);
      const bounds = tempLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
      }
    }
  }, [geojsonData, map]);
  return null;
};

// ===========================================
// CHOROPLETH COLORS
// ===========================================
const getKepadatanColor = (jumlah, max) => {
  if (!jumlah || jumlah === 0) return "#e5e7eb";
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
const DetailKecamatanMap = ({ kecamatanSlug, kecamatanName }) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [selectedDesa, setSelectedDesa] = useState(null);
  const [hoveredDesa, setHoveredDesa] = useState(null);
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [loading, setLoading] = useState(true);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const geoJsonRef = useRef(null);

  // Dummy population data per desa (since no API - illustrative)
  const desaStats = useMemo(() => {
    if (!geojsonData) return {};
    const stats = {};
    geojsonData.features.forEach((f, i) => {
      const name = f.properties.nama_desa;
      // Simulate realistic population data
      const base = 1500 + (i * 317 + 421) % 3500;
      const laki = Math.round(base * (0.48 + Math.random() * 0.04));
      const perempuan = base - laki;
      stats[name] = {
        total: base,
        laki,
        perempuan,
        kk: Math.round(base / 3.8),
        rjk: Math.round((laki / perempuan) * 100),
        luas: (f.properties.luas * 111 * 111).toFixed(2), // rough km²
      };
    });
    return stats;
  }, [geojsonData]);

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

  useEffect(() => {
    setLoading(true);
    fetch(`/data/kecamatan_${kecamatanSlug}.geojson`)
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading GeoJSON:", err);
        setLoading(false);
      });
  }, [kecamatanSlug]);

  const getStyle = useCallback(
    (feature) => {
      const name = feature.properties.nama_desa;
      const stat = desaStats[name];
      const isSelected = selectedDesa === name;
      const isHovered = hoveredDesa === name;
      return {
        fillColor: getKepadatanColor(stat?.total || 0, maxPenduduk),
        fillOpacity: isSelected ? 0.95 : isHovered ? 0.85 : 0.7,
        color: isSelected ? "#1e3a8a" : isHovered ? "#3b82f6" : "#ffffff",
        weight: isSelected ? 3 : isHovered ? 2.5 : 1.5,
      };
    },
    [desaStats, maxPenduduk, selectedDesa, hoveredDesa]
  );

  const onEachFeature = useCallback(
    (feature, layer) => {
      const name = feature.properties.nama_desa;
      const stat = desaStats[name];

      layer.bindTooltip(
        `<div style="font-family:sans-serif;padding:6px 10px;border-radius:8px;font-size:13px;">
          <b style="color:#1e3a8a">${name}</b><br/>
          Penduduk: <b>${stat ? stat.total.toLocaleString("id-ID") : "-"} jiwa</b>
        </div>`,
        { sticky: true, className: "custom-tooltip" }
      );

      layer.on({
        mouseover: (e) => {
          setHoveredDesa(name);
          e.target.setStyle({
            fillOpacity: 0.85,
            color: "#3b82f6",
            weight: 2.5,
          });
        },
        mouseout: (e) => {
          setHoveredDesa(null);
          if (geoJsonRef.current) geoJsonRef.current.resetStyle(e.target);
        },
        click: () => {
          setSelectedDesa((prev) => (prev === name ? null : name));
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
    <div className="w-full flex-1 relative flex flex-col min-h-[600px] bg-gray-100">
      {/* =========================================
          MAP CONTAINER
      ========================================= */}
      <MapContainer
        center={[-7.4, 112.6]}
        zoom={12}
        minZoom={12}
        maxBounds={[[-7.65, 112.5], [-7.3, 112.85]]}
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
            <AutoZoom geojsonData={geojsonData} />
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
        {!selectedDesa && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-xs text-gray-600 border border-gray-200">
              Klik desa untuk melihat detail statistik
            </div>
          </div>
        )}
      </MapContainer>

      {/* =========================================
          LEFT PANEL: Stats + Selected Desa Info (Floating)
      ========================================= */}
      <div 
        className={`absolute top-4 left-4 z-[1000] pointer-events-auto transition-all duration-300 ${isPanelMinimized ? "w-10 h-10" : "w-[90vw] md:w-80 max-h-[calc(100vh-100px)]"}`}
      >
        <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col h-full">
          <div 
            className="bg-blue-600 text-white px-3 py-2.5 flex justify-between items-center cursor-pointer hover:bg-blue-700 transition-colors shrink-0"
            onClick={() => setIsPanelMinimized(!isPanelMinimized)}
          >
            <h2 className={`font-bold text-xs md:text-sm truncate ${isPanelMinimized ? "hidden" : "block"}`}>Data Kecamatan</h2>
            <button onClick={(e) => { e.stopPropagation(); setIsPanelMinimized(!isPanelMinimized); }} className="text-white hover:text-gray-200 shrink-0 ml-1" title={isPanelMinimized ? "Buka Panel" : "Tutup Panel"}>
              {isPanelMinimized ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              )}
            </button>
          </div>
          
          {!isPanelMinimized && (
            <div className="overflow-y-auto custom-scrollbar bg-gray-50 flex flex-col" style={{ maxHeight: "calc(100vh - 140px)" }}>
        
        {/* Kecamatan Summary */}
        <div className="p-5 border-b border-gray-100 bg-gradient-to-br from-blue-50 to-white">
          <h2 className="text-blue-900 font-bold text-base mb-1">
            Kecamatan {kecamatanName}
          </h2>
          <p className="text-gray-500 text-xs mb-4">
            {totalKecamatan.jumlahDesa} desa/kelurahan
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Total Penduduk", val: totalKecamatan.total, suffix: " jiwa", color: "text-blue-700" },
              { label: "Kepala Keluarga", val: totalKecamatan.kk, suffix: " KK", color: "text-blue-600" },
              { label: "Laki-laki", val: totalKecamatan.laki, suffix: " jiwa", color: "text-indigo-600" },
              { label: "Perempuan", val: totalKecamatan.perempuan, suffix: " jiwa", color: "text-pink-600" },
            ].map(({ label, val, suffix, color }) => (
              <div key={label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`font-bold text-sm ${color}`}>
                  <CountUp end={val} duration={1.5} separator="." />
                  <span className="font-normal text-xs">{suffix}</span>
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Selected Desa Detail */}
        {selectedDesa && selectedStat ? (
          <div className="p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-blue-900 text-sm">
                Desa {selectedDesa}
              </h3>
              <button
                onClick={() => setSelectedDesa(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Tutup"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="space-y-2 mb-4">
              {[
                { label: "Jumlah Penduduk", val: selectedStat.total, unit: "jiwa", color: "#1d4ed8" },
                { label: "Laki-laki", val: selectedStat.laki, unit: "jiwa", color: "#4361ee" },
                { label: "Perempuan", val: selectedStat.perempuan, unit: "jiwa", color: "#f72585" },
                { label: "Kepala Keluarga", val: selectedStat.kk, unit: "KK", color: "#7c3aed" },
                { label: "Rasio Jenis Kelamin", val: selectedStat.rjk, unit: "", color: "#0891b2" },
              ].map(({ label, val, unit, color }) => (
                <div key={label} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className="text-xs font-bold" style={{ color }}>
                    <CountUp end={val} duration={1} separator="." />
                    {unit && <span className="font-normal ml-1">{unit}</span>}
                  </span>
                </div>
              ))}
            </div>

            {/* Mini Bar Chart - Gender Distribution */}
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500 mb-2 font-semibold">Distribusi Jenis Kelamin</p>
              <div className="flex h-5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 transition-all duration-700"
                  style={{ width: `${(selectedStat.laki / selectedStat.total) * 100}%` }}
                />
                <div
                  className="bg-pink-400 flex-1"
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-indigo-600">
                  ♂ {((selectedStat.laki / selectedStat.total) * 100).toFixed(1)}%
                </span>
                <span className="text-pink-500">
                  ♀ {((selectedStat.perempuan / selectedStat.total) * 100).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Daftar Desa List */
          <div className="p-4 flex-1">
            <p className="text-xs text-gray-400 mb-3 font-semibold uppercase tracking-wider">
              Daftar Desa / Kelurahan
            </p>
            <div className="space-y-1">
              {geojsonData &&
                geojsonData.features.map((f) => {
                  const name = f.properties.nama_desa;
                  const stat = desaStats[name];
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedDesa(name)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-left group"
                    >
                      <span className="text-xs text-gray-700 group-hover:text-blue-800 font-medium">
                        {name}
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-blue-600">
                        {stat ? stat.total.toLocaleString("id-ID") : "-"}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
        </div>
      )}
      </div>
    </div>

      {/* =========================================
          LEGEND (Floating Right)
      ========================================= */}
      <div className={`absolute top-4 right-16 z-[1000] pointer-events-auto transition-all duration-300 ${isLegendMinimized ? 'w-8 h-8' : 'w-52'} ${isLayerOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'} bg-white/95 backdrop-blur-xl shadow-xl rounded-xl border border-gray-200 overflow-hidden`}>
        <div 
          className={`font-bold text-gray-800 ${isLegendMinimized ? 'p-0 h-full flex justify-center items-center cursor-pointer' : 'p-3 pb-2 border-b border-gray-100 text-xs flex justify-between items-center cursor-pointer hover:bg-gray-50'}`} 
          onClick={() => setIsLegendMinimized(!isLegendMinimized)}
        >
          {!isLegendMinimized && <span>Legenda Kepadatan</span>}
          <button title={isLegendMinimized ? "Buka Legenda" : "Tutup Legenda"} className="text-gray-500 hover:text-gray-800">
            {isLegendMinimized ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            )}
          </button>
        </div>
        {!isLegendMinimized && (
          <div className="p-3 pt-2 text-[10px] space-y-1">
            {[
              { color: "#1e3a8a", label: "> 80% tertinggi" },
              { color: "#1d4ed8", label: "60–80%" },
              { color: "#3b82f6", label: "40–60%" },
              { color: "#60a5fa", label: "20–40%" },
              { color: "#93c5fd", label: "< 20% terendah" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-sm border border-gray-300 shadow-sm shrink-0" style={{ backgroundColor: color }}></div>
                <span className="text-gray-700">{label}</span>
              </div>
            ))}
            
            {/* Area Data Box */}
            <div className="bg-blue-50 rounded p-1.5 border border-blue-200 mt-3">
              <div className="flex justify-between items-center"><span className="text-gray-600">Area:</span><span className="font-medium text-blue-700 truncate ml-1 max-w-[100px]" title={hoveredDesa || selectedDesa || "Pilih Area"}>{hoveredDesa || selectedDesa || "Pilih Area"}</span></div>
              <div className="flex justify-between items-center mt-0.5"><span className="text-gray-600">Penduduk:</span><span className="font-medium text-blue-700">{hoveredDesa || selectedDesa ? (desaStats[hoveredDesa || selectedDesa]?.total.toLocaleString('id-ID') || 0) : "-"}</span></div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DetailKecamatanMap;
