import { useState, useEffect } from "react";
import {
  Button,
  Input,
  useDisclosure,
  Card,
  CardBody,
} from "@nextui-org/react";
import {
  AiOutlinePlus,
  AiOutlineSearch,
  AiOutlineLogout,
  AiOutlineUpload,
  AiOutlineDownload,
  AiOutlineFileText,
} from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import api6 from "../../utils/api6";

import DataTable from "../SidokepungTable/DataTable";
import FormModal from "../SidokepungTable/FormModal";
import DeleteModal from "../SidokepungTable/DeleteModal";
import UploadModal from "../SidokepungTable/UploadModal";
// Hooks
import { useFileUpload } from "../../hooks/useFileUpload";
// Utils & Constants
import { downloadTemplate } from "../SidokepungTable/fileUtils";
import {
  jenisKelaminOptions,
  statusPekerjaanOptions,
  bidangPekerjaanOptions,
} from "../SidokepungTable/option";

const SidokepungTableWrapper = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formData, setFormData] = useState({
    rt: "",
    rw: "",
    umur: "",
    jenis_kelamin: "",
    status_pekerjaan_utama: "",
    bidang_pekerjaan: "",
    nama_anggota: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // Modals
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const {
    isOpen: isUploadOpen,
    onOpen: onUploadOpen,
    onClose: onUploadClose,
  } = useDisclosure();

  const navigate = useNavigate();

  // File upload hook
  const {
    uploadProgress,
    isUploading,
    uploadResults,
    previewData,
    fileInputRef,
    handleFileSelect,
    handleBulkUpload,
    resetUpload,
  } = useFileUpload();

  useEffect(() => {
    const token = localStorage.getItem("token-sidokepung");
    if (!token) {
      navigate("/login-sidokepung");
      return;
    }
    fetchData();
  }, [navigate]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      const response = await api6.get("/api/pekerjaan");
      setDebugInfo(
        `API Status: ${response.status}, Data Count: ${
          response.data?.length || 0
        }`
      );

      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      } else {
        setData([]);
        setError("Format data tidak valid dari server");
      }
    } catch (error) {
      console.error("❌ Error fetching data:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token-sidokepung");
        localStorage.removeItem("username");
        navigate("/login-sidokepung");
      } else {
        setError(
          `Gagal mengambil data: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token-sidokepung");
    localStorage.removeItem("username");
    navigate("/login-sidokepung");
  };

  const handleAdd = () => {
    setSelectedItem(null);
    setFormData({
      rt: "",
      rw: "",
      umur: "",
      jenis_kelamin: "",
      status_pekerjaan_utama: "",
      bidang_pekerjaan: "",
      nama_anggota: "",
    });
    setError("");
    setSuccess("");
    onOpen();
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setFormData({
      rt: item.rt || "",
      rw: item.rw || "",
      umur: item.umur?.toString() || "",
      jenis_kelamin: item.jenis_kelamin || "",
      status_pekerjaan_utama: item.status_pekerjaan_utama || "",
      bidang_pekerjaan: item.bidang_pekerjaan || "",
      nama_anggota: item.nama_anggota || "",
    });
    setError("");
    setSuccess("");
    onOpen();
  };

  const handleDelete = (item) => {
    setSelectedItem(item);
    onDeleteOpen();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // SIMPLIFIED VALIDATION - Semua field sekarang wajib diisi
    const requiredFields = [
      { field: "rt", label: "RT", value: formData.rt },
      { field: "rw", label: "RW", value: formData.rw },
      { field: "umur", label: "Umur", value: formData.umur },
      {
        field: "jenis_kelamin",
        label: "Jenis Kelamin",
        value: formData.jenis_kelamin,
      },
      {
        field: "status_pekerjaan_utama",
        label: "Status Pekerjaan Utama",
        value: formData.status_pekerjaan_utama,
      },
      {
        field: "bidang_pekerjaan",
        label: "Bidang Pekerjaan",
        value: formData.bidang_pekerjaan,
      },
      {
        field: "nama_anggota",
        label: "Nama Anggota",
        value: formData.nama_anggota,
      },
    ];

    // Validasi semua field wajib
    for (const { field, label, value } of requiredFields) {
      if (!value || value.toString().trim() === "") {
        setError(`Field ${label} harus diisi.`);
        setLoading(false);
        return;
      }
    }

    // Validasi umur minimal 15 tahun
    const ageNum = Number.parseInt(formData.umur);
    if (isNaN(ageNum) || ageNum < 15) {
      setError("Umur minimal harus 15 tahun");
      setLoading(false);
      return;
    }

    try {
      if (selectedItem) {
        await api6.put(`/api/pekerjaan/${selectedItem._id}`, formData);
        setSuccess("Data berhasil diperbarui");
      } else {
        await api6.post("/api/pekerjaan", formData);
        setSuccess("Data berhasil ditambahkan");
      }

      await fetchData();
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token-sidokepung");
        localStorage.removeItem("username");
        navigate("/login-sidokepung");
      } else {
        setError(error.response?.data?.message || "Gagal menyimpan data");
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api6.delete(`/api/pekerjaan/${selectedItem._id}`);
      await fetchData();
      onDeleteClose();
      setSuccess("Data berhasil dihapus");
      setTimeout(() => setSuccess(""), 3000);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token-sidokepung");
        localStorage.removeItem("username");
        navigate("/login-sidokepung");
      } else {
        setError("Gagal menghapus data");
      }
    } finally {
      setLoading(false);
    }
  };

  // File upload handlers
  const onFileSelectSuccess = (formattedData) => {
    if (formattedData.length > 0) {
      onUploadOpen();
    }
  };

  const onFileSelectError = (errorMessage) => {
    setError(errorMessage);
  };

  const onUploadSuccess = async (results) => {
    if (results.success > 0) {
      setSuccess(
        `Berhasil mengupload ${results.success} data${
          results.failed > 0 ? `, ${results.failed} data gagal` : ""
        }`
      );
      await fetchData();
    }

    setTimeout(() => {
      onUploadClose();
      resetUpload();
    }, 3000);
  };

  const onUploadError = (errorMessage) => {
    setError(errorMessage);
  };

  const handleDownloadTemplate = () => {
    downloadTemplate((message) => {
      setSuccess(message);
      setTimeout(() => setSuccess(""), 3000);
    });
  };

  // Filter and pagination
  const filteredData = data.filter(
    (item) =>
      item.nama_anggota?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.status_pekerjaan_utama
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.bidang_pekerjaan?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const username = localStorage.getItem("username") || "Admin";

  return (
    <div className="flex flex-col gap-4">
      {/* Messages */}
      {success && (
        <div className="p-4 mb-4 text-green-700 bg-green-100 border border-green-300 rounded-lg">
          {success}
        </div>
      )}
      {error && !isOpen && !isUploadOpen && (
        <div className="p-4 mb-4 text-red-700 bg-red-100 border border-red-300 rounded-lg">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4 p-6 mb-6 bg-white shadow-md rounded-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Input
            placeholder="Cari berdasarkan nama, status pekerjaan, atau bidang pekerjaan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<AiOutlineSearch className="text-gray-400" />}
            className="w-full sm:w-80"
          />
          <div className="flex gap-2 flex-wrap">
            <Button
              color="primary"
              startContent={<AiOutlinePlus />}
              onClick={handleAdd}
              className="bg-green-600"
            >
              Tambah Data
            </Button>
            <Button
              color="secondary"
              variant="flat"
              startContent={<AiOutlineUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              Upload CSV/JSON
            </Button>
            <Button
              color="default"
              variant="flat"
              startContent={<AiOutlineDownload />}
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
          </div>
        </div>

        {/* Upload Info Card */}
        <Card className="bg-blue-50 border-blue-200">
          <CardBody className="p-4">
            <div className="flex items-start gap-3">
              <AiOutlineFileText className="text-blue-600 text-xl mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">
                  Upload Data Massal
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Upload file CSV atau JSON untuk menambahkan banyak data
                  sekaligus.
                </p>
                <p className="text-xs text-blue-600">
                  Format kolom: rt, rw, umur, jenis_kelamin,
                  status_pekerjaan_utama, bidang_pekerjaan, nama_anggota
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={(e) =>
            handleFileSelect(e, onFileSelectSuccess, onFileSelectError)
          }
          style={{ display: "none" }}
        />
      </div>

      {/* Data Table */}
      <div className="p-6 bg-white shadow-md rounded-xl">
        <DataTable
          data={paginatedData}
          loading={loading && !isOpen && !isUploadOpen}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Modals */}
      <FormModal
        isOpen={isOpen}
        onClose={onClose}
        selectedItem={selectedItem}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        loading={loading}
        error={error}
        success={success}
        jenisKelaminOptions={jenisKelaminOptions}
        statusPekerjaanOptions={statusPekerjaanOptions}
        bidangPekerjaanOptions={bidangPekerjaanOptions}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={onUploadClose}
        previewData={previewData}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        uploadResults={uploadResults}
        error={error}
        onUpload={() => handleBulkUpload(onUploadSuccess, onUploadError)}
      />

      <DeleteModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        selectedItem={selectedItem}
        onConfirm={confirmDelete}
        loading={loading}
      />
    </div>
  );
};

export default SidokepungTableWrapper;
