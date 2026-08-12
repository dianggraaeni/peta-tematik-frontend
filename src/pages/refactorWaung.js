const fs = require('fs');

const filePath = 'D:/Documents/Internship/BPS Sidoarjo/desa-cantik/peta-tematik-frontend/src/pages/DetailWaung.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Import RightSidebar
if (!content.includes('RightSidebar')) {
  content = content.replace(
    "import AIInsightBox from '../components/AIInsightBox';",
    "import AIInsightBox from '../components/AIInsightBox';\nimport RightSidebar from '../components/RightSidebar';"
  );
}

// 2. Add state isSidebarOpen and remove isPanelMinimized
content = content.replace(
  "const [isPanelMinimized, setIsPanelMinimized] = useState(false);",
  "const [isSidebarOpen, setIsSidebarOpen] = useState(true);"
);

// Remove isPanelMinimized from dependencies of useEffect if any. But wait, it's not a dependency.

// Replace return statement
const returnStart = content.indexOf('return (');
const preReturn = content.substring(0, returnStart);

// We need to extract the exact LEFT FLOATING PANEL content for the RightSidebar.
// It's under "<!-- LEFT FLOATING PANEL (Charts) -->"
const chartsRegex = /\{\/\* LEFT FLOATING PANEL \(Charts\) \*\/\}.*?<div className="p-4 overflow-y-auto no-scrollbar">\s*(\{selectedRT && selT1 \? [\s\S]*?)\s*<\/div>\s*\)\}\s*<\/div>/;
const chartsMatch = content.match(chartsRegex);
const chartsContent = chartsMatch ? chartsMatch[1] : '';

// Map Content (everything inside <MapContainer> ... </MapContainer>)
const mapContainerRegex = /(<MapContainer[\s\S]*?<\/MapContainer>)/;
const mapMatch = content.match(mapContainerRegex);
const mapContent = mapMatch ? mapMatch[1] : '';

// Not Active map message
const notActiveMsgRegex = /(\{\(\!activeThemes\.includes\("Sosial Kependudukan"\) && activeThemes\.length > 0\) \? \([\s\S]*?\) : null\})/;
const notActiveMatch = content.match(notActiveMsgRegex);
const notActiveMsg = notActiveMatch ? notActiveMatch[1] : '';

// Filter Panel
const filterPanelRegex = /\{\/\* RIGHT FLOATING PANEL \(Filter\)[\s\S]*?(<div className="absolute top-44 right-4 z-\[1000\] pointer-events-auto">[\s\S]*?<\/div>\s*)\s*\}\s*<\/div>/;
// Let's just extract it via simple match or string index
const filterPanelStart = content.indexOf('{/* RIGHT FLOATING PANEL (Filter)');
let filterPanelEnd = content.indexOf('{/* AI INSIGHT - inside map, bottom right */}');
let filterPanelContent = content.substring(filterPanelStart, filterPanelEnd).trim();

// AI Insight
const aiInsightStart = content.indexOf('{/* AI INSIGHT - inside map, bottom right */}');
const aiInsightEnd = content.lastIndexOf('</div>');
let aiInsightContent = content.substring(aiInsightStart, aiInsightEnd).trim();

const newReturn = `return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-200 font-sans relative">
      <style>{\`
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
        .no-scrollbar::-webkit-scrollbar { width: 3px; }
        .no-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .no-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 2px; }
      \`}</style>
      
      {/* ── MAIN MAP AREA ── */}
      <div className="flex-grow relative h-full">
        \${notActiveMsg}
        
        \${mapContent}

        {/* Floating controls that STAY ON THE MAP (Top Left) */}
        <div className="absolute top-3 left-3 z-[1000] pointer-events-auto flex flex-col gap-2">
          {/* RIGHT FLOATING PANEL (Filter) moved to Top Left */}
          \${filterPanelContent.replace('absolute top-44 right-4', 'relative').replace('absolute top-0 right-full mr-2', 'absolute top-0 left-full ml-2')}
        </div>

        {!isSidebarOpen && (
           <button onClick={() => setIsSidebarOpen(true)} className="absolute top-1/2 right-0 z-[1000] bg-white p-2 rounded-l-lg shadow-md pointer-events-auto">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
           </button>
        )}

        \${aiInsightContent}
      </div>

      <RightSidebar 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        desaName="WAUNG" 
        themeName="SOSIAL KEPENDUDUKAN" 
        themeIcon="/pict/des-can.png"
      >
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar">
          \${chartsContent}
        </div>
      </RightSidebar>
    </div>
  );
}`;

content = preReturn + newReturn;

// Fix missing dependencies or states if any. 

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done refactoring DetailWaung.jsx');
