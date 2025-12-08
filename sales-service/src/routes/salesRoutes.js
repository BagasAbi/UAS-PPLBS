const express = require('express');
const router = express.Router();
const salesService = require('../services/salesService');

// POST /sales - create a new sale (transaction)
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const result = await salesService.createSale(payload);
    res.status(201).json(result);
  } catch (err) {
    console.error('Error creating sale', err);
    res.status(500).json({ error: 'failed to create sale', details: err.message });
  }
});

// GET /sales - list sales, optional ?product_id=...
router.get('/', async (req, res) => {
  try {
    const { product_id } = req.query;
    const result = await salesService.getSales(product_id);
    res.json(result);
  } catch (err) {
    console.error('Error fetching sales', err);
    res.status(500).json({ error: 'failed to fetch sales', details: err.message });
  }
});

// GET /sales/aggregate?product_id=...&window=7d
router.get('/aggregate', async (req, res) => {
  try {
    const { product_id, window = '7d' } = req.query;
    const result = await salesService.aggregateSales(product_id, window);
    res.json(result);
  } catch (err) {
    console.error('Error aggregating sales', err);
    res.status(500).json({ error: 'failed to aggregate sales', details: err.message });
  }
});

module.exports = router;
