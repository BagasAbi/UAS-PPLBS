const express = require('express');
const axios = require('axios');
const cors = require('cors'); // Tambahkan ini
const app = express();
const PORT = 3000;
 
app.use(express.json());
app.use(cors()); // Izinkan semua domain akses (untuk dev)

// --- MOCK DATABASE (Sederhana) ---
const USERS = {
    "admin": "password123"
};

// --- ENDPOINT LOGIN ---
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (USERS[username] && USERS[username] === password) {
        // Di real world, return JWT Token di sini
        res.json({ status: "success", token: "dummy-token-123", role: "admin" });
    } else {
        res.status(401).json({ error: "Username atau password salah" });
    }
});

// URL Service Python (Asumsi jalan di localhost port 5000)
const AI_SERVICE_URL = 'http://127.0.0.1:5000/predict';

// Simulasi Data Stok di Gudang (Nantinya ini dari Database Stock Service)
const MOCK_STOCK_DB = {
    "Health and beauty": 50,
    "Electronic accessories": 15,
    "Home and lifestyle": 100
};

// --- ENDPOINT LIST PRODUK ---
// Agar frontend bisa bikin dropdown menu
app.get('/api/products', (req, res) => {
    res.json(Object.keys(MOCK_STOCK_DB));
});

// --- ENDPOINT SMART RESTOCK ---
app.post('/api/smart-restock', async (req, res) => {
    try {
        // Frontend mengirim 'product_line', ini harus konsisten
        const { product_line } = req.body;

        if (!product_line) {
            return res.status(400).json({ error: "product_line harus diisi" });
        }
        
        const current_stock = MOCK_STOCK_DB[product_line];
        if (current_stock === undefined) {
            return res.status(404).json({ error: "Produk tidak ditemukan di MOCK_STOCK_DB" });
        }

        // FIX 1: Panggil ke port 5000 dan gunakan 'product_line'
        const predictionResponse = await axios.post('http://127.0.0.1:5000/predict', {
            product_line: product_line 
        });

        const predictionData = predictionResponse.data;
        const forecast = predictionData.predicted_demand_7_days || 0;
        const shortage = Math.max(0, forecast - current_stock);

        // FIX 2: Susun objek yang kompleks sesuai harapan frontend
        const responseForFrontend = {
            product: product_line,
            current_stock: current_stock,
            ai_forecast_7_days: forecast,
            analysis: {
                risk_level: shortage > current_stock ? "High" : (shortage > 0 ? "Medium" : "Low"),
                recommendation: `Untuk menutupi prediksi permintaan (${forecast} unit), disarankan untuk restock minimal ${shortage} unit.`,
                shortage_estimation: shortage
            }
        };

        res.json(responseForFrontend);

    } catch (error) {
        // Beri pesan error yang lebih jelas
        let errorMessage = "Gagal menghubungi prediction service.";
        if (error.code === 'ECONNREFUSED') {
            errorMessage = "Koneksi ke prediction service (port 5000) ditolak. Pastikan service tersebut sudah berjalan."
        } else if (error.response) {
            errorMessage = `Prediction service error: ${error.response.data.error || 'Unknown error'}`;
        }
        console.error("Error detail:", error.message);
        res.status(500).json({ error: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Gateway Service running on port ${PORT}`);
});