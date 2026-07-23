import React, { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

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

const CustomMapControls = ({ activeBasemap, setActiveBasemap, children, onLayerOpenChange }) => {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);
  const controlRef = useRef(null);

  useEffect(() => {
    if (controlRef.current) {
      const el = controlRef.current;
      L.DomEvent.disableScrollPropagation(el);
      const stop = (e) => L.DomEvent.stopPropagation(e);
      L.DomEvent.on(el, 'mousedown touchstart dblclick', stop);
      return () => {
        L.DomEvent.off(el, 'mousedown touchstart dblclick', stop);
      };
    }
  }, []);

  return (
    <div ref={controlRef} className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-3 pointer-events-none">
      
      {/* Basemap Dropdown */}
      <div className="relative pointer-events-auto">
         {isOpen && (
           <div 
             className="absolute top-0 right-full mr-2 w-40 bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-gray-100 overflow-hidden transform origin-top-right transition-all"
             onMouseDown={(e) => e.stopPropagation()}
             onMouseUp={(e) => e.stopPropagation()}
             onPointerDown={(e) => e.stopPropagation()}
             onPointerUp={(e) => e.stopPropagation()}
             onDoubleClick={(e) => e.stopPropagation()}
             onClick={(e) => e.stopPropagation()}
           >
             <div className="p-1.5 space-y-0.5">
               <div className="px-2 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5 border-b border-gray-100 pb-1.5">
                 Pilih Peta Dasar
               </div>
               {mapOptions.map(opt => (
                 <button 
                   key={opt.name} 
                   onClick={(e) => { 
                     e.preventDefault();
                     e.stopPropagation(); 
                     setActiveBasemap(opt); 
                     setIsOpen(false);
                     if (onLayerOpenChange) onLayerOpenChange(false);
                   }}
                   className={`w-full text-left px-2 py-2 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${activeBasemap.name === opt.name ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                 >
                   {activeBasemap.name === opt.name ? (
                     <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                     </svg>
                   ) : (
                     <svg className="w-4 h-4 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                       <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                     </svg>
                   )}
                   <span className="truncate">{opt.name}</span>
                 </button>
               ))}
             </div>
           </div>
         )}
         <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const nextState = !isOpen;
            setIsOpen(nextState);
            if (onLayerOpenChange) onLayerOpenChange(nextState);
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onMouseUp={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          title="Pilih Peta Dasar"
          className="w-8 h-8 bg-white/95 backdrop-blur-xl hover:bg-white text-gray-700 rounded-lg shadow-lg border border-gray-100 flex items-center justify-center transition-all hover:shadow-xl active:scale-95"
        >
          <span className="material-icons text-blue-600 text-[18px]">layers</span>
        </button>
      </div>

      {/* Zoom Controls */}
      <div className="flex flex-col bg-white/90 backdrop-blur-md rounded-lg shadow-lg overflow-hidden border border-gray-100 pointer-events-auto">
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomIn(); }} 
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors border-b border-gray-200 font-bold text-lg leading-none active:bg-gray-200"
          title="Zoom In"
        >
          +
        </button>
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); map.zoomOut(); }} 
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 text-gray-700 hover:text-blue-600 transition-colors font-bold text-xl leading-none active:bg-gray-200"
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
