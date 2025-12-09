const express = require('express');
const path = require('path');

function setupFrontend(app) {
    // Tentukan path ke direktori build frontend
    const frontendDistPath = path.join(__dirname, '..', '..', '..', 'frontend-dashboard', 'dist');
    
    // Sajikan file statis dari direktori tersebut
    app.use(express.static(frontendDistPath));

    // Fungsi ini akan digunakan sebagai "catch-all" di file index.js
    const spaFallback = (req, res, next) => {
        res.sendFile(path.join(frontendDistPath, 'index.html'));
    };
    return spaFallback;
}

module.exports = {
    setupFrontend,
};
