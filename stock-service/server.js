require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3003; // Port for stock-service

app.use(cors());
app.use(bodyParser.json());

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);



// --- ENDPOINT LIST PRODUK ---
app.get('/products', async (req, res) => {
    try {
        let { data: products, error } = await supabase
            .from('products')
            .select('name');

        if (error) {
            throw error;
        }

        res.json(products.map(p => p.name));

    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil daftar produk" });
    }
});

app.post('/api/stock/check', async (req, res) => {
    const { product_name, quantity } = req.body;

    try {
        // Find product by name
        let { data: product, error } = await supabase
            .from('products')
            .select('id, current_stock')
            .eq('name', product_name)
            .single();

        if (error || !product) {
            return res.status(404).json({ error: "Produk tidak ditemukan" });
        }

        // Check if stock is sufficient
        if (product.current_stock < quantity) {
            return res.status(400).json({ error: "Stok tidak mencukupi" });
        }

        res.json({ product_id: product.id });

    } catch (error) {
        res.status(500).json({ error: "Gagal memeriksa stok" });
    }
});

app.post('/api/stock/update', async (req, res) => {
    const { product_id, quantity } = req.body;

    try {
        // Fetch current stock
        let { data: product, error } = await supabase
            .from('products')
            .select('current_stock')
            .eq('id', product_id)
            .single();

        if (error || !product) {
            return res.status(404).json({ error: "Produk tidak ditemukan" });
        }

        // Calculate and update new stock
        const new_stock = product.current_stock - quantity;
        const { data: updated_product, error: update_error } = await supabase
            .from('products')
            .update({ current_stock: new_stock })
            .eq('id', product_id);

        if (update_error) {
            throw update_error;
        }

        res.json({ remaining_stock: new_stock });

    } catch (error) {
        res.status(500).json({ error: "Gagal memperbarui stok" });
    }
});

// --- ENDPOINT SMART RESTOCK ---
app.post('/smart-restock', async (req, res) => {
    console.log("STOCK-SERVICE: Menerima permintaan /smart-restock");
    try {
        const { product_line } = req.body;

        if (!product_line) {
            return res.status(400).json({ error: "product_line harus diisi" });
        }
        
        let { data: product, error } = await supabase
            .from('products')
            .select('current_stock')
            .eq('name', product_line)
            .single();

        if (error || !product) {
            return res.status(404).json({ error: "Produk tidak ditemukan" });
        }
        
        const current_stock = product.current_stock;
        console.log(`STOCK-SERVICE: Stok saat ini untuk ${product_line}: ${current_stock}`);

        console.log("STOCK-SERVICE: Memanggil prediction service...");
        // Panggil prediction service dengan timeout 5 detik
        const predictionResponse = await axios.post(`${process.env.PREDICTION_SERVICE_URL}/predict`, {
            product_line: product_line 
        }, {
            timeout: 5000 // Timeout dalam milidetik (5000ms = 5 detik)
        });
        console.log("STOCK-SERVICE: Menerima respons dari prediction service.");

        const predictionData = predictionResponse.data;
        // Pastikan predictionData memiliki struktur yang diharapkan, jika tidak, default ke 0
        // Ini untuk mencegah error jika prediction service mengembalikan data yang tidak lengkap
        const forecast = predictionData.predicted_demand_7_days || 0;
        const shortage = Math.max(0, forecast - current_stock);

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

        console.log("STOCK-SERVICE: Mengirim respons sukses ke gateway.");
        res.json(responseForFrontend);

    } catch (error) {
        // Log detail error secara lengkap
        console.error("--- STOCK-SERVICE ERROR IN /smart-restock ---");
        console.error("Error message:", error.message);
        console.error("Error code:", error.code);
        console.error("Error stack:", error.stack); // Stack trace sangat membantu
        if (error.response) {
            console.error("Error response data:", error.response.data);
        }
        console.error("-------------------------------------------");

        let errorMessage = "Gagal menghubungi prediction service.";
        if (error.code === 'ECONNABORTED') {
            errorMessage = "Proses prediksi AI memakan waktu terlalu lama (lebih dari 5 detik) dan dibatalkan. Kemungkinan model sedang dilatih ulang. Coba lagi beberapa saat.";
        } else if (error.code === 'ECONNREFUSED') {
            errorMessage = "Koneksi ke prediction service (port 5000) ditolak. Pastikan service tersebut sudah berjalan."
        } else if (error.response) {
            errorMessage = `Prediction service error: ${error.response.data.error || error.response.statusText || 'Unknown error'}`;
        } else if (error.request) { // Permintaan dibuat tapi tidak ada respons
            errorMessage = `Tidak ada respons dari prediction service. Mungkin service mati atau jaringan bermasalah.`;
        }
        console.log("STOCK-SERVICE: Akan mengirim error respons ke gateway.");
        res.status(500).json({ error: errorMessage });
        console.log("STOCK-SERVICE: Selesai mengirim error respons ke gateway.");
    }
});


app.listen(PORT, () => {
    console.log(`Stock Service running on port ${PORT}`);
});
