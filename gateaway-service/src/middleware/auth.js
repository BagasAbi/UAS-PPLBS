const jwt = require('jsonwebtoken');

// Middleware untuk proxyReqOptDecorator (Otentikasi)
function authenticateToken(proxyReqOpts, srcReq) {
    return new Promise((resolve, reject) => {
        const authHeader = srcReq.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (token == null) {
            // Tolak promise jika tidak ada token
            return reject(new Error('Unauthorized: Access token is required.'));
        }

        // Verify using backend-issued JWT (we no longer accept Supabase JWT for auth)
        const backendSecret = process.env.BACKEND_JWT_SECRET;
        if (!backendSecret) {
            return reject(new Error('Server Misconfiguration: BACKEND_JWT_SECRET is not set on the gateway.'));
        }

        jwt.verify(token, backendSecret, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return reject(new Error('Forbidden: Token expired. Please re-authenticate.'));
                }
                return reject(new Error(`Forbidden: Invalid token. (${err.message})`));
            }

            // Attach user info from backend token
            srcReq.user = {
                id: decoded.sub || decoded.id,
                email: decoded.email,
                role: decoded.role || 'user'
            };

            proxyReqOpts.headers['Authorization'] = authHeader;
            resolve(proxyReqOpts);
        });
    });
}

// Middleware untuk memeriksa peran pengguna (Otorisasi)
// Note: authorization checks are handled elsewhere (gateway proxy or route middleware).
module.exports = {
    authenticateToken,
};
