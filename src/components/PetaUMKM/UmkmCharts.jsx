import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

const UmkmCharts = ({ data }) => {
  // Aggregate data
  const aggregated = useMemo(() => {
    let mikro = 0;
    let kecil = 0;
    let menengah = 0;

    let bangunan = 0;
    let campuran = 0;
    let kakilima = 0;
    let keliling = 0;
    let online = 0;

    if (Array.isArray(data)) {
      data.forEach((item) => {
        mikro += item.jml_umkm_skala_usaha_mikro || 0;
        kecil += item.jml_umkm_skala_usaha_kecil || 0;
        menengah += item.jml_umkm_skala_usaha_menengah || 0;

        bangunan += item.jml_umkm_lokasi_bangunan_khusus_usaha || 0;
        campuran += item.jml_umkm_lokasi_bangunan_campuran || 0;
        kakilima += item.jml_umkm_lokasi_kaki_lima || 0;
        keliling += item.jml_umkm_lokasi_keliling || 0;
        online += item.jml_umkm_lokasi_didalam_bangunan_tempat_tinggal_online || 0;
      });
    }

    return {
      skala: [
        { value: mikro, name: "Mikro" },
        { value: kecil, name: "Kecil" },
        { value: menengah, name: "Menengah" },
      ].filter((d) => d.value > 0),
      lokasi: [
        { value: bangunan, name: "Bangunan Khusus" },
        { value: campuran, name: "Campuran" },
        { value: kakilima, name: "Kaki Lima" },
        { value: keliling, name: "Keliling" },
        { value: online, name: "Dalam Rumah / Online" },
      ].sort((a, b) => b.value - a.value),
    };
  }, [data]);

  const skalaOptions = {
    tooltip: { trigger: "item" },
    legend: { bottom: "0%", left: "center" },
    color: ["#3b82f6", "#f59e0b", "#10b981"],
    series: [
      {
        name: "Skala Usaha",
        type: "pie",
        radius: ["40%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false, position: "center" },
        emphasis: {
          label: { show: true, fontSize: 16, fontWeight: "bold" },
        },
        labelLine: { show: false },
        data: aggregated.skala,
      },
    ],
  };

  const lokasiOptions = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: { 
      type: "value",
      axisLabel: { hideOverlap: true, fontSize: 10 },
      splitNumber: 3
    },
    yAxis: {
      type: "category",
      data: aggregated.lokasi.map((d) => d.name).reverse(),
      axisLabel: { interval: 0, width: 85, overflow: 'break', fontSize: 10, lineHeight: 12 }
    },
    series: [
      {
        name: "Jumlah",
        type: "bar",
        data: aggregated.lokasi.map((d) => d.value).reverse(),
        itemStyle: { color: "#6366f1", borderRadius: [0, 5, 5, 0] },
      },
    ],
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <h3 className="text-center font-bold text-gray-700 mb-0 text-xs">
          Distribusi Skala Usaha
        </h3>
        <ReactECharts
          option={skalaOptions}
          style={{ height: 160, width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <h3 className="text-center font-bold text-gray-700 mb-0 text-xs">
          Lokasi Usaha Terbanyak
        </h3>
        <ReactECharts
          option={lokasiOptions}
          style={{ height: 210, width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>
    </div>
  );
};

export default UmkmCharts;
