const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockController');

// catat pergerakan stok (restock, sale, adjustment, dll)
router.post('/stock/move', stockController.postStockMove);

// dapatkan semua stok
router.get('/stock', stockController.getAllStocks);

// dapatkan stok terkini per produk
router.get('/stock/:product_id', stockController.getStockByProduct);

// optional: lihat history movement
router.get('/stock/:product_id/movements', stockController.getStockMovements);

module.exports = router;
