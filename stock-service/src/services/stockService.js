const supabase = require('../supabaseClient');

/**
 * Helper: update current_stock di tabel products
 */
async function updateProductCurrentStock(productId, qtyChange) {
  // Ambil stok sekarang
  const { data, error } = await supabase
    .from('products')
    .select('current_stock')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error get current_stock from products:', error);
    throw error;
  }

  const current = data?.current_stock ?? 0;
  const newStock = current + qtyChange;

  // Optional: cegah stok negatif
  if (newStock < 0) {
    throw new Error(`Stok tidak boleh negatif. current=${current}, change=${qtyChange}`);
  }

  const { error: updateError } = await supabase
    .from('products')
    .update({ current_stock: newStock })
    .eq('id', productId);

  if (updateError) {
    console.error('Error update products.current_stock:', updateError);
    throw updateError;
  }

  return newStock;
}

/**
 * Mencatat pergerakan stok + update current_stock di products
 */
async function createStockMovement(productId, qtyChange, reason) {
  // 1. Insert ke stock_movements
  const { data: movement, error: movementError } = await supabase
    .from('stock_movements')
    .insert({
      product_id: productId,
      qty_change: qtyChange,
      reason
    })
    .select('id, product_id, qty_change, reason, movement_date, created_at')
    .single();

  if (movementError) {
    console.error('Supabase insert error (stock_movements):', movementError);
    throw movementError;
  }

  // 2. Update kolom current_stock di products
  const newStock = await updateProductCurrentStock(productId, qtyChange);

  // Biar enak, kita kembalikan juga stok barunya
  return {
    ...movement,
    new_current_stock: newStock
  };
}

/**
 * Kalau sekarang mau ngambil stok, bisa ambil dari products.current_stock
 */
async function getCurrentStock(productId) {
  const { data, error } = await supabase
    .from('products')
    .select('current_stock')
    .eq('id', productId)
    .single();

  if (error) {
    console.error('Error getCurrentStock from products:', error);
    throw error;
  }

  return data?.current_stock ?? 0;
}

/**
 * History movement masih dari stock_movements
 */
async function getStockMovements(productId) {
  const { data, error } = await supabase
    .from('stock_movements')
    .select('id, product_id, movement_date, qty_change, reason, created_at')
    .eq('product_id', productId)
    .order('movement_date', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    console.error('Supabase select error (getStockMovements):', error);
    throw error;
  }

  return data || [];
}

module.exports = {
  createStockMovement,
  getCurrentStock,
  getStockMovements
};
