import { supabase } from '../supabaseClient';

/**
 * Fetches products from the gateway service.
 * This function retrieves the current session from Supabase to get the JWT,
 * then makes an authenticated request to the backend.
 * @returns {Promise<any>} The product data from the API.
 * @throws {Error} If the user is not authenticated or if the API call fails.
 */
export const fetchProducts = async () => {
  // 1. Get the current session from Supabase.
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(`Error getting session: ${sessionError.message}`);
  }

  if (!session) {
    throw new Error('User not authenticated. Please log in.');
  }

  // 2. Make the authenticated request to your gateway service.
  //    The URL should point to the gateway's port (3000) and the proxy route (/api/products).
  //    Gateway (port 3000) -> Proxy (/api/products) -> Stock Service (port 3002)
  //    Use environment variable for flexibility; fall back to localhost during development.
  const gatewayBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
  const gatewayUrl = `${gatewayBase.replace(/\/$/, '')}/api/products`;

  // Prefer backend-issued JWT stored in localStorage (key: 'backend_token')
  const backendToken = typeof window !== 'undefined' ? localStorage.getItem('backend_token') : null;
  if (!backendToken) {
    throw new Error('No backend authentication token found. Please login.');
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
      } catch (_) {}
    }
    throw new Error(message);
  }

  // Expecting JSON; if the server returned HTML (e.g. dev server index.html), this will throw.
  return response.json();
};