const express = require('express');
const path = require('path');

const fs = require('fs');

function setupFrontend(app) {
    // Tentukan path ke direktori build frontend
    const frontendDistPath = path.join(__dirname, '..', '..', '..', 'frontend-dashboard', 'dist');

    // Cek apakah folder ada (Penting untuk Docker di mana folder ini mungkin tidak di-copy)
    if (fs.existsSync(frontendDistPath)) {
        // Sajikan file statis dari direktori tersebut
        app.use(express.static(frontendDistPath));

        // Fungsi ini akan digunakan sebagai "catch-all" di file index.js
        const spaFallback = (req, res, next) => {
            res.sendFile(path.join(frontendDistPath, 'index.html'));
        };
        return spaFallback;
    } else {
        console.warn(`[WARNING] Frontend build directory not found at ${frontendDistPath}. SPA serving disabled.`);
        // Middleware dummy jika frontend tidak ada
        return (req, res, next) => {
            res.status(404).json({ message: 'Frontend is not served from this Gateway instance (Docker/Container). Please access Frontend via its own URL (e.g. localhost:5173).' });
        };
    }
}

module.exports = {
    setupFrontend,
};
