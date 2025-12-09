import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { GoogleLogin } from '@react-oauth/google'; // Import GoogleLogin

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000'}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || JSON.stringify(data));

      // Save backend token
      localStorage.setItem('backend_token', data.token);
      localStorage.setItem('backend_user_email', email);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    // Let Supabase handle the Google Sign-In
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credentialResponse.credential,
    });

    if (error) {
      console.error('Google Login Error with Supabase:', error);
      setError(error.message || 'Failed to login with Google via Supabase');
      setLoading(false);
      return;
    }

    // Also exchange the Google ID token at our gateway to get a backend JWT
    try {
      const gwBase = import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000';
      const res = await fetch(`${gwBase.replace(/\/$/, '')}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken: credentialResponse.credential }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || JSON.stringify(body));

      // Gateway may return the token under `accessToken` or `token`
      const backendToken = body.token || body.accessToken || body.access_token;
      if (backendToken) {
        localStorage.setItem('backend_token', backendToken);
        // try to store email from supabase session if available
        const sess = await supabase.auth.getSession();
        if (sess && sess.data && sess.data.session && sess.data.session.user && sess.data.session.user.email) {
          localStorage.setItem('backend_user_email', sess.data.session.user.email);
        }
      }

      navigate('/');
    } catch (e) {
      console.error('Failed to exchange ID token at gateway:', e);
      setError(e.message || 'Failed to obtain backend token from gateway');
    }

    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
      <h2>Masuk (Login)</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleEmailLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
        </div>
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {loading ? 'Memuat...' : 'Masuk dengan Email'}
        </button>
      </form>
      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <p>ATAU</p>
        <GoogleLogin
          onSuccess={handleGoogleLoginSuccess}
          onError={() => {
            console.log('Login Failed');
            setError('Google Login Failed. Please try again.');
          }}
        />
      </div>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Belum punya akun? <Link to="/register">Daftar di sini</Link>
      </p>
    </div>
  );
}

export default Login;