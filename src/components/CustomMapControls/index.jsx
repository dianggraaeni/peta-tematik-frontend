import React, { useState, useEffect } from 'react';
import { useMap } from 'react-leaflet';

export const mapOptions = [
  { 
    name: 'OpenStreetMap', 
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors",
    maxZoom: 19
  },
  { 
    name: 'Peta Satelit', 
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: "Tiles &copy; Esri &mdash; Source: Esri",
    maxZoom: 19
  },
  { 
    name: 'Peta Topografi', 
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: "Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap",
    maxZoom: 17
  }
];

export const useBasemap = () => {
  const [activeBasemap, setActiveBasemap] = useState(() => {
    const saved = localStorage.getItem("activeBasemap");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const exists = mapOptions.find(o => o.name === parsed.name);
        return exists || mapOptions[0];
      } catch(e) {}
    }
    return mapOptions[0];
  });

  useEffect(() => {
    localStorage.setItem("activeBasemap", JSON.stringify(activeBasemap));
  }, [activeBasemap]);

  return [activeBasemap, setActiveBasemap];
};

const CustomMapControls = ({ activeBasemap, setActiveBasemap, children }) => {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Basemap Dropdown */}
      <div className="relative pointer-events-auto">
         {isOpen && (
           <div className="absolute top-0 right-full mr-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right transition-all">
             <div className="p-2 space-y-1">
               <div className="px-3 py-1 text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 border-b border-gray-100 pb-2">
                 Pilih Peta Dasar
               </div>
               {mapOptions.map(opt => (
                 <button 
                   key={opt.name} 
                   onClick={(e) => { 
                     e.stopPropagation(); 
                     setActiveBasemap(opt); 
                     setIsOpen(false); 
                   }}
                   className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 ${activeBasemap.name === opt.name ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                 >
                   {activeBasemap.name === opt.name ? (
                     <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                     </svg>
                   ) : (
                     <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                     </svg>
                   )}
                   {opt.name}
                 </button>
               ))}
             </div>
           </div>
         )}
         <button 
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 bg-white/95 backdrop-blur-xl hover:bg-white text-gray-700 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:shadow-xl active:scale-95"
        >
          <span className="material-icons text-blue-600">layers</span>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-100 pointer-events-auto">
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomIn(); }} 
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors border-b border-gray-200 font-bold text-xl"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); map.zoomOut(); }} 
          className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors font-bold text-2xl leading-none pb-1"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Children elements (e.g. Filter button) stacked here */}
      {children}
    </div>
  );
};

export default CustomMapControls;
