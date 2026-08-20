import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";

const UmkmCharts = ({ data }) => {
  // Aggregate data by RT and Dusun
  const aggregated = useMemo(() => {
    const rtMap = {};
    const dusunMap = {};

    if (Array.isArray(data)) {
      data.forEach((item) => {
        const rt = item.rt || "0";
        let dusun = item.dusun && item.dusun !== "-" ? item.dusun : "Lainnya";
        if (dusun.toUpperCase().includes("DUSUN")) {
          const split = dusun.toUpperCase().split("DUSUN");
          dusun = split[1].trim();
        }
        
        // Capitalize words
        dusun = dusun.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
        
        const count = item.jml_umkm || 1;

        rtMap[rt] = (rtMap[rt] || 0) + count;
        dusunMap[dusun] = (dusunMap[dusun] || 0) + count;
      });
    }

    const topRts = Object.entries(rtMap)
      .map(([name, value]) => ({ name: `RT ${name}`, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const topDusuns = Object.entries(dusunMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      topRts,
      topDusuns,
    };
  }, [data]);

  const rtOptions = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "8%", bottom: "3%", top: "5%", containLabel: true },
    xAxis: { 
      type: "value",
      axisLabel: { hideOverlap: true, fontSize: 10 },
      splitNumber: 3
    },
    yAxis: {
      type: "category",
      data: aggregated.topRts.map((d) => d.name).reverse(),
      axisLabel: { interval: 0, width: 85, overflow: 'break', fontSize: 10, lineHeight: 12 }
    },
    series: [
      {
        name: "Jumlah UMKM",
        type: "bar",
        data: aggregated.topRts.map((d) => d.value).reverse(),
        itemStyle: { color: "#6366f1", borderRadius: [0, 5, 5, 0] },
      },
    ],
  };

  const dusunOptions = {
    tooltip: { trigger: "item", textStyle: { fontSize: 10 } },
    legend: { 
      type: "scroll", 
      orient: "vertical", 
      right: "0%", 
      top: "center",
      textStyle: { fontSize: 10, width: 90, overflow: "truncate" }
    },
    color: ["#3b82f6", "#f59e0b", "#10b981", "#ec4899", "#8b5cf6"],
    series: [
      {
        name: "Dusun",
        type: "pie",
        radius: ["50%", "80%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        labelLine: { show: false },
        data: aggregated.topDusuns,
      },
    ],
  };

  if (!data || data.length === 0) return null;

  return (
    <div className="w-full flex flex-col space-y-2">
      <div className="bg-white rounded-lg border border-gray-100 p-2">
        <h3 className="text-center font-bold text-gray-700 mb-0 text-xs">
          Top 5 RT Terbanyak
        </h3>
        <ReactECharts
          option={rtOptions}
          style={{ height: 210, width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>

      <div className="bg-white rounded-lg border border-gray-100 p-2 mt-2">
        <h3 className="text-center font-bold text-gray-700 mb-0 text-xs">
          Persebaran per Dusun
        </h3>
        <ReactECharts
          option={dusunOptions}
          style={{ height: 160, width: "100%" }}
          opts={{ renderer: "svg" }}
        />
      </div>
    </div>
  );
};

export default UmkmCharts;
