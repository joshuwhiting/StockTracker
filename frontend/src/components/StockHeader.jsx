import React from "react";

const StockHeader = ({ selectedStock }) => {
  console.log("Current Selected Stock:", selectedStock); // Open Browser Console (F12) to see this
  return (
    <div className="p-6 bg-white border-b border-gray-200">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-baseline gap-3">
            <h1 className="text-3xl font-light text-gray-800">
              {selectedStock?.symbol || "---"}
            </h1>
            <span className="text-gray-400 text-sm">
              {selectedStock?.["longName"]}
            </span>
          </div>
          <div className="flex items-baseline gap-4 mt-1">
            <span className="text-4xl font-mono font-medium tracking-tighter text-stock-up animate-pulse-short">
              {selectedStock?.price?.toFixed(2) || "0.00"}
            </span>
            <span
              className={`text-lg font-semibold ${
                selectedStock?.change >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {selectedStock?.change > 0 ? "+" : ""}
              {selectedStock?.change?.toFixed(2)} ({selectedStock?.percent}
              %)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-500 font-mono">
          <p>
            OPEN{" "}
            <span className="text-gray-900 ml-2">{selectedStock?.open}</span>
          </p>
          <p>
            HIGH{" "}
            <span className="text-gray-900 ml-2">{selectedStock?.dayHigh}</span>
          </p>
          <p>
            LOW{" "}
            <span className="text-gray-900 ml-2">{selectedStock?.dayLow}</span>
          </p>
          <p>
            MKT CAP{" "}
            <span className="text-gray-900 ml-2">
              {selectedStock?.market_cap || "---"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default StockHeader;
