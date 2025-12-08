require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3002; // Port for sales-service

app.use(cors());
app.use(bodyParser.json());

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const STOCK_SERVICE_URL = 'http://localhost:3003';

app.post('/api/transaction', async (req, res) => {
    const { product_name, quantity, sales_person } = req.body;

    try {
        // 1. Check stock via stock-service
        const stockCheckResponse = await axios.post(`${STOCK_SERVICE_URL}/api/stock/check`, { product_name, quantity });
        const { product_id } = stockCheckResponse.data;

        // 2. Update stock via stock-service
        const stockUpdateResponse = await axios.post(`${STOCK_SERVICE_URL}/api/stock/update`, { product_id, quantity });
        const { remaining_stock } = stockUpdateResponse.data;

        // 3. Record transaction
        const { error: errTrans } = await supabase
            .from('transactions')
            .insert([
                { product_id: product_id, quantity_sold: quantity, sales_person: sales_person }
            ]);

        if (errTrans) throw errTrans;

        res.json({ 
            status: "success", 
            message: "Penjualan berhasil dicatat!", 
            remaining_stock: remaining_stock 
        });

    } catch (error) {
        if (error.response) {
            // Forward error from stock-service
            res.status(error.response.status).json({ error: error.response.data.error });
        } else {
            console.error(error);
            res.status(500).json({ error: "Gagal memproses transaksi" });
        }
    }
});

app.listen(PORT, () => {
    console.log(`Sales Service running on port ${PORT}`);
});
