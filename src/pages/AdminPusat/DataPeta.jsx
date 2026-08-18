import React, { useState, useEffect, useMemo, useRef } from "react";
import AdminLayout from "../../components/AdminLayout";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@nextui-org/react";
import { message } from "antd";
import api6 from "../../utils/api6";
import { FiFileText, FiMap, FiUploadCloud, FiDownload, FiTrash2, FiFile, FiCheckCircle, FiGrid } from "react-icons/fi";
import { FaMapMarkedAlt } from "react-icons/fa";

// ─── Komponen Upload Card ─────────────────────────────────────────────────
import * as XLSX from "xlsx";

// ─── Komponen Upload Card ─────────────────────────────────────────────────
const UploadCard = ({ title, description, accept, endpoint, downloadName, color, onSuccess, isExcelMode }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileExists, setFileExists] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef(null);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [previewData, setPreviewData] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);

  const isEmerald = color === "emerald";
  const borderCls = isEmerald ? "border-emerald-200" : "border-blue-200";
  const bgCls = isEmerald ? "bg-emerald-50" : "bg-blue-50";
  const textCls = isEmerald ? "text-emerald-700" : "text-blue-700";
  const btnCls = isEmerald
    ? "bg-emerald-600 hover:bg-emerald-700"
    : "bg-blue-600 hover:bg-blue-700";

  const checkExists = async () => {
    try {
      const res = await fetch(`/data/${downloadName}?t=${Date.now()}`, { method: 'HEAD' });
      const contentType = res.headers.get("content-type");
      setFileExists(res.ok && contentType && !contentType.includes("text/html"));
    } catch {
      setFileExists(false);
    }
  };

  useEffect(() => {
    checkExists();
  }, []);

  const handleUpload = async () => {
    if (!file) return message.warning("Pilih file terlebih dahulu");
    
    if (isExcelMode && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.xls'))) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: "binary" });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet);

          const mappedData = {};
          for (const r of rows) {
            const kode = String(r.Kode_Desa || r.KODE_DESA || r.kode_desa || "");
            if (kode) {
              mappedData[kode] = {
                Kecamatan: r.Kecamatan || r.KECAMATAN || "",
                nmdesa: r.Desa || r.DESA || r.nmdesa || "",
                L: Number(r.Laki_Laki || r.L || 0),
                P: Number(r.Perempuan || r.P || 0),
                total_penduduk: Number(r.Laki_Laki || r.L || 0) + Number(r.Perempuan || r.P || 0),
                KK_L: Number(r.KK_Laki_Laki || r.KK_L || 0),
                KK_P: Number(r.KK_Perempuan || r.KK_P || 0),
                total_kk: Number(r.KK_Laki_Laki || r.KK_L || 0) + Number(r.KK_Perempuan || r.KK_P || 0),
              };
            }
          }
          
          setUploading(true);
          await api6.put("/api/upload-data/penduduk", { data: mappedData });
          message.success("Data Excel berhasil diupload dan disimpan secara otomatis!");
          setFile(null);
          if (inputRef.current) inputRef.current.value = "";
          await checkExists();
          if (onSuccess) onSuccess();
        } catch (err) {
          console.error(err);
          message.error("Gagal membaca file Excel. Pastikan format tabel sesuai.");
        } finally {
          setUploading(false);
        }
      };
      reader.readAsBinaryString(file);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    setUploading(true);
    try {
      const res = await api6.post(endpoint, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      message.success(res.data.message || "Upload berhasil!");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      await checkExists();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(err.response?.data?.message || "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Yakin ingin menghapus file aktif ini?")) return;
    setDeleting(true);
    try {
      await api6.delete(`/api/upload-data/active/${downloadName}`);
      message.success("File berhasil dihapus");
      await checkExists();
      if (onSuccess) onSuccess();
    } catch (err) {
      message.error(err.response?.data?.message || "Gagal menghapus file");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async () => {
    if (isExcelMode) {
      try {
        const res = await api6.get("/api/upload-data/penduduk");
        const data = res.data.data;
        const rows = Object.entries(data).map(([kode, val]) => ({
          Kode_Desa: kode,
          Kecamatan: val.Kecamatan,
          Desa: val.nmdesa,
          Laki_Laki: val.L,
          Perempuan: val.P,
          KK_Laki_Laki: val.KK_L,
          KK_Perempuan: val.KK_P,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Demografi");
        XLSX.writeFile(wb, "Template_Data_Demografi.xlsx");
        return;
      } catch (e) {
        message.error("Gagal mendownload template Excel");
        return;
      }
    }
    const a = document.createElement("a");
    a.href = `/data/${downloadName}`;
    a.download = downloadName;
    a.click();
  };

  const handlePreview = async () => {
    onOpen();
    setPreviewLoading(true);
    try {
      const res = await fetch(`/data/${downloadName}?t=${Date.now()}`);
      if (!res.ok) throw new Error("Not found");
      const text = await res.text();
      setPreviewData(text);
    } catch (err) {
      setPreviewData("File kosong atau tidak ditemukan.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <>
      <div className={`rounded-2xl border-2 ${borderCls} ${bgCls} p-5 flex flex-col h-full`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className={`font-bold text-base ${textCls}`}>{title}</h3>
            <p className="text-gray-500 text-sm mt-0.5">{description}</p>
          </div>
          <button
            onClick={handleDownload}
            className="text-sm text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 shrink-0 ml-3 flex items-center gap-1"
          >
            <FiDownload className="h-4 w-4" />
            {isExcelMode ? "Download Template Excel" : "Download Template"}
          </button>
        </div>

        {/* Status File Aktif */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">File Aktif di Server:</p>
          {fileExists ? (
            <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="text-gray-400 bg-gray-100 p-2 rounded-lg">
                    {isExcelMode ? (
                      <FiFileText className="h-6 w-6 text-green-600" />
                    ) : downloadName.includes("geojson") ? (
                      <FiMap className="h-6 w-6 text-blue-500" />
                    ) : (
                      <FiFileText className="h-6 w-6 text-gray-500" />
                    )}
                  </div>
                  <div className="text-left overflow-hidden">
                    <p className="text-sm font-bold text-gray-800 truncate" title={isExcelMode ? "Data_Demografi.xlsx" : downloadName}>
                      {isExcelMode ? "Data_Demografi (Tersimpan)" : downloadName}
                    </p>
                    <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                      <FiCheckCircle className="h-3 w-3" />
                      Tersedia
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus File Server"
                >
                  <FiTrash2 className="h-5 w-5" />
                </button>
              </div>
              <div className="flex gap-2 shrink-0 mt-1">
                <button onClick={handlePreview} className="flex-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                  Lihat Isi
                </button>
                <button onClick={handleDownload} className="flex-1 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                  Download
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
              <p className="text-sm text-gray-400 font-medium">Kosong (Tidak ada data)</p>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div className="flex-1">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) setFile(f);
            }}
            onClick={() => !file && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors h-full flex flex-col justify-center ${
              file ? "border-gray-200 bg-white" : "cursor-pointer " + (dragOver ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-white hover:border-gray-300")
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => setFile(e.target.files[0])}
            />
            
            {file ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200 w-full">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="text-blue-500 bg-blue-100 p-2 rounded-lg">
                      <FiFile className="h-6 w-6" />
                    </div>
                    <div className="text-left overflow-hidden">
                      <p className="text-sm font-semibold text-blue-800 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-blue-600">
                        {(file.size / 1024 / 1024).toFixed(2)} MB - Siap diupload
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (inputRef.current) inputRef.current.value = "";
                    }}
                    className="text-blue-400 hover:text-red-500 transition-colors p-1"
                    title="Batal upload"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <div className="text-gray-400 bg-gray-50 p-3 rounded-full mb-3 shadow-inner">
                  <FiUploadCloud className="h-8 w-8" />
                </div>
                <p className="text-sm text-gray-500">
                  Klik atau drag file baru ke sini <span className="font-mono text-xs bg-gray-100 px-1 py-0.5 rounded text-gray-600">{accept}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleUpload}
          disabled={uploading || !file}
          className={`mt-4 w-full py-2.5 rounded-xl text-white font-semibold text-sm transition-all ${
            file && !uploading ? btnCls : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {uploading ? "Mengupload..." : "Upload & Replace"}
        </button>
      </div>

      {/* Modal Preview */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="4xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1 text-gray-800">
                Preview File: {downloadName}
              </ModalHeader>
              <ModalBody>
                {previewLoading ? (
                  <div className="py-10 text-center text-gray-500">Memuat isi file...</div>
                ) : (
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs overflow-auto font-mono max-h-[60vh]">
                    {previewData}
                  </pre>
                )}
              </ModalBody>
              <ModalFooter>
                <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-sm transition-colors">
                  Tutup
                </button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500 bg-red-50"><h1>Something went wrong.</h1><pre>{this.state.error.toString()}</pre></div>;
    }
    return this.props.children;
  }
}

// ─── Halaman Utama ────────────────────────────────────────────────────────
const AdminDataPetaInner = () => {
  const [pendudukData, setPendudukData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPenduduk();
  }, []);

  const fetchPenduduk = async () => {
    setLoading(true);
    try {
      const res = await api6.get("/api/upload-data/penduduk");
      setPendudukData(res.data.data || {});
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setPendudukData({});
      } else {
        message.error("Gagal memuat data demografi");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout pageTitle="Update Data Peta">
      <div className="flex flex-col gap-6 pt-4 pb-16">

        {/* ── HEADER ── */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Update Data Peta</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data demografi desa dan file GeoJSON peta. Setiap perubahan
            otomatis dibackup.
          </p>
        </div>

        {/* ── SECTION: Upload File ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-1">
            Upload File Data
          </h2>
          <p className="text-gray-500 text-sm mb-5">
            Ganti file data secara massal. File lama otomatis di-backup sebelum
            diganti.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UploadCard
              title="Data Demografi (Excel / JSON)"
              description="Upload file Excel (.xlsx) data jumlah penduduk per desa"
              accept=".xlsx,.xls,.csv,.json"
              endpoint="/api/upload-data/penduduk-file"
              downloadName="penduduk.json"
              color="blue"
              isExcelMode={true}
              onSuccess={() => {
                fetchPenduduk();
              }}
            />
            <UploadCard
              title="GeoJSON Peta Tematik (peta_sidoarjo.geojson)"
              description="File GeoJSON berisi batas wilayah desa Kabupaten Sidoarjo"
              accept=".json,.geojson"
              endpoint="/api/upload-data/geojson-tematik"
              downloadName="peta_sidoarjo.geojson"
              color="emerald"
            />
          </div>
        </div>

        {/* ── SECTION: Ringkasan Data Demografi ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">
              Ringkasan Data Demografi Server
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Hasil kalkulasi otomatis dari data Excel yang Anda upload. Data ini yang akan diringkas pada tampilan web peta.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-gray-500">Memuat data...</div>
          ) : Object.keys(pendudukData).length === 0 ? (
            <div className="py-10 text-center text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              Belum ada data demografi. Silakan upload file Excel terlebih dahulu.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 font-bold">Indikator</th>
                    <th className="px-6 py-4 font-bold text-right">Nilai Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 font-semibold text-gray-900">Total Desa Terdata</td>
                    <td className="px-6 py-3 text-right font-bold text-blue-600">
                      {Object.keys(pendudukData).length.toLocaleString('id-ID')} Desa
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50/30">
                    <td className="px-6 py-3 font-semibold text-gray-900">Total Penduduk</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">
                      {Object.values(pendudukData).reduce((sum, d) => sum + (Number(d.L) || 0) + (Number(d.P) || 0), 0).toLocaleString('id-ID')} Jiwa
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 pl-10 text-gray-600">- Laki-Laki</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-800">
                      {Object.values(pendudukData).reduce((sum, d) => sum + (Number(d.L) || 0), 0).toLocaleString('id-ID')} Jiwa
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 pl-10 text-gray-600">- Perempuan</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-800">
                      {Object.values(pendudukData).reduce((sum, d) => sum + (Number(d.P) || 0), 0).toLocaleString('id-ID')} Jiwa
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50 bg-blue-50/30">
                    <td className="px-6 py-3 font-semibold text-gray-900">Total Kepala Keluarga (KK)</td>
                    <td className="px-6 py-3 text-right font-bold text-gray-900">
                      {Object.values(pendudukData).reduce((sum, d) => sum + (Number(d.KK_L) || 0) + (Number(d.KK_P) || 0), 0).toLocaleString('id-ID')} KK
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 pl-10 text-gray-600">- KK Laki-Laki</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-800">
                      {Object.values(pendudukData).reduce((sum, d) => sum + (Number(d.KK_L) || 0), 0).toLocaleString('id-ID')} KK
                    </td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-3 pl-10 text-gray-600">- KK Perempuan</td>
                    <td className="px-6 py-3 text-right font-medium text-gray-800">
                      {Object.values(pendudukData).reduce((sum, d) => sum + (Number(d.KK_P) || 0), 0).toLocaleString('id-ID')} KK
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const AdminDataPeta = () => (
  <ErrorBoundary>
    <AdminDataPetaInner />
  </ErrorBoundary>
);

export default AdminDataPeta;
