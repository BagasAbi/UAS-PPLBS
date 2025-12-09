const jwt = require('jsonwebtoken');

// DAFTAR PENGGUNA SIMULASI (untuk pengembangan)
// Di dunia nyata, data ini akan datang dari database yang aman.
const SIMULATED_USERS = {
    'admin': { role: 'admin' },          // Super admin, akses penuh
    'gudang': { role: 'admin_gudang' },   // Admin gudang
    'sales': { role: 'staff_sales' }     // Staf penjualan
};

// Endpoint login yang lebih aman
function login(req, res) {
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
}

module.exports = {
    login,
};