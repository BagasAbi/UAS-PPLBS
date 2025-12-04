const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use(express.json());

// URL Service Python (Asumsi jalan di localhost port 5000)
const AI_SERVICE_URL = 'http://127.0.0.1:5000/predict';

// Simulasi Data Stok di Gudang (Nantinya ini dari Database Stock Service)
const MOCK_STOCK_DB = {
    "Health and beauty": 50,
    "Electronic accessories": 15,
    "Home and lifestyle": 100
};

app.post('/api/smart-restock', async (req, res) => {
    try {
        const { product_line } = req.body; // Input dari Postman

        // 1. Cek Stok Saat Ini (Simulasi ambil dari Stock Service)
        const currentStock = MOCK_STOCK_DB[product_line] || 0;
        console.log(`[Gateway] Stok saat ini untuk ${product_line}: ${currentStock}`);

        // 2. Minta Prediksi Permintaan ke AI Service
        console.log(`[Gateway] Meminta prediksi ke AI...`);
        const aiResponse = await axios.post(AI_SERVICE_URL, { product_line });
        const predictedDemand = aiResponse.data.predicted_demand_7_days;
        
        console.log(`[Gateway] Prediksi permintaan 7 hari ke depan: ${predictedDemand}`);

        // 3. Logika Bisnis: Tentukan Risiko & Keputusan Restock
        let riskLevel = "Low";
        let restockNeeded = 0;
        let action = "No Action";

        if (predictedDemand > currentStock) {
            riskLevel = "High (Stockout Imminent)";
            restockNeeded = predictedDemand - currentStock;
            action = "Restock Immediately";
        } else if (predictedDemand > (currentStock * 0.8)) {
            riskLevel = "Medium";
            restockNeeded = Math.max(0, predictedDemand - currentStock + 10); // Buffer 10
            action = "Prepare Restock";
        }

        // 4. Kirim Hasil ke Client (Postman)
        res.json({
            status: "success",
            data: {
                product: product_line,
                current_stock: currentStock,
                ai_forecast_7_days: predictedDemand,
                analysis: {
                    risk_level: riskLevel,
                    shortage_estimation: restockNeeded > 0 ? `Kurang ${restockNeeded} unit` : "Stok Aman",
                    recommendation: action
                }
            }
        });

    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "Gagal memproses smart restock" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Gateway Service running on port ${PORT}`);
});