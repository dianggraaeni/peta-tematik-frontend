const fs = require('fs');
const filePath = 'src/components/PetaSayuran/index.jsx';
let content = fs.readFileSync(filePath, 'utf-8');

if (!content.includes('import RightSidebar')) {
  content = content.replace('import { useNavigate } from "react-router-dom";', 'import { useNavigate } from "react-router-dom";\nimport RightSidebar from "../RightSidebar";');
}

content = content.replace('const [isVisualizationOpen, setIsVisualizationOpen] = useState(true);', 'const [isSidebarOpen, setIsSidebarOpen] = useState(true);');

const match = content.match(/  return \(\s*<>\s*\{\/\* ── TOP BAR OVERLAY ── \*\/\}/);
if (!match) {
  console.log('Return not found!');
  process.exit(1);
}

const beforeReturn = content.slice(0, match.index);
const oldReturn = content.slice(match.index);

const mapStart = oldReturn.indexOf('<MapContainer');
const mapEnd = oldReturn.indexOf('</MapContainer>') + '</MapContainer>'.length;
const mapCode = oldReturn.substring(mapStart, mapEnd);

const filterToggleRegex = /<div className="absolute top-36 right-3 z-\[1000\] pointer-events-auto">[\s\S]*?<\/div>/;
let filterToggleMatch = oldReturn.match(filterToggleRegex);
let filterToggleCode = filterToggleMatch ? filterToggleMatch[0].replace('top-36', 'top-3') : '';

const transitions = oldReturn.match(/<Transition[\s\S]*?<\/Transition>/g);
const filterTransition = transitions ? transitions.find(t => t.includes('show={isFilterOpen}')) : '';
const visualizationTransition = transitions ? transitions.find(t => t.includes('show={isVisualizationOpen}')) : '';

let visualizationContent = '';
if (visualizationTransition) {
  const divStart = visualizationTransition.indexOf('<div className="text-center">');
  const divEnd = visualizationTransition.lastIndexOf('</Transition>');
  visualizationContent = visualizationTransition.substring(divStart, divEnd).trim();
}

const aiInsightMatch = oldReturn.match(/<AIInsightBox[\s\S]*?\/>/);
const aiInsightCode = aiInsightMatch ? aiInsightMatch[0] : '';

const newReturn = `  return (
    <div className="flex w-screen h-screen overflow-hidden bg-gray-200 font-sans relative">
      <div className="flex-grow relative h-full">
        ${mapCode}

        {!hideCards && (
          <div className="absolute inset-0 pointer-events-none font-sfProDisplay">
            ${filterToggleCode}

            ${filterTransition}
            
            ${aiInsightCode}
          </div>
        )}
      </div>

      {!hideCards && (
        <RightSidebar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          desaName={desaName}
          themeName="PETA SAYURAN"
          themeIcon="/pict/des-can.png"
        >
          ${visualizationContent}
        </RightSidebar>
      )}
    </div>
  );
}`;

fs.writeFileSync(filePath, beforeReturn + newReturn);
console.log("Replaced successfully!");
