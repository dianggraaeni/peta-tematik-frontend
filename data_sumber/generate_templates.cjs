const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const MENTAH_DIR = path.join(__dirname, 'mentah');
const CLEAN_DIR = path.join(__dirname, 'clean');
const PUBLIC_TEMPLATES_DIR = path.join(__dirname, '..', 'public', 'templates');

if (!fs.existsSync(CLEAN_DIR)) fs.mkdirSync(CLEAN_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_TEMPLATES_DIR)) fs.mkdirSync(PUBLIC_TEMPLATES_DIR, { recursive: true });

const requiredColumns = {
  'keluarga': ['rt/rw', 'jumlah keluarga', 'rata-rata anggota keluarga', 'rata-rata luas lantai'],
  'sanitasi_air': [
    'rt/rw',
    'lantai marmer', 'lantai keramik', 'lantai parket', 'lantai ubin', 'lantai kayu', 'lantai semen', 'lantai bambu', 'lantai tanah', 'lantai lainnya',
    'dinding tembok', 'dinding kawat', 'dinding kayu', 'dinding anyaman bambu', 'dinding batang kayu', 'dinding bambu', 'dinding lainnya',
    'atap beton', 'atap genteng', 'atap seng', 'atap asbes', 'atap bambu', 'atap kayu', 'atap jerami', 'atap lainnya'
  ],
  'kelompok_umur': [
    'kelompok',
    'luar_waung_L', 'luar_waung_P', 'luar_waung_total',
    'domisili_waung_L', 'domisili_waung_P', 'domisili_waung_total'
  ],
  'pekerjaan': ['rt', 'rw', 'umur', 'jenis_kelamin', 'status_pekerjaan_utama', 'bidang_pekerjaan'],
  'umkm': ['rt', 'rw', 'nama_usaha', 'dusun', 'jml_ruta', 'jml_umkm']
};

function generateEmptyTemplates() {
  console.log("Generating empty templates...");
  for (const [type, cols] of Object.entries(requiredColumns)) {
    const ws = xlsx.utils.json_to_sheet([], { header: cols });
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Template");
    xlsx.writeFile(wb, path.join(PUBLIC_TEMPLATES_DIR, `Template_${type}.xlsx`));
    console.log(`- Created Template_${type}.xlsx`);
  }
}

function processWaungData() {
  console.log("\nCleaning Waung raw data...");
  const sourcePath = path.join(MENTAH_DIR, 'Waung', 'Waung_Tabulasi.xlsx');
  
  if (!fs.existsSync(sourcePath)) {
    console.log("- File mentah Waung_Tabulasi.xlsx tidak ditemukan, skip cleaning.");
    return;
  }

  const wb = xlsx.readFile(sourcePath);
  if (wb.SheetNames.includes('tematik')) {
    const rawData = xlsx.utils.sheet_to_json(wb.Sheets['tematik'], { header: 1 });
    let cleanData = [];
    
    for(let i = 2; i < rawData.length; i++) {
        let row = rawData[i];
        if(!row || row.length < 1 || !String(row[0]).includes('RT')) continue;
        
        cleanData.push({
            'rt/rw': row[0],
            'jumlah keluarga': row[1] || 0,
            'rata-rata anggota keluarga': row[5] || 0,
            'rata-rata luas lantai': row[6] || 0
        });
    }

    const wsKeluarga = xlsx.utils.json_to_sheet(cleanData, { header: requiredColumns['keluarga'] });
    const wbKeluarga = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbKeluarga, wsKeluarga, "Keluarga");
    try {
      xlsx.writeFile(wbKeluarga, path.join(CLEAN_DIR, `Clean_Keluarga_Waung.xlsx`));
      console.log(`- Created Clean_Keluarga_Waung.xlsx`);
    } catch(e) { console.error("Could not write Clean_Keluarga_Waung.xlsx (is it open?)", e.message); }
  }

  // 2. Sanitasi Air (dari tabulasi_2_clean.json)
  const sanitasiPath = path.join(__dirname, '..', 'public', 'data', 'waung', 'tabulasi_2_clean.json');
  if (fs.existsSync(sanitasiPath)) {
    const sanitasiData = JSON.parse(fs.readFileSync(sanitasiPath, 'utf8'));
    let cleanSanitasi = sanitasiData.map(item => {
      let row = { 'rt/rw': item.rt };
      for (let k in item.lantai) row['lantai ' + k.replace(/_/g, ' ')] = item.lantai[k];
      for (let k in item.dinding) row['dinding ' + k.replace(/_/g, ' ')] = item.dinding[k];
      for (let k in item.atap) row['atap ' + k.replace(/_/g, ' ')] = item.atap[k];
      return row;
    });
    const wsSanitasi = xlsx.utils.json_to_sheet(cleanSanitasi, { header: requiredColumns['sanitasi_air'] });
    const wbSanitasi = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbSanitasi, wsSanitasi, "Sanitasi Air");
    try {
      xlsx.writeFile(wbSanitasi, path.join(CLEAN_DIR, `Clean_SanitasiAir_Waung.xlsx`));
      console.log(`- Created Clean_SanitasiAir_Waung.xlsx`);
    } catch(e) { console.error("Could not write Clean_SanitasiAir_Waung.xlsx", e.message); }
  }

  // 3. Kelompok Umur (dari kelompok_umur_clean.json)
  const umurPath = path.join(__dirname, '..', 'public', 'data', 'waung', 'kelompok_umur_clean.json');
  if (fs.existsSync(umurPath)) {
    const umurData = JSON.parse(fs.readFileSync(umurPath, 'utf8'));
    const wsUmur = xlsx.utils.json_to_sheet(umurData, { header: requiredColumns['kelompok_umur'] });
    const wbUmur = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wbUmur, wsUmur, "Kelompok Umur");
    try {
      xlsx.writeFile(wbUmur, path.join(CLEAN_DIR, `Clean_KelompokUmur_Waung.xlsx`));
      console.log(`- Created Clean_KelompokUmur_Waung.xlsx`);
    } catch(e) { console.error("Could not write Clean_KelompokUmur_Waung.xlsx", e.message); }
  }
}

