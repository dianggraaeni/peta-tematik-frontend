import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Card, CardBody, CardHeader, Spinner, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@nextui-org/react';
import { message } from 'antd';
import { FaUpload, FaDownload, FaFileExcel, FaFileCode, FaInfoCircle, FaTrash, FaEye, FaDatabase, FaChartPie, FaTable } from 'react-icons/fa';
import api6 from '../utils/api6';
import * as XLSX from 'xlsx';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import CountUp from 'react-countup';
import DemographicsChart from './PetaPekerjaan/DemographicsChart';

ChartJS.register(ArcElement, Tooltip, Legend);

const requiredColumns = {
  'pekerjaan': ['rt', 'rw', 'umur', 'jenis_kelamin', 'status_pekerjaan_utama', 'bidang_pekerjaan', 'nama_anggota'],
  'keluarga': ['rt/rw', 'jumlah keluarga', 'rata-rata anggota keluarga', 'rata-rata luas lantai'],
  'sanitasi_air': ['rt/rw', 'lantai marmer', 'lantai keramik', 'lantai parket', 'lantai ubin', 'lantai kayu', 'lantai semen', 'lantai bambu', 'lantai tanah', 'lantai lainnya', 'dinding tembok', 'dinding kawat', 'dinding kayu', 'dinding anyaman bambu', 'dinding batang kayu', 'dinding bambu', 'dinding lainnya', 'atap beton', 'atap genteng', 'atap seng', 'atap asbes', 'atap bambu', 'atap kayu', 'atap jerami', 'atap lainnya'],
  'kelompok_umur': ['kelompok', 'luar_waung_L', 'luar_waung_P', 'luar_waung_total', 'domisili_waung_L', 'domisili_waung_P', 'domisili_waung_total'],
  'umkm': ['rt', 'rw', 'nama_usaha', 'dusun', 'jml_ruta', 'jml_umkm'],
  'pertanian_usahasayuran': [
    'kode', 'kodesls', 'rt_rw_dusun', 'nama_kepala_keluarga', 'alamat', 
    'latitude', 'longitude', 'jml_pohon', 'jml_pohon_new_crystal', 
    'jml_pohon_pingpong', 'jml_pohon_metalada', 'jml_pohon_diamond_river', 
    'jml_pohon_merah', 'volume_produksi', 'pemanfaatan_produk', 'catatan', 'url_img'
  ],
  'pertanian_aggregate': ['rt_rw_dusun', 'jumlah_ruta', 'volume_produksi']
};

