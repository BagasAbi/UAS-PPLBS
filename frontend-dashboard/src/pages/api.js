import { supabase } from '../supabaseClient';

/**
 * Fetches products from the gateway service.
 * This function retrieves the current session from Supabase to get the JWT,
 * then makes an authenticated request to the backend.
 * @returns {Promise<any>} The product data from the API.
 * @throws {Error} If the user is not authenticated or if the API call fails.
 */
export const fetchProducts = async () => {
  // 1. Prefer backend-issued JWT stored in localStorage (key: 'backend_token')
  const backendToken = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : null;

  if (backendToken) {
    // If we have a backend token, use it directly.
  } else {
    // Fallback: Check Supabase session (only if no backend token)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw new Error(`Error getting session: ${sessionError.message}`);
    if (!session) throw new Error('User not authenticated. Please log in.');
  }

  // 2. Make the authenticated request to your gateway service.
  //    The URL should point to the gateway's port (8000) and the proxy route (/api/products).
  const gatewayBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
  const gatewayUrl = `${gatewayBase.replace(/\/$/, '')}/api/products`;

  // Use whatever token we found (logic above guarantees we throw if neither exists, 
  // but strictly we should use backendToken if available, or session.access_token if that was clearly the intent.
  // However, since we reverted to "Backend Token", we usually MUST use backendToken.
  // If backendToken is null here, it means we fell through to Supabase session. 
  // But Gateway 'auth.js' expects BACKEND_SECRET signed token. Supabase token won't work on Gateway with current config.
  // So we MUST have search for backend_token. 

  if (!backendToken) {
    throw new Error('User not authenticated (No backend token). Please log in again.');
  }

  const response = await fetch(gatewayUrl, {
    headers: {
      'Authorization': `Bearer ${backendToken}`,
    },
  });

  if (!response.ok) {
    // Try to extract useful error info. If response isn't JSON (e.g. HTML 404), return text.
    let message = `API Error: ${response.status} ${response.statusText}`;
    try {
      const json = await response.json();
      message = json.message || JSON.stringify(json);
    } catch (e) {
      try {
        const text = await response.text();
        message = text.substring(0, 200);
      } catch (_) { }
    }
    throw new Error(message);
  }

  // Expecting JSON; if the server returned HTML (e.g. dev server index.html), this will throw.
  return response.json();
};

export const fetchPrediction = async (productId) => {
  const backendToken = localStorage.getItem('backend_token');
  if (!backendToken) throw new Error('No backend token found.');

  const gatewayBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
  const response = await fetch(`${gatewayBase.replace(/\/$/, '')}/api/predict`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${backendToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ product_id: parseInt(productId) })
  });

  if (!response.ok) throw new Error('Prediction API failed');
  return response.json();
};

export const checkRestock = async (productId, currentStock, predictedDemand) => {
  const backendToken = localStorage.getItem('backend_token');
  if (!backendToken) throw new Error('No backend token found.');

  const gatewayBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
  const response = await fetch(`${gatewayBase.replace(/\/$/, '')}/api/restock`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${backendToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: parseInt(productId),
      current_stock: parseInt(currentStock),
      predicted_demand: parseInt(predictedDemand)
    })
  });

  if (!response.ok) throw new Error('Restock API failed');
  return response.json();
};

export const recordSale = async (productId, quantity) => {
  const backendToken = localStorage.getItem('backend_token');
  if (!backendToken) throw new Error('No backend token found.');

  const gatewayBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
  const response = await fetch(`${gatewayBase.replace(/\/$/, '')}/api/sales/transaction`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${backendToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: parseInt(productId),
      quantity_sold: parseInt(quantity),
      // sales_person is optional or handled by backend token user info if implemented
      sales_person: 'WebDashboard'
    })
  });

  if (!response.ok) throw new Error('Sales transaction failed');
  return response.json();
};

export const updateStock = async (productId, qtyChange, reason) => {
  const backendToken = localStorage.getItem('backend_token');
  if (!backendToken) throw new Error('No backend token found.');

  const gatewayBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
  const response = await fetch(`${gatewayBase.replace(/\/$/, '')}/api/stock/move`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${backendToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: parseInt(productId),
      qty_change: parseInt(qtyChange),
      reason: reason || 'Manual Update'
    })
  });

  if (!response.ok) throw new Error('Stock update failed');
  return response.json();
};