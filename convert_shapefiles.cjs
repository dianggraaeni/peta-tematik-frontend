const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data detail kecamatan');
const outDir = path.join(__dirname, 'public/data');

const dirs = fs.readdirSync(dataDir).filter(f => fs.statSync(path.join(dataDir, f)).isDirectory());

for (const dir of dirs) {
  const dirPath = path.join(dataDir, dir);
  const files = fs.readdirSync(dirPath);
  const shpFile = files.find(f => f.toLowerCase().endsWith('.shp'));
  
  if (shpFile) {
    const inputPath = path.join(dirPath, shpFile);
    const outFileName = `kecamatan_${dir.toLowerCase()}.geojson`;
    const outputPath = path.join(outDir, outFileName);
    
    console.log(`Converting ${dir}/${shpFile} to ${outFileName}...`);
    try {
      execSync(`npx mapshaper "${inputPath}" -proj wgs84 -o "${outputPath}" format=geojson`, { stdio: 'inherit' });
      console.log(`Success: ${outFileName}`);
    } catch (e) {
      console.error(`Failed for ${dir}:`, e.message);
    }
  }
}
