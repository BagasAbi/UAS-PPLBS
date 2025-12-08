const supabase = require('../supabaseClient');
const fetch = require('node-fetch');
const dayjs = require('dayjs');

/**
 * Insert a sale into `transactions` table.
 * payload: { product_id, quantity_sold, sales_person, transaction_date }
 */
async function createSale(payload) {
  const { product_id, quantity_sold, sales_person, transaction_date } = payload;
  if (!product_id || !quantity_sold) {
    throw new Error('product_id and quantity_sold are required');
  }

  const record = {
    product_id: product_id,
    quantity_sold: quantity_sold,
    transaction_date: transaction_date || new Date().toISOString(),
    sales_person: sales_person || null
  };

  const { data, error } = await supabase.from('transactions').insert(record).select('*');
  if (error) throw error;

  const inserted = Array.isArray(data) ? data[0] : data;

  // Optionally notify Stock Service to reduce stock
  const stockUrl = process.env.STOCK_SERVICE_URL;
  if (stockUrl) {
    try {
      await fetch(`${stockUrl.replace(/\/$/, '')}/stock/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id, qty_change: -Math.abs(quantity_sold), reason: 'sale' })
      });
    } catch (err) {
      // Do not fail the sale because stock callback failed; just log
      console.warn('Failed to notify stock service', err.message);
    }
  }

  return inserted;
}

async function getSales(product_id) {
  let query = supabase.from('transactions').select('*').order('transaction_date', { ascending: false }).limit(1000);
  if (product_id) {
    query = query.eq('product_id', product_id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Aggregate sales by day (or other window) for ML
 * window: e.g. '7d' means last 7 days; '30d' last 30 days
 */
async function aggregateSales(product_id, window) {
  if (!product_id) throw new Error('product_id is required');

  // parse window
  const match = String(window).match(/(\d+)d/);
  const days = match ? parseInt(match[1], 10) : 7;
  const start = dayjs().startOf('day').subtract(days - 1, 'day').toISOString();

  const { data, error } = await supabase
    .from('transactions')
    .select('transaction_date,quantity_sold')
    .gte('transaction_date', start)
    .eq('product_id', product_id)
    .order('transaction_date', { ascending: true });

  if (error) throw error;

  // group by date
  const map = {};
  for (const r of data) {
    const day = dayjs(r.transaction_date).format('YYYY-MM-DD');
    map[day] = (map[day] || 0) + (r.quantity_sold || 0);
  }

  // produce array for each day in window
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = dayjs().startOf('day').subtract(days - 1 - i, 'day').format('YYYY-MM-DD');
    result.push({ date: d, quantity_sold: map[d] || 0 });
  }

  return { product_id, window: `${days}d`, series: result };
}

module.exports = { createSale, getSales, aggregateSales };
