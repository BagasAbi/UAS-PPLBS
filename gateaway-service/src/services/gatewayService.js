const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');

// Inisialisasi Google Auth Client dengan Client ID dari environment variables
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Memverifikasi token ID Google dan menghasilkan token JWT internal aplikasi.
 * @param {string} token - ID Token yang diterima dari Google Sign-In.
 * @returns {Promise<string>} - Token JWT yang ditandatangani oleh aplikasi.
 */
async function verifyGoogleTokenAndGenerateJwt(token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, // Pastikan token ditujukan untuk aplikasi Anda
        });

        const payload = ticket.getPayload();
        
        // Ekstrak informasi pengguna dari payload Google
        const { name, email, picture } = payload;
        
        // Buat payload untuk JWT aplikasi Anda.
        // Di sini Anda dapat menambahkan logika untuk memeriksa pengguna di database Anda,
        // dan menetapkan peran (role) atau izin (permission) yang sesuai.
        const userPayload = {
            name,
            email,
            picture,
            role: 'user' // Contoh peran default untuk setiap pengguna yang login via Google
        };

        // Buat token JWT internal aplikasi Anda
        const accessToken = jwt.sign(
            userPayload,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' } // Token berlaku selama 1 jam
        );

        return accessToken;

    } catch (error) {
        // Jika verifikasi gagal, log error dan lemparkan exception
        console.error('Error verifying Google token:', error);
        throw new Error('Invalid Google token');
    }
}

async function getStatus() {
  return { status: 'Gateway service is running' };
}

module.exports = {
  getStatus,
  verifyGoogleTokenAndGenerateJwt,
};
