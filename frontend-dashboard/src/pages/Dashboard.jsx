import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css'; // Assuming App.css has general styling
import { fetchProducts } from '../pages/api.js'; // Use absolute path alias

function Dashboard() {
  const [session, setSession] = useState(null);
  const [userMetadata, setUserMetadata] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true until session is checked
  const navigate = useNavigate();

  useEffect(() => {
    // Prefer backend-issued token stored in localStorage
    // Prefer backend-issued token stored in localStorage
    const backendToken = localStorage.getItem('backend_token');
    if (backendToken) {
      // Decode token to get role (simple base64 decode for frontend display)
      try {
        const payload = JSON.parse(atob(backendToken.split('.')[1]));
        const email = payload.email || localStorage.getItem('backend_user_email') || '';
        const role = payload.role || 'user';

        setSession({ user: { email } });
        setUserMetadata({ role: role });
      } catch (e) {
        console.error("Failed to decode token:", e);
        // Fallback if decode fails
        const email = localStorage.getItem('backend_user_email') || '';
        setSession({ user: { email } });
        setUserMetadata({ role: 'user' });
      }
      setLoading(false);
      return;
    }

    // Fallback to Supabase session if backend token not present
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUserMetadata(session.user.user_metadata);
      } else {
        navigate('/login'); // Redirect to login if no session
      }
      setLoading(false); // Stop loading after session check
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session) {
          setUserMetadata(session.user.user_metadata);
        } else {
          // If session ends, clear data and redirect
          setUserMetadata(null);
          setApiData(null);
          navigate('/login');
        }
      }
    );

    return () => {
      if (authListener && authListener.subscription) authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    // Remove backend token if present
    const backendToken = localStorage.getItem('backend_token');
    if (backendToken) {
      localStorage.removeItem('backend_token');
      localStorage.removeItem('backend_user_email');
      setSession(null);
      setUserMetadata(null);
      setApiData(null);
      navigate('/login');
      return;
    }

    // Otherwise sign out Supabase session
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error during logout:', error.message);
      setApiError('Failed to logout: ' + error.message);
    } else {
      console.log('User logged out successfully.');
      setSession(null);
      setUserMetadata(null);
      setApiData(null);
      navigate('/login'); // Redirect to login after successful logout
    }
  };

  const fetchProtectedData = async () => {
    setApiData(null);
    setApiError(null);
    try {
      // Use the centralized service function to fetch data
      const data = await fetchProducts();
      setApiData(data);
    } catch (error) {
      console.error("Error saat mengambil data:", error);
      setApiError(error.message);
    }
  };

  if (loading) {
    return <div>Memuat...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard Sistem Inventaris AI</h1>
        {session && session.user ? (
          <div>
            <p>Selamat datang, {session.user.email}!</p>
            {userMetadata?.role && <p>Peran Anda: {userMetadata.role}</p>}
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Keluar</button>
            <hr style={{ margin: '20px 0' }} />
            <button onClick={fetchProtectedData} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Ambil Data Produk (Terproteksi)</button>

            {apiData && (
              <div style={{ textAlign: 'left', marginTop: '20px', backgroundColor: '#333', padding: '15px', borderRadius: '8px', color: 'white' }}>
                <h3>Data Produk:</h3>
                <pre>{JSON.stringify(apiData, null, 2)}</pre>
              </div>
            )}
            {apiError && (
              <div style={{ marginTop: '20px', color: 'red', backgroundColor: 'rgba(255,0,0,0.1)', padding: '10px', borderRadius: '5px' }}>
                <p><strong>Error:</strong> {apiError}</p>
              </div>
            )}
          </div>
        ) : (
          <p>Memuat informasi pengguna...</p> // Should not be seen often due to redirect
        )}
      </header>
    </div>
  );
}

export default Dashboard;