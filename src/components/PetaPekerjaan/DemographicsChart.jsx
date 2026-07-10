import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";

// komponen yang dibutuhkan oleh Chart.js agar bisa digunakan
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Title,
  CategoryScale,
  LinearScale,
  BarElement
);

const DemographicsChart = ({ chartData, chartType = "doughnut" }) => {
  if (!chartData || !chartData.labels || !chartData.values) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Data tidak tersedia untuk area ini.
      </div>
    );
  }

  const data = {
    labels: chartData.labels,
    datasets: [
      {
        label: "Jumlah",
        data: chartData.values,
        backgroundColor:
          chartType === "doughnut"
            ? chartData.colors
            : chartData.colors.map((color) => `${color}E6`),
        borderColor: chartType === "doughnut" ? "#ffffff" : chartData.colors,
        borderWidth: chartType === "doughnut" ? 3 : 2,
        borderRadius: chartType === "bar" ? 6 : 0,
        borderSkipped: false,
        hoverBackgroundColor:
          chartType === "doughnut"
            ? chartData.colors.map((color) => `${color}CC`)
            : chartData.colors,
        hoverBorderColor:
          chartType === "doughnut" ? "#f3f4f6" : chartData.colors,
        hoverBorderWidth: chartType === "doughnut" ? 4 : 3,
      },
    ],
  };

  // Konfigurasi Doughnut chart
  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: chartData.title,
        padding: {
          bottom: 20,
          top: 10,
        },
        font: {
          size: 18,
          weight: "bold",
        },
        color: "#1f2937",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#4f46e5",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          },
        },
      },
    },
    elements: {
      arc: {
        borderWidth: 3,
        borderColor: "#ffffff",
        hoverBorderWidth: 4,
        hoverBorderColor: "#f3f4f6",
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000,
    },
  };

  // Konfigurasi Bar chart
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: {
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: chartData.title,
        padding: {
          bottom: 20,
          top: 10,
        },
        font: {
          size: 18,
          weight: "bold",
        },
        color: "#1f2937",
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "#ffffff",
        bodyColor: "#ffffff",
        borderColor: "#4f46e5",
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed.y / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed.y} (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 12,
            weight: "500",
          },
          color: "#6b7280",
        },
        grid: {
          color: "rgba(156, 163, 175, 0.2)",
          lineWidth: 1,
        },
        border: {
          color: "#d1d5db",
        },
      },
      x: {
        ticks: {
          display: false,
          font: {
            size: 11,
            weight: "500",
          },
          maxRotation: 45,
          minRotation: 0,
          color: "#6b7280",
        },
        grid: {
          display: false,
        },
        border: {
          color: "#d1d5db",
        },
      },
    },
    elements: {
      bar: {
        borderRadius: {
          topLeft: 6,
          topRight: 6,
          bottomLeft: 0,
          bottomRight: 0,
        },
        borderSkipped: false,
      },
    },
    interaction: {
      intersect: false,
      mode: "index",
    },
    animation: {
      duration: 1000,
      easing: "easeInOutQuart",
    },
  };

  if (chartType === "bar") {
    return <Bar data={data} options={barOptions} />;
  }

  return <Doughnut data={data} options={doughnutOptions} />;
};

export default DemographicsChart;
