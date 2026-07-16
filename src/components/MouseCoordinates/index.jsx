import React, { useState } from "react";
import { useMapEvents } from "react-leaflet";

const MouseCoordinates = () => {
  const [position, setPosition] = useState({ lat: 0, lng: 0 });

  useMapEvents({
    mousemove(e) {
      setPosition(e.latlng);
    },
  });

  if (position.lat === 0 && position.lng === 0) return null;

  return (
    <div className="absolute bottom-6 left-6 z-[1000] pointer-events-none">
      <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm border border-gray-200 text-xs font-mono text-gray-600 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-blue-500">my_location</span>
        <span>
          Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}
        </span>
      </div>
    </div>
  );
};

export default MouseCoordinates;
