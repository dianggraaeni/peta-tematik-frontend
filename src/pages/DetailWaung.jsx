import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, GeoJSON, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import NavbarPetaWaung from '../components/NavbarPeta/waung';
import CustomMapControls, { useBasemap } from '../components/CustomMapControls';
import { Select, SelectItem } from '@nextui-org/react';
import AIInsightBox from '../components/AIInsightBox';

const AutoZoom = ({ geojsonData, selectedRT }) => {
  const map = useMap();
  useEffect(() => {
    if (geojsonData && map) {
      const layer = L.geoJSON(geojsonData);
      map.fitBounds(layer.getBounds(), { padding: [20, 20] });
    }
  }, [geojsonData, map]);
  return null;
};

export default function DetailWaung() {
  const [geojsonData, setGeojsonData] = useState(null);
  const [tabulasi1, setTabulasi1] = useState([]);
  const [tabulasi2, setTabulasi2] = useState([]);
  const [kelompokUmur, setKelompokUmur] = useState([]);
  
  const [activeBasemap, setActiveBasemap] = useBasemap();
  const [colorMode, setColorMode] = useState('keluarga'); // 'keluarga' or 'luas_lantai'
  const [selectedRT, setSelectedRT] = useState(null);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [isLegendMinimized, setIsLegendMinimized] = useState(false);
  const [isFilterMinimized, setIsFilterMinimized] = useState(false);
  const [isLayerOpen, setIsLayerOpen] = useState(false);
  const geoJsonRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resGeo, resT1, resT2, resKU] = await Promise.all([
          fetch('/data/waung/peta_waung.geojson'),
          fetch('/data/waung/tabulasi_1_clean.json'),
          fetch('/data/waung/tabulasi_2_clean.json'),
          fetch('/data/waung/kelompok_umur_clean.json')
        ]);
        
        setGeojsonData(await resGeo.json());
        setTabulasi1(await resT1.json());
        setTabulasi2(await resT2.json());
        setKelompokUmur(await resKU.json());
      } catch (err) {
        console.error("Failed to load Waung data", err);
      }
    };
    fetchData();
  }, []);

  const getKeluargaColor = (jumlah) => {
    if (jumlah > 80) return '#0369a1';
    if (jumlah > 65) return '#0284c7';
    if (jumlah > 55) return '#38bdf8';
    return '#7dd3fc';
  };

  const getLantaiColor = (luas) => {
    if (luas > 150) return '#166534';
    if (luas > 90) return '#15803d';
    if (luas > 75) return '#22c55e';
    return '#86efac';
  };

  const getStyle = (feature) => {
    const rtName = feature.properties.nmsls;
    const isSelected = selectedRT === rtName;
    const t1Data = tabulasi1.find(d => d.rt === rtName);
    
    let fillColor = '#e2e8f0'; 
    if (t1Data) {
      if (colorMode === 'keluarga') {
        fillColor = getKeluargaColor(t1Data.jumlah_keluarga);
      } else {
        fillColor = getLantaiColor(t1Data.rata_luas_lantai);
      }
    }

    return {
      fillColor,
      weight: isSelected ? 3 : 1.5,
      opacity: 1,
      color: isSelected ? '#fbbf24' : '#ffffff',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.9 : 0.7
    };
  };

  const onEachFeature = (feature, layer) => {
    const rtName = feature.properties.nmsls;
    const t1Data = tabulasi1.find(d => d.rt === rtName);
    
    let tooltipContent = `<div style="font-family: 'Inter', sans-serif; text-align: center; padding: 4px;">
      <div style="font-weight: bold; font-size: 14px;">${rtName}</div>`;
    
    if (t1Data) {
      tooltipContent += `<div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #e5e7eb; font-size: 11px; text-align: left;">
        <div style="display: flex; justify-content: space-between;"><span>Keluarga:</span> <strong>${t1Data.jumlah_keluarga}</strong></div>
        <div style="display: flex; justify-content: space-between;"><span>Lantai:</span> <strong>${t1Data.rata_luas_lantai.toFixed(1)} m²</strong></div>
      </div>`;
    }
    tooltipContent += `</div>`;

    layer.bindTooltip(tooltipContent, {
      sticky: true,
      className: 'bg-white border-none rounded-lg shadow-lg'
    });

    layer.on({
      mouseover: (e) => {
        const l = e.target;
        l.setStyle({ weight: 3, color: '#fbbf24', fillOpacity: 0.9, dashArray: '' });
        l.bringToFront();
      },
      mouseout: (e) => {
        if (selectedRT !== rtName) {
          geoJsonRef.current.resetStyle(e.target);
        }
      },
      click: (e) => {
        if (selectedRT === rtName) {
          setSelectedRT(null);
        } else {
          setSelectedRT(rtName);
          const map = e.target._map;
          map.flyToBounds(e.target.getBounds(), { padding: [100, 100], duration: 1 });
        }
      }
    });
  };

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer((layer) => {
        layer.setStyle(getStyle(layer.feature));
        if (layer.feature.properties.nmsls === selectedRT) {
          layer.bringToFront();
        }
      });
    }
  }, [colorMode, selectedRT, tabulasi1]);

  const selT1 = selectedRT ? tabulasi1.find(d => d.rt === selectedRT) : null;
  const selT2 = selectedRT ? tabulasi2.find(d => d.rt === selectedRT) : null;

  let lantaiData = [];
  let atapData = [];

  if (selT2) {
    lantaiData = Object.entries(selT2.lantai).filter(([k, v]) => v > 0).map(([name, value]) => ({ name: name.toUpperCase(), value }));
    atapData = Object.entries(selT2.atap).filter(([k, v]) => v > 0).map(([name, value]) => ({ name: name.toUpperCase(), value }));
  }

  const PIE_COLORS = ['#3b82f6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#8b5cf6'];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 overflow-x-hidden font-sans">
      <NavbarPetaWaung />
      
      {/* Header Matches Sidokepung exactly */}
      <div className="text-center shrink-0 z-10 mt-4 md:mt-6 flex flex-col items-center px-4">
        <p className="font-bold tracking-[0.3em] uppercase text-base md:text-lg mb-1 text-blue-600">
          JELAJAHI
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight leading-none text-gray-900">
          Peta Tematik Desa WAUNG
        </h1>
        <p className="italic text-sm sm:text-base md:text-lg font-medium m-0" style={{ color: "black", opacity: 1 }}>
          Arahkan kursor ke wilayah untuk melihat informasi singkat
        </p>
      </div>

      {/* Wrapper exactly like Sidokepung */}
      <div className="flex-1 w-full relative z-0 min-h-[500px] px-4 md:px-12 pb-4 flex flex-col mt-6">
        <div className="flex-1 w-full bg-gray-300/60 border-[3px] border-gray-400/40 rounded-2xl overflow-hidden shadow-sm relative backdrop-blur-sm">
          
          <MapContainer 
            center={[-7.498, 112.636]} 
            zoom={15} 
            minZoom={14}
            maxZoom={22}
            maxBounds={[[-7.54, 112.63], [-7.48, 112.69]]}
            maxBoundsViscosity={1.0}
            zoomControl={false} 
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "transparent", zIndex: 0 }}
          >
            <TileLayer url={activeBasemap.url} attribution={activeBasemap.attribution} maxZoom={22} />
            <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} isDetail={true} onLayerOpenChange={setIsLayerOpen} />
            {geojsonData && <AutoZoom geojsonData={geojsonData} selectedRT={selectedRT} />}
            {geojsonData && (
              <GeoJSON
                key={`geojson-${geojsonData.features.length}-${tabulasi1.length}-${colorMode}`}
                data={geojsonData}
                onEachFeature={onEachFeature}
                ref={geoJsonRef}
                style={getStyle}
              />
            )}
          </MapContainer>

          {/* LEFT FLOATING PANEL (Charts) */}
          <div className={`absolute top-4 left-4 z-[1000] pointer-events-auto transition-all duration-300 ${isPanelMinimized ? 'w-10 h-10' : 'w-80 md:w-96'} bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 flex flex-col max-h-[85%] overflow-hidden`}>
            <div 
              className={`bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition-colors shrink-0 flex items-center ${isPanelMinimized ? 'w-10 h-10 justify-center p-0 rounded-2xl' : 'px-3 h-12 justify-between rounded-t-2xl'}`}
              onClick={() => setIsPanelMinimized(!isPanelMinimized)}
            >
              <div className={`${isPanelMinimized ? 'hidden' : 'block'}`}>
                <h2 className="font-bold text-sm md:text-base leading-tight">{selectedRT ? `Statistik ${selectedRT}` : "Desa Waung"}</h2>
              </div>
              
              <div className={`flex items-center gap-2 ${isPanelMinimized ? 'm-0 p-0' : ''}`}>
                {selectedRT && !isPanelMinimized && (
                  <button onClick={(e) => { e.stopPropagation(); setSelectedRT(null); }} className="bg-white/20 hover:bg-white/30 p-1 rounded-lg transition-colors" title="Tutup Detail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsPanelMinimized(!isPanelMinimized); }} 
                  className="text-white hover:text-gray-200 shrink-0 flex items-center justify-center w-6 h-6 transition-all"
                  title={isPanelMinimized ? "Buka Panel" : "Tutup Panel"}
                >
                  {isPanelMinimized ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  )}
                </button>
              </div>
            </div>

            {!isPanelMinimized && (
            <div className="p-4 overflow-y-auto no-scrollbar">
              {selectedRT && selT1 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-sky-50 rounded-xl p-3 border border-sky-100 text-center">
                      <p className="text-sky-600 text-[10px] font-bold uppercase">Total Keluarga</p>
                      <p className="text-sky-900 text-2xl font-extrabold">{selT1.jumlah_keluarga}</p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 border border-green-100 text-center">
                      <p className="text-green-600 text-[10px] font-bold uppercase">Rata Anggota</p>
                      <p className="text-green-900 text-2xl font-extrabold">{selT1.rata_anggota.toFixed(1)}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3">
                    <p className="text-center font-bold text-gray-700 text-sm mb-2">Bahan Lantai Dominan</p>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={lantaiData} innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value" label={false}>
                            {lantaiData.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '4px 8px' }} />
                          <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{ fontSize: '10px', lineHeight: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3">
                    <p className="text-center font-bold text-gray-700 text-sm mb-2">Bahan Atap Dominan</p>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={atapData} innerRadius={35} outerRadius={60} paddingAngle={2} dataKey="value" label={false}>
                            {atapData.map((e, i) => <Cell key={i} fill={PIE_COLORS[(i+2) % PIE_COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', padding: '4px 8px' }} />
                          <Legend layout="vertical" verticalAlign="middle" align="right" iconSize={8} wrapperStyle={{ fontSize: '10px', lineHeight: '20px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-3">
                    <p className="text-center font-bold text-gray-700 text-sm mb-4">Distribusi Kelompok Umur</p>
                    <div className="h-[220px] flex w-full">
                      {/* Laki-Laki */}
                      <div className="flex-none flex flex-col" style={{ width: 'calc(50% + 22.5px)' }}>
                        <p className="text-center font-bold text-gray-600 text-[10px] mb-1 pr-[45px]">Laki-laki</p>
                        <div className="flex-1 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...kelompokUmur].reverse()} layout="vertical" margin={{ top: 5, right: 0, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                              <XAxis type="number" reversed domain={[0, Math.max(...kelompokUmur.flatMap(d => [Number(d.domisili_waung_L) || 0, Number(d.domisili_waung_P) || 0]), 1)]} tick={{fontSize: 9}} />
                              <YAxis 
                                type="category" 
                                dataKey="kelompok" 
                                orientation="right" 
                                tick={({x, y, payload}) => (
                                  <text x={x} y={y} dy={3} textAnchor="middle" fill="#374151" fontSize={9} fontWeight={600}>
                                    {payload.value}
                                  </text>
                                )} 
                                tickMargin={22.5}
                                tickSize={0}
                                width={45} 
                                interval={0} 
                                axisLine={false} 
                                tickLine={false} 
                              />
                              <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="domisili_waung_L" name="Laki-Laki" fill="#3b82f6" radius={[4, 0, 0, 4]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Perempuan */}
                      <div className="flex-none flex flex-col" style={{ width: 'calc(50% - 22.5px)' }}>
                        <p className="text-center font-bold text-gray-600 text-[10px] mb-1">Perempuan</p>
                        <div className="flex-1 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[...kelompokUmur].reverse()} layout="vertical" margin={{ top: 5, right: 5, left: 0, bottom: 20 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                              <XAxis type="number" domain={[0, Math.max(...kelompokUmur.flatMap(d => [Number(d.domisili_waung_L) || 0, Number(d.domisili_waung_P) || 0]), 1)]} tick={{fontSize: 9}} />
                              <YAxis type="category" dataKey="kelompok" hide />
                              <Tooltip cursor={{fill: '#f5f5f5'}} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                              <Bar dataKey="domisili_waung_P" name="Perempuan" fill="#ec4899" radius={[0, 4, 4, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 text-center">Silakan klik area RT pada peta untuk melihat detail spesifik per wilayah.</p>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>

          {/* RIGHT FLOATING PANEL (Filter) */}
          <div className={`absolute top-[160px] right-4 z-[1000] pointer-events-auto transition-all duration-300 ${isFilterMinimized ? 'w-8 h-8' : 'w-64 md:w-72'} bg-white/95 backdrop-blur-xl shadow-2xl rounded-xl border border-gray-100 overflow-hidden`}>
            <div 
              className={`font-bold text-gray-800 ${isFilterMinimized ? 'p-0 h-full flex justify-center items-center cursor-pointer' : 'p-3 pb-2 border-b border-gray-100 text-xs flex justify-between items-center cursor-pointer hover:bg-gray-50'}`} 
              onClick={() => setIsFilterMinimized(!isFilterMinimized)}
            >
              {!isFilterMinimized && (
                <div className="flex items-center gap-2 text-blue-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                  <span>Filter Data</span>
                </div>
              )}
              <button title={isFilterMinimized ? "Buka Filter" : "Tutup Filter"} className="text-gray-500 hover:text-gray-800">
                {isFilterMinimized ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                )}
              </button>
            </div>
            
            {!isFilterMinimized && (
              <div className="p-4 flex flex-col gap-4">
                <Select 
                  selectedKeys={[colorMode]}
                  onChange={(e) => setColorMode(e.target.value)}
                  size="sm"
                  className="w-full"
                  aria-label="Pilih Data"
                >
                  <SelectItem key="keluarga" value="keluarga" className="text-sm">Jumlah Keluarga</SelectItem>
                  <SelectItem key="luas_lantai" value="luas_lantai" className="text-sm">Rata-rata Luas Lantai</SelectItem>
                </Select>
                {selectedRT && (
                  <button 
                    onClick={() => { setSelectedRT(null); }}
                    className="w-full py-2 bg-red-50 text-red-600 font-bold rounded-xl text-sm border border-red-100 hover:bg-red-100 transition-colors"
                  >
                    Reset Pilihan RT
                  </button>
                )}
              </div>
            )}
          </div>

          {/* TOP RIGHT FLOATING PANEL (Legend) */}
          <div className={`absolute top-4 right-16 z-[1000] pointer-events-auto transition-all duration-300 ${isLegendMinimized ? 'w-8 h-8' : 'w-48'} ${isLayerOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100 pointer-events-auto'} bg-white/95 backdrop-blur-xl shadow-2xl rounded-xl border border-gray-100 overflow-hidden`}>
            <div 
              className={`font-bold text-gray-800 ${isLegendMinimized ? 'p-0 h-full flex justify-center items-center cursor-pointer' : 'p-3 pb-2 border-b border-gray-100 text-xs flex justify-between items-center cursor-pointer hover:bg-gray-50'}`} 
              onClick={() => setIsLegendMinimized(!isLegendMinimized)}
            >
              {!isLegendMinimized && <span>{colorMode === 'keluarga' ? 'Kepadatan Keluarga' : 'Rata-rata Luas Lantai'}</span>}
              <button title={isLegendMinimized ? "Buka Legenda" : "Tutup Legenda"} className="text-gray-500 hover:text-gray-800">
                {isLegendMinimized ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                )}
              </button>
            </div>
            
            {!isLegendMinimized && (
              <div className="p-3 pt-2 text-[10px]">
                {colorMode === 'keluarga' ? (
                  <>
                    <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-sm bg-[#0369a1] shadow-sm"></span> &gt; 80 Keluarga</div>
                    <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-sm bg-[#0284c7] shadow-sm"></span> 65 - 80 Keluarga</div>
                    <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-sm bg-[#38bdf8] shadow-sm"></span> 55 - 65 Keluarga</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-[#7dd3fc] shadow-sm"></span> &lt; 55 Keluarga</div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-sm bg-[#064e3b] shadow-sm"></span> &gt; 70 m&sup2;</div>
                    <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-sm bg-[#059669] shadow-sm"></span> 50 - 70 m&sup2;</div>
                    <div className="flex items-center gap-2 mb-1"><span className="w-4 h-4 rounded-sm bg-[#34d399] shadow-sm"></span> 30 - 50 m&sup2;</div>
                    <div className="flex items-center gap-2"><span className="w-4 h-4 rounded-sm bg-[#a7f3d0] shadow-sm"></span> &lt; 30 m&sup2;</div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* AI INSIGHT - inside map, bottom right */}
          <AIInsightBox 
            desaName="Waung" 
            featureName={selectedRT} 
            contextType="waung" 
            requireClick={true} 
            customClass="bottom-4 right-4" 
            data={{ rukunTetangga: selectedRT, detail: selectedRT ? processedWaungData.find(d => d.rt === selectedRT) : null }} 
          />

        </div>
      </div>
    </div>
  );
}
