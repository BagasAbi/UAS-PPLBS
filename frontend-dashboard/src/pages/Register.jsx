import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient'; // Import the Supabase client

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin'); // Default role
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    console.log('Attempting to register with:', { email, role });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: role, // Store selected role as user metadata
        },
      },
    });

    if (error) {
      console.error('Supabase Auth signUp error:', error.message);
      setError(error.message);
    } else if (data.user) {
      console.log('Supabase Auth signUp successful. User ID:', data.user.id);
      // After successful Supabase Auth registration, insert user details into our custom 'user' table
      const { error: insertError } = await supabase
        .from('user') // Assuming your custom table is named 'user'
        .insert([
          { id: data.user.id, email: email, role: role } // Using data.user.id for consistency
        ]);

      if (insertError) {
        console.error('Error inserting user into custom table:', insertError.message);
        setError('Registration successful, but failed to save user details. Please contact support.');
      } else {
        console.log('User successfully inserted into custom table.');
        alert('Registration successful! Please check your email to verify your account.');
        navigate('/login'); // Redirect to login page after successful registration
      }
    } else {
      console.log('Unexpected registration state: no error and no user data.');
      setError('An unexpected error occurred during registration.');
    }
            setLoading(false);
          };
        
          return (
            <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              <h2>Register</h2>
              {error && <p style={{ color: 'red' }}>{error}</p>}
              <form onSubmit={handleEmailRegister}>
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
                <div style={{ marginBottom: '15px' }}>
                  <label htmlFor="role" style={{ display: 'block', marginBottom: '5px' }}>Role:</label>
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  >
                    <option value="admin">Admin</option>
                    <option value="staff_gudang">Staff Gudang</option>
                    <option value="staff_sales">Staff Sales</option>
                  </select>
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                  {loading ? 'Loading...' : 'Register with Email'}
                </button>
              </form>
              <p style={{ marginTop: '20px', textAlign: 'center' }}>
                Already have an account? <Link to="/login">Login here</Link>
              </p>
            </div>
          );
        }
        
        export default Register;