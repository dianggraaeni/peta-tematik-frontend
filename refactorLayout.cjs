const fs = require('fs');

function refactorMapFile(filePath, titlePrefix) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Replace the outer wrapper
  content = content.replace(
    /<div\\s+className="relative h-full w-full overflow-hidden"\\s+style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}\\s*>/g,
    `<div className="min-h-screen bg-slate-50 flex flex-col font-inter overflow-x-hidden">
        {/* Header Info */}
        <div className="text-center shrink-0 z-10 mt-4 md:mt-6 flex flex-col items-center px-4">
          <div className="animate-float">
            <p className="font-bold tracking-[0.3em] uppercase text-base md:text-lg mb-1 typewriter-text-custom" style={{ color: "#2563eb", opacity: 1 }}>
              Jelajahi
            </p>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-3 tracking-tight leading-none animate-color-shift cursor-default">
            ${titlePrefix} Desa {desaName || "Sidoarjo"}
          </h1>
          <p className="italic text-sm sm:text-base md:text-lg font-medium m-0" style={{ color: "black", opacity: 1 }}>
            Arahkan kursor ke wilayah untuk melihat informasi singkat
          </p>
        </div>`
  );

  // 2. Replace the absolute inset-0 z-0 map wrapper
  content = content.replace(
    /<div className="absolute inset-0 z-0">/g,
    `{/* Map Container */}
        <div 
          className="flex-1 w-full relative z-0 min-h-[500px] px-4 md:px-12 pb-4 flex flex-col mt-6" 
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex-1 w-full bg-gray-300/60 border-[3px] border-gray-400/40 rounded-2xl overflow-hidden shadow-sm relative backdrop-blur-sm">`
  );

  // 3. Update MapContainer props
  // We use string replacement to be extremely safe about react-leaflet MapContainer
  let mapContainerMatch = content.match(/<MapContainer[\\s\\S]*?zoomControl={false}\\s*>/);
  if (mapContainerMatch) {
     let newMapContainer = mapContainerMatch[0].replace(
         /style={{ height: "100%", width: "100%" }}/,
         `maxBounds={[[-7.65, 112.5], [-7.3, 112.85]]}
              maxBoundsViscosity={1.0}
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "transparent", zIndex: 0 }}`
     );
     content = content.replace(mapContainerMatch[0], newMapContainer);
  }

  // 4. Update the Panel Overlay max height
  content = content.replace(
    'w-80 max-h-[calc(100vh-130px)] flex flex-col',
    'w-80 max-h-[85%] flex flex-col'
  );

  // 5. Fix closing divs
  // The original file ended with:
  //         </div>
  //       </div>
  //     );
  //   };
  // We replaced one div with two divs for the map wrapper, so we need one extra closing div.
  content = content.replace(
    /<\/div>\\s*<\/div>\\s*\\);\\s*};/g,
    '      </div>\n      </div>\n    </div>\n  );\n};\n'
  );

  fs.writeFileSync(filePath, content);
}

refactorMapFile('src/components/PetaPekerjaan/index.jsx', 'Peta Pekerjaan');
refactorMapFile('src/components/PetaUMKM/index.jsx', 'Peta UMKM');

console.log("Refactoring complete");
