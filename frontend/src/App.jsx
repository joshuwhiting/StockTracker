import { useState, useEffect } from 'react'

function App() {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);

  // Function to fetch stocks from Flask
  const fetchStocks = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/tracked');
      const data = await response.json();
      setStocks(data);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  // Function to trigger the refresh
  const handleRefresh = async () => {
    setLoading(true);
    await fetch('http://127.0.0.1:8000/refresh', { method: 'POST' });
    await fetchStocks(); // Get updated data after refresh
    setLoading(false);
  };

  // Run fetchStocks once when the page loads
  useEffect(() => {
    fetchStocks();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Stock Tracker</h1>
      <button onClick={handleRefresh} disabled={loading}>
        {loading ? "Refreshing..." : "🔄 Refresh All"}
      </button>

      <div style={{ marginTop: '20px' }}>
        {stocks.map((s) => (
          <div key={s.symbol} style={{ border: '1px solid #ccc', margin: '10px 0', padding: '10px' }}>
            <strong>{s.symbol}</strong>: {s.currency} {s.price}
            <br />
            <small>Market Cap: {s.market_cap}</small>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App