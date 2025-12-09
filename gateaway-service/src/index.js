require('dotenv').config();
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
app.listen(port, async () => {
    const url = `http://localhost:${port}`;
    console.log(`API Gateway listening on ${url}`);
    try {
        // Secara dinamis mengimpor 'open' dan membuka browser
        const { default: open } = await import('open');
        await open(url);
    } catch (err) {
        console.error('Failed to open browser:', err);
    }
});
