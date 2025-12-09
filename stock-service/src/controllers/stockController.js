const stockService = require('../services/stockService');

/**
 * POST /stock/move
 * Body: { product_id, qty_change, reason }
 */
async function postStockMove(req, res) {
  try {
    const { product_id, qty_change, reason } = req.body;

    if (product_id == null || qty_change == null || !reason) {
      return res.status(400).json({
        message: 'product_id, qty_change, dan reason wajib diisi'
      });
    }

    const productIdNum = Number(product_id);
    const qtyNumber = Number(qty_change);

    if (Number.isNaN(productIdNum)) {
      return res.status(400).json({ message: 'product_id harus berupa angka' });
    }

    if (Number.isNaN(qtyNumber) || qtyNumber === 0) {
      return res.status(400).json({
        message: 'qty_change harus berupa angka tidak nol'
      });
    }

    const movement = await stockService.createStockMovement(
      productIdNum,
      qtyNumber,
      reason
    );

    return res.status(201).json({
      message: 'Pergerakan stok berhasil dicatat',
      data: movement
    });
  } catch (err) {
    console.error('Error postStockMove:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /stock/:product_id
 * Mengembalikan stok terkini untuk product_id
 */
async function getStockByProduct(req, res) {
  try {
    const productId = Number(req.params.product_id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: 'product_id tidak valid' });
    }

    const currentStock = await stockService.getCurrentStock(productId);

    return res.status(200).json({
      product_id: productId,
      current_stock: currentStock
    });
  } catch (err) {
    console.error('Error getStockByProduct:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /stock
 * Mengembalikan semua data stok produk
 */
async function getAllStocks(req, res) {
  try {
    const products = await stockService.getAllStocks();
    res.status(200).json(products);
  } catch (err) {
    console.error('Error getAllStocks:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * GET /stock/:product_id/movements
 * Opsional: lihat history pergerakan stok
 */
async function getStockMovements(req, res) {
  try {
    const productId = Number(req.params.product_id);

    if (Number.isNaN(productId)) {
      return res.status(400).json({ message: 'product_id tidak valid' });
    }

    const movements = await stockService.getStockMovements(productId);

    return res.status(200).json({
      product_id: productId,
      movements
    });
  } catch (err) {
    console.error('Error getStockMovements:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = {
  postStockMove,
  getStockByProduct,
  getAllStocks,
  getStockMovements
};
