const XLSX = require('../node_modules/xlsx');
const path = require('path');
const fs = require('fs');

const outDir = __dirname;
const desa = ['waung', 'simoketawang', 'simoanginangin', 'anggaswangi'];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randPick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randRW = () => `00${randInt(1, 4)}`;
const randRT = () => `00${randInt(1, 9)}`;
const randKades = () => randPick(['Pak Slamet', 'Bu Wati', 'Pak Joko', 'Pak Budi', 'Bu Siti', 'Pak Agus']);

const generateData = (type, count, isIncomplete = false) => {
  const data = [];
  for (let i = 1; i <= count; i++) {
    let row = {};
    if (type === 'pekerjaan') {
      row = {
        rt: randRT(), rw: randRW(), umur: randInt(18, 65),
        jenis_kelamin: randPick(['Laki-laki', 'Perempuan']),
        status_pekerjaan_utama: randPick(['Bekerja', 'Tidak Bekerja']),
        bidang_pekerjaan: randPick(['Pertanian', 'Perdagangan', 'Industri']),
        nama_anggota: `Warga ${i}`
      };
      if (isIncomplete) {
        // HAPUS SATU KOLOM FULL UNTUK SEMUA BARIS
        delete row.bidang_pekerjaan;
        delete row.nama_anggota;
      }
    }
    else if (type === 'keluarga') {
      row = {
        'rt/rw': `RT${randRT()}/RW${randRW()}`,
        'jumlah keluarga': randInt(2, 60),
        'rata-rata anggota keluarga': (Math.random() * 3 + 2).toFixed(1),
        'rata-rata luas lantai': randInt(30, 120)
      };
      if (isIncomplete) {
        delete row['rata-rata luas lantai'];
      }
    }
    else if (type === 'sanitasi_air') {
      row = {
        'rt/rw': `RT${randRT()}/RW${randRW()}`,
        'lantai marmer': randInt(0, 5), 'lantai keramik': randInt(10, 50),
        'lantai ubin': randInt(0, 10),
        'dinding tembok': randInt(20, 60), 'dinding kayu': randInt(0, 10),
        'atap beton': randInt(0, 10), 'atap genteng': randInt(20, 70), 'atap seng': randInt(0, 10)
      };
      if (isIncomplete) {
        delete row['lantai ubin'];
        delete row['dinding kayu'];
        delete row['atap beton'];
      }
    }
    else if (type === 'umkm') {
      row = {
        rt: randRT(), rw: randRW(),
        nama_usaha: randPick(['Warung', 'Toko', 'Bengkel']) + ' ' + randKades().split(' ')[1],
        dusun: randPick(['Krajan', 'Kedung']),
        jml_ruta: randInt(1, 3),
        jml_umkm: randInt(1, 3)
      };
      if (isIncomplete) {
        delete row.dusun;
      }
    }
    else if (type === 'pertanian_usahasayuran') {
      row = {
        kode: `0010${i.toString().padStart(2, '0')}`,
        kodesls: '1001',
        rt_rw_dusun: `RT${randRT()}/RW${randRW()} Krajan`,
        nama_kepala_keluarga: randKades(),
        alamat: `Jl. Desa No.${i}`,
        latitude: (-7.46 + Math.random() * 0.02).toFixed(5),
        longitude: (112.65 + Math.random() * 0.02).toFixed(5),
        jml_pohon: randInt(50, 300),
        volume_produksi: randInt(100, 1000),
        pemanfaatan_produk: 'dijual_sendiri'
      };
      if (isIncomplete) {
        delete row.latitude;
        delete row.longitude;
        delete row.alamat;
      }
    }
    else if (type === 'pertanian_aggregate') {
      row = {
        rt_rw_dusun: `RT${randRT()}/RW${randRW()} Krajan`,
        jumlah_ruta: randInt(5, 25),
        volume_produksi: randInt(100, 2000)
      };
      if (isIncomplete) {
        delete row.jumlah_ruta;
      }
    }
    data.push(row);
  }
  return data;
};

const types = [
  { name: 'pekerjaan', count: 300 },
  { name: 'keluarga', count: 120 },
  { name: 'sanitasi_air', count: 120 },
  { name: 'umkm', count: 250 },
  { name: 'pertanian_usahasayuran', count: 180 },
  { name: 'pertanian_aggregate', count: 100 }
];

const targetDir = path.join(__dirname, '../../arsip_data_mentah/Template_Kosong_Untuk_Testing');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

desa.forEach(d => {
  types.forEach(t => {
    // Generate only Incomplete now
    const incData = generateData(t.name, t.count, true);
    const wbInc = XLSX.utils.book_new();
    const wsInc = XLSX.utils.json_to_sheet(incData);
    XLSX.utils.book_append_sheet(wbInc, wsInc, 'Data');
    
    const fileName = `${d}_TIDAK_LENGKAP_${t.name}.xlsx`;
    XLSX.writeFile(wbInc, path.join(targetDir, fileName));
  });
  console.log(`Desa ${d}: File TIDAK_LENGKAP berhasil dibuat ulang (KOLOM HILANG SECARA TOTAL)`);
});
