import React from "react";
import Chart from "react-apexcharts";
import { Activity } from "lucide-react";

const StockChart = ({ series }) => {
  const chartOptions = {
    chart: {
      type: "candlestick",
      height: 350,
      toolbar: { show: false },
      background: "#fff",
    },
    xaxis: { type: "datetime" },
    yaxis: { tooltip: { enabled: true } },
    grid: { borderColor: "#f1f1f1" },
  };

  return (
    <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
          <Activity size={12} /> Price Action (Daily)
        </span>
      </div>
      <Chart
        options={chartOptions}
        series={series}
        type="candlestick"
        height={400}
      />
    </div>
  );
};

export default StockChart;
