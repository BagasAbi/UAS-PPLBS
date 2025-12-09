import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('user'); // Default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_GATEWAY_API_URL || 'http://localhost:8000'}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }), // Include role
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || JSON.stringify(data));

      // Save backend token and email for simple client-side state
      localStorage.setItem('backend_token', data.token);
      localStorage.setItem('backend_user_email', email);

      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '480px', margin: '40px auto' }}>
      <h2>Pendaftaran (Register)</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <form onSubmit={handleRegister} style={{ display: 'grid', gap: '10px' }}>
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        </label>

        <label>
          Nama
          <input value={name} onChange={e => setName(e.target.value)} />
        </label>

        <label>
          Peran (Role)
          <select value={role} onChange={e => setRole(e.target.value)} style={{ padding: '5px', width: '100%' }}>
            <option value="user">User / Pembeli</option>
            <option value="staff">Staff</option>
            <option value="manager">Manager</option>
          </select>
        </label>

        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Mendaftar...' : 'Daftar'}</button>
      </form>
      <p>Sudah punya akun? Anda bisa <Link to="/login">masuk di sini</Link>.</p>
    </div>
  );
}

export default Register;