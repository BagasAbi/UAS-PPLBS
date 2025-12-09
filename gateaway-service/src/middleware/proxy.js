const proxy = require('express-http-proxy');
const { authenticateToken, authorize } = require('./auth');

const services = [
    { name: 'products', route: '/api/products', target: process.env.PRODUCT_SERVICE_URL, rewrite: '/products' },
    { name: 'sales', route: '/api/sales', target: process.env.SALES_SERVICE_URL, rewrite: '/api' },
    { name: 'stock', route: '/api/stock', target: process.env.STOCK_SERVICE_URL, rewrite: '/stock' },
    { name: 'predict', route: '/api/predict', target: process.env.PREDICTION_SERVICE_URL, rewrite: '/predict' },
];

const serviceAccessRules = {
    '/api/products': ['admin', 'admin_gudang', 'staff_sales', 'user'],
    '/api/sales':    ['admin', 'staff_sales'],
    '/api/stock':    ['admin', 'admin_gudang'],
    '/api/predict':  ['admin', 'admin_gudang'],
};

function createProxy(app) {
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
}

module.exports = {
    createProxy,
};
