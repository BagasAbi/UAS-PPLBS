require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const open = require('open');
const proxy = require('express-http-proxy');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// --- Middleware Global ---
// Konfigurasi CORS yang lebih aman
const corsOptions = {
    // Ganti dengan URL frontend Anda di lingkungan produksi
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', 
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev')); // Logger untuk semua request yang masuk

// --- Otentikasi & Otorisasi ---

// DAFTAR PENGGUNA SIMULASI (untuk pengembangan)
// Di dunia nyata, data ini akan datang dari database yang aman.
const SIMULATED_USERS = {
    'admin': { role: 'admin' },          // Super admin, akses penuh
    'gudang': { role: 'admin_gudang' },   // Admin gudang
    'sales': { role: 'staff_sales' }     // Staf penjualan
};

// Endpoint login yang lebih aman
app.post('/login', (req, res) => {
    const { username } = req.body;
    // Periksa apakah username ada di daftar simulasi
    if (!username || !SIMULATED_USERS[username]) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Buat payload token dengan nama dan peran pengguna
    const user = {
        name: username,
        role: SIMULATED_USERS[username].role
    };

    // Buat token JWT
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.json({ accessToken: accessToken });
});


// Middleware untuk memverifikasi token JWT (Otentikasi)
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.status(401).json({ message: 'Unauthorized: Access token is required.' });
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid or expired token.' });
        }
        req.user = user; // Simpan data pengguna dari token ke object request
        next(); // Token valid, lanjutkan
    });
}

// Middleware untuk memeriksa peran pengguna (Otorisasi)
function authorize(allowedRoles) {
    return (req, res, next) => {
        // Periksa apakah peran pengguna yang terotentikasi ada dalam daftar peran yang diizinkan
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: You do not have the required role for this resource.' });
        }
        next(); // Pengguna memiliki peran yang sesuai, lanjutkan
    };
}


// --- Reverse Proxy Cerdas dengan Kontrol Akses (Menggunakan express-http-proxy) ---

const services = [
    { name: 'products', route: '/api/products', target: process.env.PRODUCT_SERVICE_URL, rewrite: '/products' },
    { name: 'sales', route: '/api/sales', target: process.env.SALES_SERVICE_URL, rewrite: '/api' },
    { name: 'stock', route: '/api/stock', target: process.env.STOCK_SERVICE_URL, rewrite: '' },
    { name: 'predict', route: '/api/predict', target: process.env.PREDICTION_SERVICE_URL, rewrite: '/predict' },
];

const serviceAccessRules = {
    '/api/products': ['admin', 'admin_gudang', 'staff_sales'],
    '/api/sales':    ['admin', 'staff_sales'],
    '/api/stock':    ['admin', 'admin_gudang'],
    '/api/predict':  ['admin', 'admin_gudang'],
};

services.forEach(({ route, target, rewrite }) => {
    const proxyOptions = {
        proxyReqPathResolver: function (req) {
            const newPath = req.originalUrl.replace(new RegExp(`^${route}`), rewrite);
            console.log(`[PROXY] Rewriting path from ${req.originalUrl} to ${newPath}`);
            return newPath;
        },
        proxyErrorHandler: function(err, res, next) {
            console.error(`[PROXY ERROR] Code: ${err.code}, Message: ${err.message}`);
            if (res.headersSent) {
                return;
            }
            switch (err.code) {
                case 'ECONNREFUSED':
                    return res.status(503).json({ message: `Service Unavailable. Koneksi ke layanan target ditolak. Pastikan layanan ${target} sudah berjalan.` });
                case 'ETIMEDOUT':
                case 'ECONNRESET':
                    return res.status(504).json({ message: 'Gateway Timeout. Layanan target tidak memberikan respons dalam waktu yang ditentukan.' });
                default:
                    return res.status(500).json({ message: 'Internal Gateway Error.' });
            }
        },
        timeout: 10000,
    };

    const allowedRoles = serviceAccessRules[route] || ['admin'];

    // Rantai middleware: Otentikasi -> Otorisasi -> Proxy
    app.use(route, authenticateToken, authorize(allowedRoles), proxy(target, proxyOptions));
});

// --- Menyajikan Frontend (Build Produksi) ---
// Ini harus ditempatkan setelah semua rute API/proxy Anda.
const frontendDistPath = path.join(__dirname, 'frontend-dashboard', 'dist');
app.use(express.static(frontendDistPath));

// "Catch-all" handler: untuk permintaan yang tidak cocok dengan file statis atau rute API,
// kirim kembali 'index.html'. Ini penting untuk Single-Page-Application (SPA) seperti React.
app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});


// Menjalankan server gateway
app.listen(port, async () => {
    const url = `http://localhost:${port}`;
    console.log(`API Gateway listening on ${url}`);
    try {
        const { default: open } = await import('open');
        await open(url); // Membuka URL di browser secara otomatis
    } catch (err) {
        console.error('Failed to open browser:', err);
    }
});
