import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css'; // Boleh pakai CSS bawaan atau kosongkan

function App() {
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ganti URL ini jika backend jalan di port lain
  const GATEWAY_URL = 'http://localhost:3000/api';

  // --- FUNGSI LOGIN ---
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${GATEWAY_URL}/login`, { username, password });
      setToken(res.data.token);
      fetchProducts(); // Ambil data produk setelah login
    } catch (err) {
      alert('Login Gagal! Cek username/password.');
    }
  };

  // --- AMBIL LIST PRODUK ---
  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${GATEWAY_URL}/products`);
      setProducts(res.data);
      if (res.data.length > 0) setSelectedProduct(res.data[0]);
    } catch (err) {
      console.error("Gagal ambil produk");
    }
  };

  // --- MINTA PREDIKSI ---
  const handlePredict = async () => {
    setLoading(true);
    setPrediction(null);
    try {
      const res = await axios.post(`${GATEWAY_URL}/smart-restock`, {
        product_line: selectedProduct
      });
      setPrediction(res.data);
    } catch (err) {
      alert('Gagal mendapatkan prediksi AI');
    }
    setLoading(false);
  };

  // --- TAMPILAN LOGIN ---
  if (!token) {
    return (
      <div className="login-container">
        <h2>🔐 Warehouse Admin Login</h2>
        <form onSubmit={handleLogin} className="login-form">
          <div>
            <label>Username:</label><br/>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Password:</label><br/>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    );
  }

  // --- TAMPILAN DASHBOARD ---
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>📦 Smart Restocking Dashboard</h1>
        <button onClick={() => setToken(null)} className="logout-button">Logout</button>
      </header>

      <div className="prediction-section">
        <h3>🤖 AI Demand Prediction</h3>
        <p>Pilih kategori produk untuk melihat prediksi permintaan minggu depan.</p>
        
        <div className="prediction-controls">
          <select 
            value={selectedProduct} 
            onChange={e => setSelectedProduct(e.target.value)}
          >
            {products.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          
          <button onClick={handlePredict} disabled={loading}>
            {loading ? 'Menganalisis...' : 'Analisis Stok'}
          </button>
        </div>
      </div>

      {prediction && (
        <div className="analysis-result">
          <h2>📊 Hasil Analisis: {prediction.product}</h2>
          
          <div className="stats-grid">
            <div className="stat-card">
              <h4>Stok Saat Ini</h4>
              <p className="stat-value">{prediction.current_stock} Unit</p>
            </div>
            <div className="stat-card">
              <h4>Prediksi Permintaan (7 Hari)</h4>
              <p className="stat-value forecast">
                {prediction.ai_forecast_7_days} Unit
              </p>
            </div>
          </div>

          <div className="recommendation">
            <h4>⚠️ Rekomendasi AI:</h4>
            <p><strong>Status Risiko:</strong> {prediction.analysis.risk_level}</p>
            <p><strong>Saran:</strong> {prediction.analysis.recommendation}</p>
            <p><strong>Estimasi Kekurangan:</strong> {prediction.analysis.shortage_estimation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;