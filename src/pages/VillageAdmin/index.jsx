import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import api6 from "../../utils/api6";

import SummaryTab from "./SummaryTab";
import InsightManagementTab from "./InsightManagementTab";
import DataUploader from "../../components/DataUploader";
import SidokepungTableWrapper from "../../components/SidokepungTableWrapper";
import SimoketawangUsahaTable from "../../components/SimoketawangUsahaTable";
import GrogolUsahaTable from "../../components/GrogolUsahaTable";

const VillageAdmin = () => {
  const { nama_desa } = useParams();
  const location = useLocation();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);

  const isUpdatePeta = location.pathname.toLowerCase().includes('/update-peta');

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await api6.get("/api/village-themes");
        const themeMap = response.data;
        
        // Find by uppercase name
        const currentVillageKey = Object.keys(themeMap).find(
          key => key.toUpperCase() === (nama_desa || "").toUpperCase()
        );

        if (currentVillageKey && themeMap[currentVillageKey]) {
          setThemes(themeMap[currentVillageKey]);
        } else {
          setThemes([]); // No themes configured
        }
      } catch (error) {
        console.error("Failed to fetch themes", error);
      } finally {
        setLoading(false);
      }
    };
    fetchThemes();
  }, [nama_desa]);

  return (
    <AdminLayout pageTitle={`Admin Desa ${nama_desa?.toUpperCase()}`}>
      <div className="flex flex-col gap-5 pt-5 sm:px-6 mb-16 h-full pb-10">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 w-full">
          <div className="w-full flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <div>
               <h3 className="font-bold text-blue-900 text-lg">
                 {isUpdatePeta ? "Update Data Peta" : "Dashboard Utama"}
               </h3>
               <p className="text-sm text-blue-700 mt-1">
                 Mengelola data sesuai potensi tema: {themes.length > 0 ? themes.join(", ") : "Belum diatur"}
               </p>
             </div>
          </div>
        </div>

        {loading ? (
           <div className="animate-pulse text-center mt-10 text-gray-500">Memuat konfigurasi tema...</div>
        ) : (
          <div className="flex w-full flex-col font-inter mt-2 animate-fadeIn">
            {isUpdatePeta ? (
              <DataUploader nama_desa={nama_desa} themes={themes} />
            ) : (
                <div className="flex flex-col gap-8">
                  <InsightManagementTab nama_desa={nama_desa} />
                  
                  {nama_desa?.toUpperCase() === "SIDOKEPUNG" && <SidokepungTableWrapper />}
                  {/* {nama_desa?.toUpperCase() === "SIMOKETAWANG" && <SimoketawangUsahaTable />} */}
                  {/* {nama_desa?.toUpperCase() === "GROGOL" && <GrogolUsahaTable />} */}
                  
                  <SummaryTab nama_desa={nama_desa} />
                </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default VillageAdmin;
