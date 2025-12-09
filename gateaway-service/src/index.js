require('dotenv').config();
const supabase = require('./supabaseClient.js');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const morgan = require('morgan');
// Swagger Dependencies
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const { createProxy } = require('./middleware/proxy');
const { setupFrontend } = require('./middleware/frontend');
const gatewayRoutes = require('./routes/gatewayRoutes');

const app = express();
const port = process.env.PORT || 8000;

// Swagger Setup
const swaggerDocument = YAML.load(path.join(__dirname, '../swagger.yaml'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// --- Middleware Global ---
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', optionsSuccessStatus: 200 }));
app.use(express.json());
app.use(morgan('dev'));

// Global rate limiter (reasonable default)
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200 });
app.use(apiLimiter);

// --- Rute Aplikasi & Proxy ---
// 1. Daftarkan rute API spesifik gateway terlebih dahulu.
app.use('/', gatewayRoutes);

// 2. Daftarkan semua rute proxy ke microservices.
createProxy(app);

// --- Menyajikan Frontend & SPA Fallback ---
// 3. Sajikan file statis dari frontend (seperti CSS, JS, gambar).
const spaFallback = setupFrontend(app);

// 4. PENTING: Handler "catch-all" harus menjadi yang TERAKHIR.
// Jika permintaan tidak cocok dengan rute API atau proxy di atas,
// dan bukan permintaan untuk file statis, maka sajikan aplikasi frontend (SPA).
app.use(spaFallback);

// --- Menjalankan Server ---
app.listen(port, () => {
    console.log(`API Gateway listening on port ${port}`);
});
