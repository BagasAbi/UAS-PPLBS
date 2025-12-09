import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import '../App.css'; // Assuming App.css has general styling

function Dashboard() {
  const [session, setSession] = useState(null);
  const [userMetadata, setUserMetadata] = useState(null);
  const [apiData, setApiData] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [loading, setLoading] = useState(false); // Add this line
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        setUserMetadata(session.user.user_metadata);
      } else {
        navigate('/login'); // Redirect to login if no session
      }
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
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  const handleLogout = async () => {
    setLoading(true);
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
    setLoading(false); // Make sure loading state is reset
  };

  const fetchProtectedData = async () => {
    setApiData(null);
    setApiError(null);

    if (!session?.access_token) {
      setApiError("Anda harus login untuk mengambil data.");
      return;
    }

    try {
      // NOTE: This call will still fail until the gateway-service is updated to validate Supabase JWTs.
      // This is a placeholder for demonstrating the client-side part.
      const res = await fetch('http://localhost:8000/api/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Gagal mengambil data yang dilindungi.");
      }
      
      setApiData(data);
    } catch (error) {
      console.error("Error saat mengambil data:", error);
      setApiError(error.message);
    }
  };

  if (!session) {
    return <div>Loading...</div>; // Or a more sophisticated loading spinner
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard Sistem Inventaris AI</h1>
        {session.user ? (
          <div>
            <p>Selamat datang, {session.user.email}!</p>
            {userMetadata?.role && <p>Peran Anda: {userMetadata.role}</p>}
            <button onClick={handleLogout} style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', marginRight: '10px' }}>Logout</button>
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