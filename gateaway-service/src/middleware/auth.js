const jwt = require('jsonwebtoken');

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

module.exports = {
    authenticateToken,
    authorize,
};
