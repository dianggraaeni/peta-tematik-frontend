const fs = require('fs');
let content = fs.readFileSync('src/components/PetaUMKM/index.jsx', 'utf8');

// 1. Remove CustomMapControls
content = content.replace('<CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} />\\r\\n', '');
content = content.replace('<CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} />\\n', '');
content = content.replace('<CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} />', '');

// 2. Remove AIInsightBox
const aiInsightStart = '{/* AI Insight Box at the bottom middle */}';
const aiInsightEnd = '      />';
const aiStartIndex = content.indexOf(aiInsightStart);
const aiEndIndex = content.indexOf(aiInsightEnd, aiStartIndex) + aiInsightEnd.length;
if (aiStartIndex !== -1) {
  content = content.substring(0, aiStartIndex) + content.substring(aiEndIndex);
}

// 3. Extract FilterPanel
const filterPanelStart = '{/* Filter Panel */}';
const filterPanelEnd = `        )}
      </div>`;
const startIndex = content.indexOf(filterPanelStart);
const endIndex = content.indexOf(filterPanelEnd, startIndex) + filterPanelEnd.length;
let filterPanelContent = content.substring(startIndex, endIndex);

// Remove FilterPanel from original spot
content = content.substring(0, startIndex) + content.substring(endIndex);

// Clean up filter panel
filterPanelContent = filterPanelContent.replace('{/* Filter Panel */}\\r\\n      <div className="absolute top-48 right-4 z-[1000]">', '');
filterPanelContent = filterPanelContent.replace('{/* Filter Panel */}\\n      <div className="absolute top-48 right-4 z-[1000]">', '');
filterPanelContent = filterPanelContent.substring(0, filterPanelContent.lastIndexOf('</div>')).trim();

// 4. Construct Right Side Controls
const rightSideControls = `
            {/* Right Side Controls Container */}
            <div className="absolute right-4 top-4 bottom-6 z-[2000] flex flex-col items-end gap-3 pointer-events-none overflow-y-auto no-scrollbar w-[350px] max-w-[90vw]">
              <CustomMapControls activeBasemap={activeBasemap} setActiveBasemap={setActiveBasemap} customClass="static pointer-events-auto" />

              <div className="pointer-events-auto w-full flex justify-end relative">
` + filterPanelContent + `
              </div>

              <AIInsightBox 
                featureName={selectedAreaTitle}
                contextType="umkm"
                customClass="static mt-auto"
                data={{
                  totalUmkm: processedData.totalUmkm,
                  dominanKbli: getKbliName(processedData.dominantKbli)
                }}
              />
            </div>
          </MapContainer>`;

content = content.replace('          </MapContainer>', () => rightSideControls);

fs.writeFileSync('src/components/PetaUMKM/index.jsx', content);
