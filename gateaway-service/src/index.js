require('dotenv').config();
const supabase = require('./supabaseClient.js');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxy } = require('./middleware/proxy');
const { setupFrontend } = require('./middleware/frontend');
const gatewayRoutes = require('./routes/gatewayRoutes');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware Global ---
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', optionsSuccessStatus: 200 }));
app.use(express.json());
app.use(morgan('dev'));

// --- Rute Aplikasi & Proxy ---
app.use('/', gatewayRoutes);
createProxy(app);

// --- Menyajikan Frontend ---
// Middleware ini harus dijalankan setelah semua rute API dan proxy
setupFrontend(app);

// --- Menjalankan Server ---
app.listen(port, () => {
    console.log(`API Gateway listening on port ${port}`);
});
