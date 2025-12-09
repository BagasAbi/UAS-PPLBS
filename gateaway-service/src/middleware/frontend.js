const express = require('express');
const path = require('path');

function setupFrontend(app) {
    // Tentukan path ke direktori build frontend
    const frontendDistPath = path.join(__dirname, '..', '..', '..', 'frontend-dashboard', 'dist');
    
    // Sajikan file statis dari direktori tersebut
    app.use(express.static(frontendDistPath));

    // "Catch-all" handler: untuk permintaan yang tidak cocok dengan file statis atau rute API,
    // kirim kembali 'index.html'. Ini penting untuk Single-Page-Application (SPA).
    app.get('*', (req, res) => {
        // Pastikan path ini benar berdasarkan struktur direktori Anda
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    });
}

module.exports = {
    setupFrontend,
};
