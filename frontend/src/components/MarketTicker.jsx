import React from "react";

const MarketTicker = () => {
  return (
    <header className="h-10 bg-[#0a0a0a] text-white flex items-center px-4 text-[10px] font-medium gap-8 overflow-x-auto">
      <div className="flex gap-4">
        <span>
          DOW <span className="text-green-400">23858.67 +0.77%</span>
        </span>
        <span>
          NASDAQ <span className="text-green-400">6847.71 +0.94%</span>
        </span>
        <span>
          S&P 500 <span className="text-green-400">2566.83 +0.81%</span>
        </span>
      </div>
    </header>
  );
};

export default MarketTicker;
