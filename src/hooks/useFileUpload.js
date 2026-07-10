import { useState, useRef } from "react";
import api6 from "../utils/api6";

export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);

  const parseCSV = (csvText) => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || "";
      });
      return obj;
    });
  };

  const validateAndFormatData = (rawData) => {
    if (!Array.isArray(rawData)) {
      throw new Error("Data harus berupa array");
    }

    return rawData.map((item, index) => {
      const mappedItem = {
        rt: item.rt || item.RT || item.Rt || "",
        rw: item.rw || item.RW || item.Rw || "",
        umur: item.umur || item.age || item.Age || item.UMUR || "",
        jenis_kelamin:
          item.jenis_kelamin ||
          item.gender ||
          item.Gender ||
          item.JENIS_KELAMIN ||
          "",
        status_pekerjaan_utama:
          item.status_pekerjaan_utama ||
          item.job_status ||
          item.pekerjaan ||
          item.STATUS_PEKERJAAN_UTAMA ||
          "",
        nama_anggota:
          item.nama_anggota ||
          item.name ||
          item.Name ||
          item.nama ||
          item.NAMA_ANGGOTA ||
          "",
        bidang_pekerjaan:
          item.bidang_pekerjaan ||
          item.job_field ||
          item.work_field ||
          item.BIDANG_PEKERJAAN ||
          item.bidang ||
          "",
      };

      const errors = [];
      if (!mappedItem.rt) errors.push("RT");
      if (!mappedItem.rw) errors.push("RW");
      if (!mappedItem.umur) errors.push("Umur");
      if (!mappedItem.jenis_kelamin) errors.push("Jenis Kelamin");
      if (!mappedItem.status_pekerjaan_utama) errors.push("Status Pekerjaan");
      if (!mappedItem.nama_anggota) errors.push("Nama Anggota");
      // Note: bidang_pekerjaan is optional, so no validation error added

      return {
        ...mappedItem,
        _index: index + 1,
        _errors: errors,
        _isValid: errors.length === 0,
      };
    });
  };

  const handleFileSelect = (event, onSuccess, onError) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split(".").pop().toLowerCase();

    if (!["csv", "json"].includes(fileExtension)) {
      onError("Format file tidak didukung. Gunakan file CSV atau JSON.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let parsedData = [];

        if (fileExtension === "csv") {
          parsedData = parseCSV(e.target.result);
        } else if (fileExtension === "json") {
          parsedData = JSON.parse(e.target.result);
        }

        const formattedData = validateAndFormatData(parsedData);
        setPreviewData(formattedData);
        onSuccess(formattedData);
      } catch (error) {
        console.error("Error parsing file:", error);
        onError(`Gagal membaca file: ${error.message}`);
      }
    };

    reader.readAsText(file);
  };

  const handleBulkUpload = async (onSuccess, onError) => {
    const validData = previewData.filter((item) => item._isValid);

    if (validData.length === 0) {
      onError("Tidak ada data valid untuk diupload");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [],
      };

      for (let i = 0; i < validData.length; i++) {
        const item = validData[i];
        const cleanItem = {
          rt: item.rt,
          rw: item.rw,
          umur: item.umur,
          jenis_kelamin: item.jenis_kelamin,
          status_pekerjaan_utama: item.status_pekerjaan_utama,
          nama_anggota: item.nama_anggota,
          bidang_pekerjaan: item.bidang_pekerjaan,
        };

        try {
          await api6.post("/api/pekerjaan", cleanItem);
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            row: item._index,
            name: item.nama_anggota,
            error: error.response?.data?.message || error.message,
          });
        }

        setUploadProgress(((i + 1) / validData.length) * 100);
      }

      setUploadResults(results);
      onSuccess(results);
    } catch (error) {
      console.error("Bulk upload error:", error);
      onError(`Gagal mengupload data: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setPreviewData([]);
    setUploadResults(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    uploadProgress,
    isUploading,
    uploadResults,
    previewData,
    fileInputRef,
    handleFileSelect,
    handleBulkUpload,
    resetUpload,
  };
};