const UploadCard = ({ title, dataType, nama_desa, color = 'blue' }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const [activeDataCount, setActiveDataCount] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [previewDataGeojson, setPreviewDataGeojson] = useState("");
  const [previewView, setPreviewView] = useState('chart');
  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();

  const isGeojson = dataType === 'geojson';
  const reqCols = requiredColumns[dataType] || ['rt', 'rw'];
  const bgClass = color === 'emerald' ? 'bg-emerald-50 border-emerald-200' : 'bg-blue-50 border-blue-200';
  const textClass = color === 'emerald' ? 'text-emerald-700' : 'text-blue-700';

  const handlePreviewOpen = async () => {
     onOpen();
     if (isGeojson) {
        try {
           setPreviewDataGeojson("Memuat file geojson...");
           const res = await fetch(`/geoJson/${nama_desa.toLowerCase()}.geojson?t=${Date.now()}`);
           const text = await res.text();
           setPreviewDataGeojson(text);
        } catch (e) {
           setPreviewDataGeojson("Gagal memuat file geojson.");
        }
     }
  };

  const checkActiveData = async () => {
    try {
      if (isGeojson) {
         const res = await fetch(`/geoJson/${nama_desa.toLowerCase()}.geojson?t=${Date.now()}`, { method: 'HEAD' });
         if (res.ok) setActiveDataCount('File Peta Tersedia');
         else setActiveDataCount(null);
      } else {
         const res = await api6.get(`/api/village-data/${nama_desa}/${dataType}`);
         if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            setActiveDataCount(`${res.data.length} baris data`);
            setPreviewData(res.data);
         } else {
            setActiveDataCount(null);
            setPreviewData([]);
         }
      }
    } catch (e) {
      setActiveDataCount(null);
      setPreviewData([]);
    }
  };

  const chartData = useMemo(() => {
     if (dataType !== 'pekerjaan' || previewData.length === 0) return null;
     const jkCounts = { 'Laki-laki': 0, 'Perempuan': 0 };
     const statusCounts = {};
     previewData.forEach(row => {
        let jk = (row.jenis_kelamin || "").toLowerCase();
        if (jk.includes('laki') || jk === 'l' || jk === 'pria') jkCounts['Laki-laki']++;
        else if (jk.includes('perempuan') || jk === 'p' || jk === 'wanita') jkCounts['Perempuan']++;
        
        let stat = (row.status_pekerjaan_utama || row.status_pekerjaan || "Tidak Diketahui").trim();
        statusCounts[stat] = (statusCounts[stat] || 0) + 1;
     });
     
     return {
        jk: {
           labels: Object.keys(jkCounts),
           datasets: [{ data: Object.values(jkCounts), backgroundColor: ['#3B82F6', '#EC4899'] }]
        },
        status: {
           labels: Object.keys(statusCounts),
           datasets: [{ data: Object.values(statusCounts), backgroundColor: ['#10B981', '#F59E0B', '#6366F1', '#EF4444', '#8B5CF6', '#14B8A6'] }]
        }
     };
  }, [previewData, dataType]);

  useEffect(() => { checkActiveData(); }, []);

  const handleDownloadTemplate = () => {
    if (isGeojson) {
      const link = document.createElement("a");
      link.href = `/geoJson/${nama_desa.toLowerCase()}.geojson`;
      link.download = `${nama_desa.toLowerCase()}.geojson`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    const ws = XLSX.utils.json_to_sheet([], { header: reqCols });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `Template_${dataType}_${nama_desa || 'Desa'}.xlsx`);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDelete = async () => {
     if (!window.confirm("Yakin ingin menghapus seluruh data " + title + " yang sudah tersimpan?")) return;
     setDeleting(true);
     try {
       if (isGeojson) {
          await api6.delete(`/api/upload-data/geojson-desa/${nama_desa}`);
          message.success("Batas Wilayah berhasil dihapus!");
          checkActiveData();
       } else {
          await api6.delete(`/api/village-data/${nama_desa}/${dataType}`);
          message.success("Data berhasil dikosongkan!");
          checkActiveData();
       }
     } catch (e) {
       message.error("Gagal menghapus data.");
     } finally {
       setDeleting(false);
     }
  };

  const handleUpload = async () => {
    if (!file) {
      message.warning('Pilih file terlebih dahulu!');
      return;
    }
    setLoading(true);
    try {
      let jsonData;
      if (isGeojson) {
        if (!file.name.endsWith('.json') && !file.name.endsWith('.geojson')) {
           message.error('Format Batas Wilayah (GeoJSON) harus berupa file .json atau .geojson!');
           setLoading(false);
           return;
        }
        const text = await file.text();
        try { JSON.parse(text); } catch (err) { message.error('JSON tidak valid!'); setLoading(false); return; }
        
        const formData = new FormData();
        formData.append("file", file);
        await api6.post(`/api/upload-data/geojson-desa/${nama_desa}`, formData, {
           headers: { "Content-Type": "multipart/form-data" }
        });
        message.success(`Batas Wilayah ${nama_desa} berhasil diperbarui!`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        checkActiveData();
        setLoading(false);
        return;
      } else {
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.csv') && !file.name.endsWith('.xls')) {
           message.error('Gunakan file Excel (.xlsx / .xls) atau CSV!');
           setLoading(false);
           return;
        }
        const dataBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(dataBuffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawJsonData = XLSX.utils.sheet_to_json(worksheet, { range: 0 });
        if (rawJsonData.length === 0) {
           message.error('File Excel kosong atau format tidak sesuai.');
           setLoading(false);
           return;
        }
        const normalizedData = rawJsonData.map(row => {
           let newRow = {};
           for (let key in row) {
              let cleanKey = key.toString().toLowerCase().trim();
              if (['pekerjaan', 'umkm', 'pertanian_usahasayuran', 'pertanian_aggregate'].includes(dataType)) {
                 cleanKey = cleanKey.replace(/ /g, '_');
              }
              newRow[cleanKey] = row[key];
           }
           return newRow;
        });
        const firstRow = normalizedData[0] || {};
        const missingCols = reqCols.filter(col => !(col.toLowerCase() in firstRow));
        if (missingCols.length > 0) {
           message.error({ content: `Format tidak sesuai template! Kolom hilang: ${missingCols.join(', ')}`, duration: 8 });
           setLoading(false);
           return;
        }
        if (dataType === 'keluarga') {
           jsonData = normalizedData.map(row => ({
              rt: row['rt/rw'], jumlah_keluarga: row['jumlah keluarga'],
              rata_anggota: row['rata-rata anggota keluarga'] || 0, rata_luas_lantai: row['rata-rata luas lantai'] || 0
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
              reqCols.forEach(col => { cleanRow[col] = row[col.toLowerCase()]; });
              return cleanRow;
           });
        }
      }
      
      await api6.post('/api/village-data', { desa_name: nama_desa, dataType: dataType, data: jsonData });
      
      if (dataType === 'pekerjaan') {
        message.loading({ content: 'Memasukkan data ke Peta Pekerjaan...', key: 'pekerjaanUpload' });
        const cleanItems = jsonData.map((item, i) => ({
             rt: String(item.rt || "0"),
             rw: String(item.rw || "0"),
             umur: Number(item.umur) || 0,
             jenis_kelamin: item.jenis_kelamin || "Laki-Laki",
             status_pekerjaan_utama: item.status_pekerjaan_utama || "Tidak Diketahui",
             nmdesa: nama_desa,
             bidang_pekerjaan: item.bidang_pekerjaan, nama_anggota: item.nama_anggota || `Warga ${i+1}`
        }));
        try {
           const res = await api6.post("/api/pekerjaan", cleanItems);
           message.success({ content: `Peta Pekerjaan diupdate: ${res.data.count || cleanItems.length} data masuk!`, key: 'pekerjaanUpload', duration: 3 });
        } catch (e) {
           message.error({ content: `Gagal bulk insert Peta Pekerjaan`, key: 'pekerjaanUpload', duration: 3 });
        }
      } else if (dataType === 'umkm') {
        message.loading({ content: 'Memasukkan data ke Peta UMKM...', key: 'umkmUpload' });
        const cleanItems = jsonData.map((item, i) => ({
             rt: String(item.rt || "0"),
             rw: String(item.rw || "0"),
             dusun: item.dusun || "-",
             nama_usaha: item.nama_usaha || `Usaha ${i+1}`,
             jml_ruta: Number(item.jml_ruta) || 1,
             jml_umkm: Number(item.jml_umkm) || 1,
             nmdesa: nama_desa
        }));
        try {
           const res = await api6.post("/api/umkm", cleanItems);
           message.success({ content: `Peta UMKM diupdate: ${res.data.count || cleanItems.length} data masuk!`, key: 'umkmUpload', duration: 3 });
        } catch (e) {
           message.error({ content: `Gagal bulk insert Peta UMKM`, key: 'umkmUpload', duration: 3 });
        }
      }
      
      message.success(`Data ${title} berhasil disimpan!`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      checkActiveData();
    } catch (error) {
      console.error(error);
      message.error('Gagal mengunggah data.');
    } finally { setLoading(false); }
  };

  return (
    <>
    <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
      <div className={`p-4 border-b ${bgClass}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
               {isGeojson ? <FaFileCode className="text-amber-500 text-xl" /> : <FaFileExcel className="text-emerald-500 text-xl" />}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg leading-tight">{title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{isGeojson ? 'Format .json / .geojson' : 'Format .xlsx / .csv'}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-5 flex flex-col flex-1 gap-4">
        {/* Status File Aktif */ }
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <p className="text-[11px] font-bold text-gray-500 mb-2 uppercase tracking-wider">Status Data Server:</p>
          {activeDataCount ? (
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
               <div className="flex items-center gap-2">
                 <FaDatabase className="text-blue-500 shrink-0" />
                 <span className="text-sm font-bold text-blue-900">{activeDataCount}</span>
               </div>
               <div className="flex items-center gap-1 shrink-0">
                 <button onClick={handlePreviewOpen} className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors" title="Preview / Lihat Tabel Data">
                   <FaEye />
                 </button>
                 <button onClick={handleDelete} disabled={deleting} className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-colors" title="Hapus Seluruh Data">
                   <FaTrash />
                 </button>
               </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400 italic bg-white p-2 rounded border border-gray-100">Belum ada data</div>
          )}
        </div>

        <Button 
          size="sm" 
          variant="flat" 
          color="primary"
          startContent={<FaDownload />} 
          onClick={handleDownloadTemplate}
          className="w-full bg-blue-50/50 hover:bg-blue-100 text-blue-600 font-medium mb-4"
        >
          {isGeojson ? "Download File GeoJSON Saat Ini" : "Download Template Excel"}
        </Button>
        {!file ? (
          <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 hover:border-blue-300 transition-colors cursor-pointer p-6 min-h-[140px]">
            <FaUpload className="text-gray-400 mb-3" size={28} />
            <p className="text-sm font-semibold text-gray-600 mb-1 text-center">Klik atau Drop File</p>
            <p className="text-xs text-gray-400 text-center px-4">Pastikan file sesuai dengan format yang diminta</p>
            <input ref={fileInputRef} type="file" className="hidden" accept={isGeojson ? '.json,.geojson' : '.xlsx,.csv,.xls'} onChange={handleFileChange} />
          </label>
        ) : (
          <div className="flex-1 flex flex-col justify-center border border-blue-200 rounded-xl p-4 bg-blue-50 relative min-h-[140px]">
            <button className="absolute top-2 right-2 text-red-400 p-1.5 hover:bg-red-100 hover:text-red-600 rounded-lg transition-colors" onClick={(e) => { e.preventDefault(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
              <FaTrash size={14} />
            </button>
            <div className="flex flex-col items-center text-center gap-2 px-2 mt-2">
              <FaFileExcel className="text-blue-500 shrink-0" size={32} />
              <div className="w-full">
                <p className="text-sm font-semibold text-gray-800 break-words line-clamp-2 leading-tight">{file.name}</p>
                <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
          </div>
        )}
        <Button color="primary" className="w-full font-bold shadow-sm" onClick={handleUpload} isLoading={loading} isDisabled={!file}>
          {loading ? 'Mengunggah...' : 'Upload Data'}
        </Button>
      </div>
    </div>

    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="3xl" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1 border-b border-gray-100 pb-3">
               <div className="flex items-center justify-between">
                 <span>Preview Data: {title}</span>
                 {dataType === 'pekerjaan' && (
                   <a href={`/admin/desa/${nama_desa}`} className="bg-blue-600 text-white px-4 py-1.5 text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                     Kelola Seluruh Data
                   </a>
                 )}
               </div>
            </ModalHeader>
            <ModalBody className="p-0">
                 <div className="bg-gray-50 p-4 overflow-auto text-sm max-h-[70vh]">
                   {isGeojson ? (
                     <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto font-mono max-h-[60vh]">
                       {previewDataGeojson || "Memuat atau data kosong..."}
                     </pre>
                   ) : previewData.length > 0 ? (
                     <table className="w-full text-left bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
                       <thead className="bg-blue-50 text-blue-900 border-b border-gray-200">
                         <tr>
                           <th className="p-3 font-semibold">No</th>
                           {Object.keys(previewData[0]).map(key => (
                             <th key={key} className="p-3 font-semibold capitalize whitespace-nowrap">{key.replace(/_/g, ' ')}</th>
                           ))}
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {previewData.slice(0, 100).map((row, i) => (
                           <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                             <td className="p-3 text-gray-500">{i + 1}</td>
                             {Object.values(row).map((val, idx) => (
                               <td key={idx} className="p-3 whitespace-nowrap">{val}</td>
                             ))}
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   ) : (
                     <p className="text-gray-500 p-4">Tidak ada data untuk ditampilkan secara tabular.</p>
                   )}
                   
                   {!isGeojson && previewData.length > 100 && (
                     <div className="p-4 text-center text-gray-500 italic flex flex-col items-center gap-2">
                       <span>Menampilkan 100 baris pertama. Untuk melihat dan mengelola seluruh {previewData.length} data, silakan buka menu Dashboard Utama.</span>
                       <a href={`/admin/desa/${nama_desa}`} className="text-blue-600 font-bold hover:underline">
                         Ke Dashboard Utama &rarr;
                       </a>
                     </div>
                   )}
                 </div>
            </ModalBody>
            <ModalFooter className="border-t border-gray-100">
              <Button color="primary" onPress={onClose} className="font-semibold">Tutup Preview</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
    </>
  );
};

const ChartPreviewSection = ({ nama_desa }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDataKey, setCurrentDataKey] = useState('jenisKelamin');
  const [chartType, setChartType] = useState('doughnut');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api6.get(`/api/village-data/${nama_desa}/pekerjaan`);
        if (res.data && Array.isArray(res.data)) {
          setData(res.data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nama_desa]);

  const processedData = useMemo(() => {
    if (data.length === 0) return {};
    const jkCounts = {};
    const statusCounts = {};
    const umurCounts = { '< 17': 0, '17-25': 0, '26-35': 0, '36-45': 0, '46-55': 0, '> 55': 0, 'Tidak Diketahui': 0 };

    data.forEach(item => {
      let jk = (item.jenis_kelamin || 'tidak diketahui').toLowerCase().trim();
      if (jk === 'pria' || jk === 'male' || jk === 'l' || jk.includes('laki')) jk = 'laki-laki';
      else if (jk === 'wanita' || jk === 'female' || jk === 'p' || jk.includes('perempuan')) jk = 'perempuan';
      jkCounts[jk] = (jkCounts[jk] || 0) + 1;

      let stat = (item.status_pekerjaan_utama || item.status_pekerjaan || 'Tidak Diketahui').trim();
      statusCounts[stat] = (statusCounts[stat] || 0) + 1;

      const umur = parseInt(item.umur, 10);
      if (isNaN(umur)) umurCounts['Tidak Diketahui']++;
      else if (umur < 17) umurCounts['< 17']++;
      else if (umur <= 25) umurCounts['17-25']++;
      else if (umur <= 35) umurCounts['26-35']++;
      else if (umur <= 45) umurCounts['36-45']++;
      else umurCounts['> 55']++;
    });

    const highlightMostFrequent = (countsObj) => {
      const keys = Object.keys(countsObj);
      if (keys.length === 0) return [];
      const maxVal = Math.max(...Object.values(countsObj));
      return keys.map(k => countsObj[k] === maxVal ? '#3B82F6' : '#93C5FD');
    };

    return {
      totalPenduduk: data.length,
      jenisKelamin: {
        labels: Object.keys(jkCounts).map(l => l.replace(/\b\w/g, s => s.toUpperCase())),
        values: Object.values(jkCounts),
        colors: Object.keys(jkCounts).map(l => l === 'laki-laki' ? '#3B82F6' : l === 'perempuan' ? '#EC4899' : '#9CA3AF'),
        title: 'Distribusi Jenis Kelamin'
      },
      statusPekerjaan: {
        labels: Object.keys(statusCounts),
        values: Object.values(statusCounts),
        colors: highlightMostFrequent(statusCounts),
        title: 'Distribusi Status Pekerjaan'
      },
      umur: {
        labels: Object.keys(umurCounts),
        values: Object.values(umurCounts),
        colors: highlightMostFrequent(umurCounts),
        title: 'Distribusi Kelompok Umur'
      }
    };
  }, [data]);

  if (loading) return null;
  if (data.length === 0) return null;

  return (
    <div className="mt-8 bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
         <FaChartPie className="text-blue-600" />
         Visualisasi Data Ketenagakerjaan
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {/* Kiri: Kontrol & Statistik */}
         <div className="flex flex-col gap-4">
            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 text-center">
               <p className="text-sm text-gray-600 mb-1">Total Penduduk 15-64 Thn</p>
               <p className="text-3xl font-bold text-blue-600">{processedData.totalPenduduk || 0}</p>
               <p className="text-xs text-gray-500 mt-1">dari {data.length} total</p>
            </div>
            
            <div className="bg-white p-2 rounded-xl border border-gray-100 flex flex-col gap-1">
               {['jenisKelamin', 'statusPekerjaan', 'umur'].map(key => (
                  <button key={key} onClick={() => setCurrentDataKey(key)} className={`py-2 px-3 text-sm font-medium rounded-lg transition-all ${currentDataKey === key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                     {key === 'jenisKelamin' ? 'J. Kelamin' : key === 'statusPekerjaan' ? 'Pekerjaan' : 'Umur'}
                  </button>
               ))}
            </div>
            
            <div className="bg-white p-2 rounded-xl border border-gray-100 grid grid-cols-2 gap-1">
               {['bar', 'doughnut'].map(type => (
                  <button key={type} onClick={() => setChartType(type)} className={`py-2 text-xs font-medium rounded-lg transition-all ${chartType === type ? 'bg-blue-500 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
                     {type === 'bar' ? 'Batang' : 'Lingkaran'}
                  </button>
               ))}
            </div>
         </div>
         
         {/* Kanan: Chart */}
         <div className="md:col-span-3 bg-white p-6 rounded-xl border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-full h-full max-h-[350px]">
               <DemographicsChart chartData={processedData[currentDataKey]} chartType={chartType} />
            </div>
         </div>
      </div>
    </div>
  );
};

const KeluargaPreviewSection = ({ nama_desa }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api6.get(`/api/village-data/${nama_desa}/keluarga`);
        if (res.data && Array.isArray(res.data)) {
          setData(res.data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nama_desa]);

  const summary = useMemo(() => {
    if (data.length === 0) return null;
    let totalKeluarga = 0;
    let totalAnggota = 0;
    let totalLantai = 0;
    let validRataCount = 0;
    
    const isMicrodata = data[0] && 'jml_anggota_keluarga' in data[0];

    data.forEach(item => {
      if (isMicrodata) {
        totalKeluarga += 1;
        totalAnggota += Number(item.jml_anggota_keluarga) || 0;
        totalLantai += Number(item.luas_lantai) || 0;
      } else {
        const jk = Number(item.jumlah_keluarga) || 0;
        const ra = Number(item.rata_anggota) || 0;
        const rl = Number(item.rata_luas_lantai) || 0;
        
        totalKeluarga += jk;
        if (ra > 0) {
          totalAnggota += (ra * jk);
          validRataCount += jk;
        }
        if (rl > 0) totalLantai += (rl * jk);
      }
    });

    return {
      totalKeluarga,
      avgAnggota: isMicrodata 
        ? (totalKeluarga > 0 ? (totalAnggota / totalKeluarga).toFixed(1) : 0)
        : (validRataCount > 0 ? (totalAnggota / validRataCount).toFixed(1) : 0),
      avgLantai: totalKeluarga > 0 ? (totalLantai / totalKeluarga).toFixed(1) : 0,
      rtCount: isMicrodata ? 10 : data.length
    };
  }, [data]);

  if (loading || data.length === 0) return null;

  return (
    <div className="mt-6 bg-emerald-50/40 p-6 rounded-2xl border border-emerald-200">
      <h3 className="text-lg font-bold text-emerald-800 mb-6 flex items-center gap-2">
         <FaChartPie className="text-emerald-600" />
         Ringkasan Data Keluarga (Persebaran RT/RW)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-500 mb-2">Total Keluarga</p>
            <p className="text-3xl font-extrabold text-emerald-600">{summary.totalKeluarga}</p>
            <p className="text-xs text-gray-400 mt-2">Tersebar di {summary.rtCount} RT</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-500 mb-2">Rata-rata Anggota / Keluarga</p>
            <p className="text-3xl font-extrabold text-emerald-600">{summary.avgAnggota} <span className="text-base text-gray-500 font-normal">Orang</span></p>
            <p className="text-xs text-gray-400 mt-2">Berdasarkan data sampel</p>
         </div>
         <div className="bg-white p-5 rounded-xl border border-emerald-100 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-500 mb-2">Rata-rata Luas Lantai</p>
            <p className="text-3xl font-extrabold text-emerald-600">{summary.avgLantai} <span className="text-base text-gray-500 font-normal">m²</span></p>
            <p className="text-xs text-gray-400 mt-2">Indikator kesejahteraan keluarga</p>
         </div>
      </div>
    </div>
  );
};

const PertanianPreviewSection = ({ nama_desa }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api6.get(`/api/village-data/${nama_desa}/pertanian_usahasayuran`);
        if (res.data && Array.isArray(res.data)) {
          setData(res.data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    if (nama_desa) fetchData();
  }, [nama_desa]);

  const summary = useMemo(() => {
    if (data.length === 0) return null;
    let totalPohon = 0;
    let totalVolume = 0;
    data.forEach(d => { 
      totalPohon += (Number(d.jml_pohon) || 0); 
      totalVolume += (Number(d.volume_produksi) || 0);
    });
    return { totalPohon, totalVolume };
  }, [data]);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse mt-4">Memuat visualisasi...</div>;
  if (!summary) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-4">
      <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
        <FaChartPie className="text-emerald-500" /> Ringkasan Usaha Pertanian
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center">
          <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Total Pohon</p>
          <div className="text-3xl font-extrabold text-emerald-900">
            <CountUp end={summary.totalPohon} duration={2} separator="." />
          </div>
        </div>
        <div className="bg-lime-50 rounded-xl p-4 border border-lime-100 flex flex-col items-center justify-center">
          <p className="text-lime-600 text-xs font-bold uppercase tracking-wider mb-1">Total Volume Produksi</p>
          <div className="text-3xl font-extrabold text-lime-900">
            <CountUp end={summary.totalVolume} duration={2} separator="." suffix=" Kg" />
          </div>
        </div>
      </div>
    </div>
  );
};

const UmkmPreviewSection = ({ nama_desa }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const formattedDesa = nama_desa.charAt(0).toUpperCase() + nama_desa.slice(1).toLowerCase();
        const res = await api6.get(`/api/umkm?nmdesa=${formattedDesa}`);
        if (res.data && Array.isArray(res.data)) {
          setData(res.data);
        }
      } catch (e) {
      } finally {
        setLoading(false);
      }
    };
    if (nama_desa) fetchData();
  }, [nama_desa]);

  const summary = useMemo(() => {
    if (data.length === 0) return null;
      if (data.length === 0) return null;
      let totalUsaha = 0;
      let totalMikro = 0;
      let totalKecil = 0;
      let totalMenengah = 0;
      let totalKbli = {A:0, B:0, C:0, D:0, E:0, F:0, G:0, H:0, I:0, J:0, K:0, L:0, M:0, N:0, O:0, P:0, Q:0, R:0, S:0, T:0, U:0};
      
      data.forEach(d => { 
        totalUsaha += (d.jml_umkm || 0); 
        totalMikro += (d.jml_umkm_skala_usaha_mikro || 0);
        totalKecil += (d.jml_umkm_skala_usaha_kecil || 0);
        totalMenengah += (d.jml_umkm_skala_usaha_menengah || 0);
        Object.keys(totalKbli).forEach(k => { totalKbli[k] += (d[jml_umkm_kbli_] || 0); });
      });

      let dominantKbli = "-";
      let maxVal = 0;
      Object.keys(totalKbli).forEach(k => {
        if (totalKbli[k] > maxVal) {
          maxVal = totalKbli[k];
          dominantKbli = "KBLI " + k;
        }
      });
      return { totalUsaha, totalMikro, totalKecil, totalMenengah, dominantKbli, totalKbli };
    }, [data]);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse mt-4">Memuat visualisasi UMKM...</div>;
  if (!summary) return null;

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm mt-4">
      <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
        <FaChartPie className="text-blue-500" /> Ringkasan Data UMKM
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center justify-center">
          <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1 text-center">Total UMKM</p>
          <div className="text-3xl font-extrabold text-blue-900">
            <CountUp end={summary.totalUsaha} duration={2} separator="." />
          </div>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center justify-center">
          <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1 text-center">Usaha Mikro</p>
          <div className="text-3xl font-extrabold text-emerald-900">
            <CountUp end={summary.totalMikro} duration={2} separator="." />
          </div>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 flex flex-col items-center justify-center">
          <p className="text-orange-600 text-xs font-bold uppercase tracking-wider mb-1 text-center">Usaha Kecil</p>
          <div className="text-3xl font-extrabold text-orange-900">
            <CountUp end={summary.totalKecil} duration={2} separator="." />
          </div>
        </div>
        <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 flex flex-col items-center justify-center">
          <p className="text-purple-600 text-xs font-bold uppercase tracking-wider mb-1 text-center">Usaha Menengah</p>
          <div className="text-3xl font-extrabold text-purple-900">
            <CountUp end={summary.totalMenengah} duration={2} separator="." /></div></div></div>
      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
        <p className="text-pink-600 text-sm font-bold uppercase tracking-wider mb-3 text-center">Rincian Sektor KBLI</p>
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 text-center">
            {Object.entries(summary.totalKbli).map(([k,v]) => (
            <div key={k} className="bg-white rounded-lg p-2 shadow-sm border border-pink-100 flex flex-col items-center justify-center">
              <p className="text-xs font-bold text-gray-500">KBLI {k}</p>
              <p className="text-xl font-extrabold text-pink-700">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
const DataUploader = ({ nama_desa, themes = [] }) => {
  const cards = [];
  
  if (themes.includes("Sosial Kependudukan")) {
     if (nama_desa && nama_desa.toUpperCase() !== "WAUNG") {
        cards.push({ title: "Data Ketenagakerjaan", dataType: "pekerjaan" });
     }
     
     if (nama_desa && nama_desa.toUpperCase() !== "SIDOKEPUNG") {
        cards.push({ title: "Data Keluarga", dataType: "keluarga" });
     }

     if (nama_desa && nama_desa.toUpperCase() === "WAUNG") {
        cards.push({ title: "Data Sanitasi & Rumah", dataType: "sanitasi_air" });
        cards.push({ title: "Data Kelompok Umur", dataType: "kelompok_umur" });
     }
  }
  if (themes.includes("Ekonomi Perdagangan")) {
     cards.push({ title: "Data UMKM", dataType: "umkm" });
  }
  if (themes.includes("Pertanian Pertambangan")) {
     cards.push({ title: "Usaha Pertanian", dataType: "pertanian_usahasayuran" });
  }
  
  cards.push({ title: "Batas Wilayah", dataType: "geojson" });

  const gridColsClass = cards.length === 1 ? 'grid-cols-1' :
                        cards.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                        cards.length === 3 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' :
                        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-blue-50/80 border border-blue-200 p-5 rounded-xl flex flex-col sm:flex-row items-start gap-4">
        <div className="p-2 bg-blue-100 rounded-full shrink-0">
           <FaInfoCircle className="text-blue-600 text-xl" />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 mb-1">Petunjuk Update Data</h4>
          <p className="text-sm text-blue-800/80 leading-relaxed">
            Pilih kotak unggah yang sesuai dengan jenis data yang ingin Anda perbarui. Jika data sudah tersedia di server, Anda bisa melihat tabel preview isinya dan menghapusnya terlebih dahulu.
          </p>
        </div>
      </div>
      
      <div className={`grid ${gridColsClass} gap-6`}>
        {cards.map((card, idx) => (
          <UploadCard key={idx} title={card.title} dataType={card.dataType} nama_desa={nama_desa} />
        ))}
      </div>

      {themes.includes("Sosial Kependudukan") && (
        <div className="flex flex-col gap-2">
           {nama_desa && nama_desa.toUpperCase() !== "WAUNG" && (
              <ChartPreviewSection nama_desa={nama_desa} />
           )}
           {nama_desa && nama_desa.toUpperCase() !== "SIDOKEPUNG" && (
             <KeluargaPreviewSection nama_desa={nama_desa} />
           )}
        </div>
      )}

      {themes.includes("Ekonomi Perdagangan") && (
        <UmkmPreviewSection nama_desa={nama_desa} />
      )}

      {themes.includes("Pertanian Pertambangan") && (
        <PertanianPreviewSection nama_desa={nama_desa} />
      )}
    </div>
  );
};

export default DataUploader;
