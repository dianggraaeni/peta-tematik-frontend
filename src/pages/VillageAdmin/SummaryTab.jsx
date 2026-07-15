import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import api3 from "../../utils/api3";
import api4 from "../../utils/api4";
import api6 from "../../utils/api6";
import { formatNumberWithSpace } from "../../utils/formatNumberWithSpace";
import { dataLabels, dataLabelGrogol, dataLabelSimoketawang } from "../data";
import { message } from "antd";

const StatComponent = ({ label, value }) => {
  return (
    <div className="flex items-center justify-between w-full p-3 border border-blue-100 bg-blue-50/30 rounded-xl font-inter text-gray-700 shadow-sm transition-transform hover:-translate-y-1">
      <div className="flex justify-between items-center w-full text-sm">
        <span className="font-semibold">{label}</span>
        <span className="ml-2 font-bold text-blue-900 bg-white px-3 py-1 rounded-lg shadow-sm">{value}</span>
      </div>
    </div>
  );
};

const SummaryTab = ({ nama_desa }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const desaUpper = (nama_desa || "").toUpperCase();
        
        if (desaUpper === "GROGOL") {
          const response = await api4.get("/api/sls/all/aggregate");
          setData(response.data.data);
        } else if (desaUpper === "SIMOKETAWANG" || desaUpper === "KETAWANG") {
          const response = await api3.get("/api/sls/all/aggregate");
          setData(response.data.data);
        } else if (desaUpper === "SIMOANGINANGIN") {
          const response = await api.get("/api/rt/all/aggregate");
          setData(response.data.data);
        } else if (desaUpper === "SIDOKEPUNG") {
          const response = await api6.get("/api/pekerjaan");
          const pekerjaanData = response.data || [];
          
          const totalPenduduk = pekerjaanData.length;
          const lakiLaki = pekerjaanData.filter(d => d.jenis_kelamin === "Laki-laki").length;
          const perempuan = pekerjaanData.filter(d => d.jenis_kelamin === "Perempuan").length;
          
          const bekerja = pekerjaanData.filter(d => d.status_pekerjaan_utama === "Bekerja").length;
          const tidakBekerja = pekerjaanData.filter(d => d.status_pekerjaan_utama === "Tidak Bekerja").length;
          
          setData({
             total_penduduk: totalPenduduk,
             laki_laki: lakiLaki,
             perempuan: perempuan,
             bekerja: bekerja,
             tidak_bekerja: tidakBekerja
          });
        }
      } catch (error) {
        if (error.response?.data?.message) {
          message.error(`Terjadi kesalahan: ${error.response.data.message}`, 5);
        } else {
          message.error(`Gagal memuat statistik.`, 5);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [nama_desa]);

  const desaUpper = (nama_desa || "").toUpperCase();
  let labelsToUse = [];

  if (desaUpper === "GROGOL") {
    labelsToUse = dataLabelGrogol;
  } else if (desaUpper === "SIMOKETAWANG" || desaUpper === "KETAWANG") {
    labelsToUse = dataLabelSimoketawang;
  } else if (desaUpper === "SIMOANGINANGIN") {
    labelsToUse = dataLabels;
  } else if (desaUpper === "SIDOKEPUNG") {
    labelsToUse = [
      { key: "total_penduduk", label: "Total Penduduk" },
      { key: "laki_laki", label: "Laki-laki" },
      { key: "perempuan", label: "Perempuan" },
      { key: "bekerja", label: "Bekerja" },
      { key: "tidak_bekerja", label: "Tidak Bekerja" }
    ];
  } else {
    // For other villages like Sidokepung that might not have custom dataLabels yet
    return (
      <div className="flex justify-center items-center h-40 text-gray-500 italic bg-gray-50 rounded-xl border border-dashed border-gray-200 mt-2">
        Ringkasan statistik khusus untuk desa {desaUpper} belum tersedia.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="h-14 bg-gray-100 animate-pulse rounded-xl border border-gray-200"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-4 mt-2 bg-white rounded-xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data && labelsToUse.map(({ key, label }) => {
          const value = data[key];
          return (
            <StatComponent
              key={key}
              label={label}
              value={typeof value === "number" ? formatNumberWithSpace(value) : 0}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SummaryTab;
