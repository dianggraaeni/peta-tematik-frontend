import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import AdminLayout from "../../components/AdminLayout";
import { Tabs, Tab } from "@nextui-org/react";
import { useMediaQuery } from "react-responsive";
import api6 from "../../utils/api6"; // Using our centralized backend for themes

import SidokepungTableWrapper from "../../components/SidokepungTableWrapper";
import SimoketawangSlsTable from "../../components/SimoketawangSlsTable";
import SimoketawangUsahaTable from "../../components/SimoketawangUsahaTable";
import GrogolSlsTable from "../../components/GrogolSlsTable";
import GrogolUsahaTable from "../../components/GrogolUsahaTable";
import RtTable from "../../components/RtTable"; 
import RutaTable from "../../components/RutaTable"; 
import SummaryTab from "./SummaryTab";
import InsightManagementTab from "./InsightManagementTab";

const VillageAdmin = () => {
  const { nama_desa } = useParams();
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery({ query: "(max-width: 500px)" });

  useEffect(() => {
    const fetchThemes = async () => {
      try {
        const response = await api6.get("/api/village-themes"); // Calling our new backend endpoint
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

  const desaUpper = (nama_desa || "").toUpperCase();

  let slsContent = null;
  let umkmContent = null;
  let taniContent = null;

  if (desaUpper === "GROGOL") {
    slsContent = <GrogolSlsTable fetchDataAggregate={() => {}} />;
    if (themes.includes("Pertanian Pertambangan")) {
      taniContent = <GrogolUsahaTable />;
    }
  } else if (desaUpper === "SIMOKETAWANG" || desaUpper === "KETAWANG") {
    slsContent = <SimoketawangSlsTable fetchDataAggregate={() => {}} />;
    if (themes.includes("Ekonomi Perdagangan")) {
      umkmContent = <SimoketawangUsahaTable />;
    }
  } else if (desaUpper === "SIMOANGINANGIN") {
    slsContent = <RtTable />;
    if (themes.includes("Ekonomi Perdagangan")) {
      umkmContent = <RutaTable />;
    }
  }

  const tabs = [
    {
      id: "ringkasan",
      label: isMobile ? "Ringkasan" : "Ringkasan Statistik",
      content: <SummaryTab nama_desa={nama_desa} />,
    },
    {
      id: "insight",
      label: isMobile ? "Insight" : "Manajemen Insight",
      content: <InsightManagementTab nama_desa={nama_desa} />,
    }
  ];

  if (slsContent) {
    tabs.push({
      id: "sls",
      label: isMobile ? "SLS" : "Satuan Lingkungan Setempat",
      content: slsContent,
    });
  }

  if (themes.includes("Sosial Kependudukan")) {
    tabs.push({
      id: "sosial",
      label: isMobile ? "Sosial" : "Kependudukan & Pekerjaan",
      content: <SidokepungTableWrapper />,
    });
  }

  if (umkmContent) {
    tabs.push({
      id: "ekonomi",
      label: isMobile ? "UMKM" : "Data UMKM",
      content: umkmContent,
    });
  }

  if (taniContent) {
    tabs.push({
      id: "pertanian",
      label: isMobile ? "Tani" : "Usaha Tani",
      content: taniContent,
    });
  }

  return (
    <AdminLayout pageTitle={`Admin Desa ${nama_desa?.toUpperCase()}`}>
      <div className="flex flex-col gap-5 pt-5 sm:px-6 mb-16 h-full pb-10">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 w-full">
          <div className="w-full flex justify-between items-center bg-blue-50/50 p-4 rounded-xl border border-blue-100">
             <div>
               <h3 className="font-bold text-blue-900 text-lg">Panel Manajemen Data</h3>
               <p className="text-sm text-blue-700 mt-1">Mengelola data sesuai potensi tema: {themes.length > 0 ? themes.join(", ") : "Belum diatur"}</p>
             </div>
          </div>
        </div>

        {loading ? (
           <div className="animate-pulse text-center mt-10 text-gray-500">Memuat konfigurasi tema...</div>
        ) : (
          <div className="flex w-full flex-col font-inter">
            <Tabs 
              aria-label="Dynamic Theme Tabs" 
              items={tabs}
              color="primary"
              variant="underlined"
              classNames={{
                tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                cursor: "w-full bg-[#1e40af]",
                tab: "max-w-fit px-0 h-12",
                tabContent: "group-data-[selected=true]:text-[#1e40af] group-data-[selected=true]:font-bold text-[#6b7280]"
              }}
            >
              {(item) => (
                <Tab key={item.id} title={item.label}>
                  <div className="mt-4 animate-fadeIn">
                    {item.content}
                  </div>
                </Tab>
              )}
            </Tabs>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default VillageAdmin;