function processSidokepungData() {
  console.log("\nCleaning Sidokepung raw data...");
  const sourcePath = path.join(MENTAH_DIR, 'Sidokepung', 'webgis-sidokepung.pekerjaan.csv');
  
  if (!fs.existsSync(sourcePath)) {
    console.log("- File mentah Sidokepung tidak ditemukan, skip cleaning.");
    return;
  }

  const wb = xlsx.readFile(sourcePath, { type: 'file' });
  const rawData = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  
  let cleanData = rawData.map(row => ({
      rt: row['RT'] || 0,
      rw: row['RW'] || 0,
      umur: row['Umur'] || 0,
      jenis_kelamin: row['Jenis Kelamin'] || 'Laki-laki',
      status_pekerjaan_utama: row['Status Pekerjaan Utama'] || 'Tidak Bekerja',
      bidang_pekerjaan: row['Bidang Pekerjaan'] || '-'
  }));

  const ws = xlsx.utils.json_to_sheet(cleanData, { header: requiredColumns['pekerjaan'] });
  const wbOut = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbOut, ws, "Pekerjaan");
  xlsx.writeFile(wbOut, path.join(CLEAN_DIR, `Clean_Pekerjaan_Sidokepung.xlsx`));
  console.log(`- Created Clean_Pekerjaan_Sidokepung.xlsx`);
}

function processSimoanginanginData() {
  console.log("\nCleaning Simoanginangin raw data...");
  const sourcePath = path.join(MENTAH_DIR, 'Simoanginangin', 'Mikro_Data_UMKM_Simoangin-angin.csv');
  
  if (!fs.existsSync(sourcePath)) {
    console.log("- File mentah Simoanginangin tidak ditemukan, skip cleaning.");
    return;
  }

  const wb = xlsx.readFile(sourcePath, { type: 'file' });
  const rawData = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  
  let cleanData = rawData.map(row => {
      let rtrw = String(row['rt_rw_dusun'] || '').split(' ');
      let rt = rtrw[1] || '0';
      let rw = rtrw[3] || '0';
      return {
          rt: rt,
          rw: rw,
          nama_usaha: row['nama_usaha'] || '-',
          dusun: row['rt_rw_dusun'] || '-',
          jml_ruta: row['jml_ruta'] || 1,
          jml_umkm: row['jml_umkm'] || 1
      };
  });

  const ws = xlsx.utils.json_to_sheet(cleanData, { header: requiredColumns['umkm'] });
  const wbOut = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbOut, ws, "UMKM");
  xlsx.writeFile(wbOut, path.join(CLEAN_DIR, `Clean_UMKM_Simoanginangin.xlsx`));
  console.log(`- Created Clean_UMKM_Simoanginangin.xlsx`);
}

function processSimoketawangData() {
  console.log("\nCleaning Simoketawang raw data...");
  const sourcePath = path.join(MENTAH_DIR, 'Simoketawang', 'Mikro_data_Usaha_Kelengkeng_Simoketawang.csv');
  
  if (!fs.existsSync(sourcePath)) {
    console.log("- File mentah Simoketawang tidak ditemukan, skip cleaning.");
    return;
  }

  const wb = xlsx.readFile(sourcePath, { type: 'file' });
  const rawData = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  
  let cleanData = rawData.map(row => {
      // Just preserve everything in lowercase for the template matcher
      let newRow = {};
      for (let k in row) {
          newRow[k.toLowerCase().trim()] = row[k];
      }
      return newRow;
  });

  const ws = xlsx.utils.json_to_sheet(cleanData, { header: requiredColumns['pertanian_usahasayuran'] });
  const wbOut = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wbOut, ws, "Usaha Kelengkeng");
  xlsx.writeFile(wbOut, path.join(CLEAN_DIR, `Clean_UsahaSayuran_Simoketawang.xlsx`));
  console.log(`- Created Clean_UsahaSayuran_Simoketawang.xlsx`);
}

generateEmptyTemplates();
processWaungData();
processSidokepungData();
processSimoanginanginData();
processSimoketawangData();
console.log("\nSemua data berhasil dibersihkan!");
