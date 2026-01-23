import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { RefreshCw, Settings, Search, LayoutGrid, Activity } from 'lucide-react';
import SidebarItem from './components/SideBarItem';
import './index.css';
import { io } from 'socket.io-client';

const socket = io('http://127.0.0.1:8000');

export default function App() {
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chartSeries, setChartSeries] = useState([{ data: [] }]);
  const [newSymbol, setNewSymbol] = useState("");

  const chartOptions = {
    chart: { type: 'candlestick', height: 350, toolbar: { show: false }, background: '#fff' },
    xaxis: { type: 'datetime' },
    yaxis: { tooltip: { enabled: true } },
    grid: { borderColor: '#f1f1f1' }
  };

  // NEW: Socket listener effect
  useEffect(() => {
    socket.on('price_update', (data) => {
      // 1. Update the main list
      setStocks((currentStocks) =>
        currentStocks.map((s) =>
          s.symbol === data.symbol
            ? { ...s, price: data.price, change: data.change, percent: data.percent }
            : s
        )
      );

      // 2. Update the header if the updated stock is currently selected
      setSelectedStock((currentSelected) => {
        if (currentSelected?.symbol === data.symbol) {
          return { ...currentSelected, price: data.price, change: data.change, percent: data.percent };
        }
        return currentSelected;
      });
    });

    return () => socket.off('price_update');
  }, []);

  const fetchStocks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/tracked');
      const data = await response.json();
      setStocks(data);
      if (selectedStock) {
        const updated = data.find(s => s.symbol === selectedStock.symbol);
        if (updated) setSelectedStock(updated);
      } else if (data.length > 0) {
        setSelectedStock(data[0]);
      }
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await fetch('http://127.0.0.1:8000/refresh', { method: 'POST' });
      await fetchStocks();
    } finally {
      setLoading(false);
    }
  };

  const handleTrackStock = async () => {
    if (!newSymbol) return;
    setLoading(true);
    try {
      await fetch('http://127.0.0.1:8000/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: newSymbol })
      });
      setNewSymbol("");
      await fetchStocks();
    } catch (e) {
      console.error("Error tracking stock:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStocks(); }, []);

  useEffect(() => {
    if (!selectedStock) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/history/${selectedStock.symbol}`);
        const data = await res.json();
        setChartSeries([{ data }]);
      } catch (e) {
        console.error("Error fetching history:", e);
      }
    };
    fetchHistory();
  }, [selectedStock?.symbol]);

  return (
    <div className="flex h-screen w-full bg-[#f8f9fa] overflow-hidden text-gray-900 font-sans">
      
      {/* LEFT SIDEBAR */}
      <aside className="w-72 flex flex-col border-r border-gray-200 bg-white shadow-sm">
        <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2 text-blue-600 font-bold">
            <LayoutGrid size={18} /> <span className="text-xs uppercase tracking-wider">My Watchlist</span>
          </div>
          <button onClick={handleRefresh} className="p-1.5 hover:bg-gray-100 rounded-full transition-all">
            <RefreshCw size={16} className={`${loading ? "animate-spin" : ""} text-gray-500`} />
          </button>
        </div>
        
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input 
              type="text" 
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
              placeholder="Track Symbol (e.g. AAPL)"
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTrackStock()}
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 custom-scrollbar">
          {stocks.map((s) => (
            <SidebarItem 
              key={s.symbol} 
              s={s} 
              isSelected={selectedStock?.symbol === s.symbol}
              onClick={setSelectedStock}
            />
          ))}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Market Bar */}
        <header className="h-10 bg-[#0a0a0a] text-white flex items-center px-4 text-[10px] font-medium gap-8 overflow-x-auto">
          <div className="flex gap-4">
            <span>DOW <span className="text-green-400">23858.67 +0.77%</span></span>
            <span>NASDAQ <span className="text-green-400">6847.71 +0.94%</span></span>
            <span>S&P 500 <span className="text-green-400">2566.83 +0.81%</span></span>
          </div>
        </header>

        {/* Dynamic Header */}
        <div className="p-6 bg-white border-b border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-baseline gap-3">
                <h1 className="text-3xl font-light text-gray-800">{selectedStock?.symbol || '---'}</h1>
                <span className="text-gray-400 text-sm">Apple Inc.</span>
              </div>
              <div className="flex items-baseline gap-4 mt-1">
                <span className="text-4xl font-mono font-medium tracking-tighter text-stock-up animate-pulse-short">
                  {selectedStock?.price?.toFixed(2) || '0.00'}
                </span>
                <span className={`text-lg font-semibold ${selectedStock?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {selectedStock?.change > 0 ? '+' : ''}{selectedStock?.change?.toFixed(2)} ({selectedStock?.percent}%)
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-xs text-gray-500 font-mono">
              <p>OPEN <span className="text-gray-900 ml-2">166.00</span></p>
              <p>HIGH <span className="text-gray-900 ml-2">167.43</span></p>
              <p>LOW <span className="text-gray-900 ml-2">164.96</span></p>
              <p>MKT CAP <span className="text-gray-900 ml-2">{selectedStock?.market_cap || '---'}</span></p>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="p-6 flex-1 overflow-y-auto bg-gray-50/50">
          <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-2">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <Activity size={12} /> Price Action (Daily)
               </span>
            </div>
            <Chart options={chartOptions} series={chartSeries} type="candlestick" height={400} />
          </div>
          
          {/* Secondary Indicators */}
          <div className="mt-6 grid grid-cols-1 gap-6">
            <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm h-40">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Relative Strength Index (12)</p>
              <div className="w-full h-24 mt-4 bg-gray-50 flex items-end px-2">
                 {/* This would be another smaller ApexChart line chart */}
                 <div className="w-full h-[1px] bg-red-200 relative mb-10">
                    <span className="absolute -top-4 right-0 text-[8px] text-red-400">70 OVERBOUGHT</span>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}