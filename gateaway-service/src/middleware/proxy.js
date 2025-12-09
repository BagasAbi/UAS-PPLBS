const proxy = require('express-http-proxy');
const { authenticateToken } = require('./auth');

const services = [
    { name: 'products', route: '/api/products', target: process.env.PRODUCT_SERVICE_URL, rewrite: '/products' },
    { name: 'sales', route: '/api/sales', target: process.env.SALES_SERVICE_URL, rewrite: '/sales' },
    { name: 'stock', route: '/api/stock', target: process.env.STOCK_SERVICE_URL, rewrite: '/stock' },
    { name: 'predict', route: '/api/predict', target: process.env.PREDICTION_SERVICE_URL, rewrite: '/predict' },
];

const serviceAccessRules = {
    '/api/products': ['manager', 'staff', 'user'],
    '/api/sales': ['manager', 'staff', 'user'], // User might need to buy (POST)
    '/api/stock': ['manager', 'staff'],
    '/api/predict': ['manager'],
};

function createAuthProxyDecorator(allowedRoles) {
    return (proxyReqOpts, srcReq) => {
        return new Promise((resolve, reject) => {
            // 1. Lakukan Otentikasi
            authenticateToken(proxyReqOpts, srcReq)
                .then(newOpts => {
                    const user = srcReq.user;
                    // 2. Lakukan Otorisasi
                    if (!user || !allowedRoles.includes(user.role)) {
                        return reject(new Error('Forbidden: You do not have the required role.'));
                    }

                    // 3. Aturan Khusus untuk Role 'user' (Pembeli)
                    // User hanya boleh GET data produk, tidak boleh ubah/hapus
                    if (user.role === 'user' && srcReq.originalUrl.startsWith('/api/products') && srcReq.method !== 'GET') {
                        return reject(new Error('Forbidden: Buyers can only view products.'));
                    }

                    resolve(newOpts);
                })
                .catch(reject);
        });
    };
}

function createProxy(app) {
    services.forEach(({ route, target, rewrite }) => {
        if (!target) {
            console.warn(`[PROXY] Target untuk rute '${route}' tidak didefinisikan. Melewati...`);
            return;
        }

        const allowedRoles = serviceAccessRules[route] || ['admin'];

        const proxyOptions = {
            proxyReqPathResolver: function (req) {
                const newPath = req.originalUrl.replace(new RegExp(`^${route}`), rewrite);
                console.log(`[PROXY] Rewriting path from ${req.originalUrl} to ${newPath}`);
                return newPath;
            },
            // PENTING: Gunakan decorator gabungan yang baru
            proxyReqOptDecorator: createAuthProxyDecorator(allowedRoles),
            proxyErrorHandler: function (err, res, next) {
                console.error(`[PROXY ERROR] Code: ${err.code}, Message: ${err.message}`);
                if (res.headersSent) {
                    return;
                }
                // Tangani error dari decorator otentikasi/otorisasi
                if (err.message.includes('Unauthorized')) {
                    return res.status(401).json({ message: err.message });
                }
                if (err.message.includes('Forbidden')) {
                    return res.status(403).json({ message: err.message });
                }

                switch (err.code) {
                    case 'ECONNREFUSED':
                        return res.status(503).json({ message: `Service Unavailable. Koneksi ke layanan target ditolak. Pastikan layanan di ${target} sudah berjalan.` });
                    case 'ETIMEDOUT':
                    case 'ECONNRESET':
                        return res.status(504).json({ message: 'Gateway Timeout. Layanan target tidak memberikan respons dalam waktu yang ditentukan.' });
                    default:
                        return res.status(500).json({ message: 'Internal Gateway Error.' });
                }
            },
            timeout: 10000,
        };

        // Sekarang hanya ada middleware proxy, karena auth sudah di dalam decorator
        app.use(route, proxy(target, proxyOptions));
    });
}

module.exports = {
    createProxy,
};
