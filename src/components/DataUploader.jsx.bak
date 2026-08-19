import React, { useState, useRef } from 'react';
import { Button, Card, CardBody, CardHeader, Select, SelectItem, Spinner } from '@nextui-org/react';
import { message } from 'antd';
import { FaUpload, FaDownload, FaFileExcel, FaFileCode, FaInfoCircle, FaTrash } from 'react-icons/fa';
import api6 from '../utils/api6';
import * as XLSX from 'xlsx';

const DataUploader = ({ nama_desa }) => {
  const [file, setFile] = useState(null);
  const [dataType, setDataType] = useState('keluarga');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const dataTypes = [
    { value: 'keluarga', label: 'Data Keluarga' },
    { value: 'sanitasi_air', label: 'Data Sanitasi atau Air' },
    { value: 'kelompok_umur', label: 'Kelompok Umur' },
    { value: 'pekerjaan', label: 'Data Pekerjaan' },
    { value: 'umkm', label: 'Data UMKM' },
    { value: 'pertanian_usahasayuran', label: 'Data Usaha Pertanian / Kelengkeng' },
    { value: 'pertanian_aggregate', label: 'Data Agregat Pertanian (Grogol)' },
    { value: 'geojson', label: 'Batas Wilayah (GeoJSON)' }
  ];

  // Standar kolom wajib untuk Auto-Extract (huruf kecil semua)
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
    'umkm': ['rt', 'rw', 'nama_usaha', 'dusun', 'jml_ruta', 'jml_umkm'],
    'pertanian_usahasayuran': [
      'kode', 'kodesls', 'rt_rw_dusun', 'nama_kepala_keluarga', 'alamat', 
      'latitude', 'longitude', 'jml_pohon', 'jml_pohon_new_crystal', 
      'jml_pohon_pingpong', 'jml_pohon_metalada', 'jml_pohon_diamond_river', 
      'jml_pohon_merah', 'volume_produksi', 'pemanfaatan_produk', 'catatan', 'url_img'
    ],
    'pertanian_aggregate': ['rt_rw_dusun', 'jumlah_ruta', 'volume_produksi']
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownloadTemplate = () => {
    if (dataType === 'geojson') {
      message.info('Batas Wilayah menggunakan format .json (GeoJSON), bukan Excel.');
      return;
    }
    const cols = requiredColumns[dataType] || ['rt', 'rw'];
    
    // Buat worksheet kosong hanya dengan header
    const ws = XLSX.utils.json_to_sheet([], { header: cols });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_${dataType}_${nama_desa || 'Desa'}.xlsx`);
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning('Pilih file terlebih dahulu!');
      return;
    }
    
    setLoading(true);
    
    try {
      let jsonData;

      if (dataType === 'geojson') {
        if (!file.name.endsWith('.json')) {
           message.error('Format Batas Wilayah (GeoJSON) harus berupa file .json!');
           setLoading(false);
           return;
        }
        const text = await file.text();
        try {
          jsonData = JSON.parse(text);
        } catch (err) {
          message.error('File JSON tidak valid!');
          setLoading(false);
          return;
        }
      } else {
        // Untuk data tabel: Terima .xlsx atau .csv
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv') && !file.name.endsWith('.xls')) {
           message.error('Gunakan file Excel (.xlsx / .xls) atau CSV!');
           setLoading(false);
           return;
        }

        const dataBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(dataBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const reqCols = requiredColumns[dataType] || ['rt', 'rw'];
        
        // Mode Template Ketat: Asumsikan baris pertama (index 0) adalah header
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { range: 0 });

        if (rawJsonData.length === 0) {
           message.error('File Excel kosong atau format tidak sesuai.');
           setLoading(false);
           return;
        }
        
        // Auto-Extract: Normalisasi nama kolom (huruf kecil & hapus spasi berlebih)
        const normalizedData = rawJsonData.map(row => {
           let newRow = {};
           for (let key in row) {
              newRow[key.toString().toLowerCase().trim()] = row[key];
           }
           return newRow;
        });

        // Cek kolom wajib pada baris pertama yang dinormalisasi
        const firstRow = normalizedData[0] || {};
        const missingCols = reqCols.filter(col => !(col.toLowerCase() in firstRow));
        
        if (missingCols.length > 0) {
           message.error({
             content: `Format tidak sesuai template! Kolom yang hilang: ${missingCols.join(', ')}. Silakan unduh template yang disediakan.`,
             duration: 8,
           });
           setLoading(false);
           return;
        }

        // Bersihkan data: HANYA ambil kolom yang diwajibkan
        if (dataType === 'keluarga') {
           jsonData = normalizedData.map(row => ({
              rt: row['rt/rw'],
              jumlah_keluarga: row['jumlah keluarga'],
              rata_anggota: row['rata-rata anggota keluarga'] || 0,
              rata_luas_lantai: row['rata-rata luas lantai'] || 0
           })).filter(row => row.rt && row.rt.toLowerCase() !== 'grand total');
        } else if (dataType === 'sanitasi_air') {
           jsonData = normalizedData.map(row => {
              let cleanRow = { rt: row['rt/rw'], lantai: {}, dinding: {}, atap: {} };
              for (let key in row) {
                 if (key.startsWith('lantai ')) cleanRow.lantai[key.replace('lantai ', '').replace(/ /g, '_')] = row[key] || 0;
                 else if (key.startsWith('dinding ')) cleanRow.dinding[key.replace('dinding ', '').replace(/ /g, '_')] = row[key] || 0;
                 else if (key.startsWith('atap ')) cleanRow.atap[key.replace('atap ', '').replace(/ /g, '_')] = row[key] || 0;
              }
              return cleanRow;
           }).filter(row => row.rt && row.rt.toLowerCase() !== 'grand total');
        } else {
           jsonData = normalizedData.map(row => {
              let cleanRow = {};
              reqCols.forEach(col => {
                 cleanRow[col] = row[col.toLowerCase()];
              });
              return cleanRow;
           });
        }
      }

      // Kirim data bersih ke backend
      // 1. Simpan ke JSON village-data (untuk statistik Ringkasan dsb)
      await api6.post('/api/village-data', {
        desa_name: nama_desa,
        dataType: dataType,
        data: jsonData
      });

      // 2. Jika tipe data adalah Pekerjaan, simpan juga secara massal ke tabel MySQL Pekerjaan (untuk Peta)
      if (dataType === 'pekerjaan') {
        message.loading({ content: 'Memasukkan data ke Peta Pekerjaan...', key: 'pekerjaanUpload' });
        let successCount = 0;
        for (let i = 0; i < jsonData.length; i++) {
           const item = jsonData[i];
           const cleanItem = {
             nmdesa: nama_desa, // attach village name automatically
             rt: parseInt(item.rt) || 0,
             rw: parseInt(item.rw) || 0,
             umur: parseInt(item.umur) || 0,
             jenis_kelamin: item.jenis_kelamin,
             status_pekerjaan_utama: item.status_pekerjaan_utama,
             bidang_pekerjaan: item.bidang_pekerjaan,
             nama_anggota: item.nama_anggota || `Warga ${i+1}` // if not provided
           };
           try {
             await api6.post("/api/pekerjaan", cleanItem);
             successCount++;
           } catch (error) {
             console.error("Gagal insert baris", i, error);
           }
        }
        message.success({ content: `Peta Pekerjaan diupdate: ${successCount} data masuk!`, key: 'pekerjaanUpload', duration: 3 });
      }

      message.success(`Data ${dataType} berhasil disimpan! (${jsonData.length || (jsonData.features ? jsonData.features.length : 1)} baris/fitur)`);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(error);
      message.error('Gagal mengunggah data. Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex flex-col items-start gap-1 p-5">
        <h3 className="font-bold text-blue-900 text-lg flex items-center gap-2">
          <FaUpload className="text-blue-600" /> Manajemen File Data
        </h3>
        <p className="text-sm text-blue-700">Unggah file Excel atau CSV untuk memperbarui data desa secara massal. Sistem akan otomatis menyaring dan mengambil data yang relevan.</p>
      </CardHeader>
      
      <CardBody className="p-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-700">1. Pilih Jenis Data</label>
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Select 
              placeholder="Pilih jenis data"
              selectedKeys={[dataType]}
              onChange={(e) => {
                setDataType(e.target.value);
              }}
              className="max-w-xs"
            >
              {dataTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </Select>
            
            {dataType !== 'geojson' && (
              <Button 
                variant="flat" 
                color="primary" 
                startContent={<FaDownload />}
                onClick={handleDownloadTemplate}
                className="font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
              >
                Download Template Excel
              </Button>
            )}
          </div>
        </div>

          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex gap-3 text-amber-800 text-sm items-start">
            <FaInfoCircle className="mt-0.5 shrink-0 text-amber-500" />
            <p>
              <b>Wajib Menggunakan Template:</b> Sistem kini diatur ke Mode Ketat. Pastikan baris pertama (Baris 1) pada file Excel/CSV Anda berisi judul kolom (header) yang <b>SAMA PERSIS</b> dengan template yang bisa diunduh melalui tombol di atas. Jika ejaan atau format header berbeda, data akan otomatis ditolak.
            </p>
          </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-bold text-gray-700">
            2. Unggah File {dataType === 'geojson' ? '(Wajib .json)' : '(Wajib Excel / CSV)'}
          </label>
          {!file ? (
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors border-gray-300">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {dataType === 'geojson' ? (
                     <FaFileCode className="w-10 h-10 mb-3 text-gray-400" />
                  ) : (
                     <FaFileExcel className="w-10 h-10 mb-3 text-gray-400" />
                  )}
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold text-blue-600">Klik untuk mengunggah</span> atau drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    {dataType === 'geojson' ? 'File format GEOJSON (.json)' : 'File format XLSX, XLS, atau CSV'}
                  </p>
                </div>
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept={dataType === 'geojson' ? '.json' : '.xlsx, .xls, .csv'}
                  onChange={handleFileChange}
                  className="hidden" 
                />
              </label>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full p-4 border border-blue-200 bg-blue-50/70 rounded-xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-white rounded-lg shadow-sm border border-blue-100">
                  {dataType === 'geojson' ? (
                     <FaFileCode className="w-6 h-6 text-blue-500" />
                  ) : (
                     <FaFileExcel className="w-6 h-6 text-blue-500" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-blue-900 text-sm truncate max-w-[200px] sm:max-w-xs">{file.name}</span>
                  <span className="text-xs text-blue-600 font-medium">{(file.size / 1024).toFixed(2)} KB • Menunggu proses ekstrak</span>
                </div>
              </div>
              <Button 
                isIconOnly 
                color="danger" 
                variant="flat" 
                onClick={() => {
                  setFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="hover:bg-red-100"
              >
                <FaTrash />
              </Button>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 flex justify-end">
          <Button 
            color="primary" 
            size="lg"
            onClick={handleUpload} 
            disabled={!file || loading}
            className="w-full sm:w-auto font-bold shadow-lg shadow-blue-500/30"
            startContent={!loading && <FaUpload />}
          >
            {loading ? <Spinner size="sm" color="white" /> : 'Mulai Ekstrak & Simpan Data'}
          </Button>
        </div>
      </CardBody>
    </Card>


    </div>
  );
};

export default DataUploader;
