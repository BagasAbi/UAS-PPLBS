const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
const supabase = require('../supabaseClient'); // Import Supabase client
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { validationResult } = require('express-validator');
// For refresh tokens
const crypto = require('crypto');

// DAFTAR PENGGUNA SIMULASI (untuk pengembangan)
// Di dunia nyata, data ini akan datang dari database yang aman.
const SIMULATED_USERS = {
    'admin': { role: 'admin' },          // Super admin, akses penuh
    'gudang': { role: 'admin_gudang' },   // Admin gudang
    'sales': { role: 'staff_sales' }     // Staf penjualan
};

// Endpoint login yang lebih aman
function login(req, res) {
    // Login using email & password against Supabase 'user' table (custom)
    (async () => {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ message: 'email and password required' });

            const { data: userRow, error } = await supabase
                .from('user')
                .select('*')
                .eq('email', email)
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.error('Error fetching user for login:', error.message || error);
                return res.status(500).json({ message: 'Internal server error' });
            }

            if (!userRow) return res.status(401).json({ message: 'Invalid credentials' });

            const match = await bcrypt.compare(password, userRow.password_hash);
            if (!match) return res.status(401).json({ message: 'Invalid credentials' });

            const token = jwt.sign({ sub: userRow.id, email: userRow.email, role: userRow.role }, process.env.BACKEND_JWT_SECRET, { expiresIn: '7d' });
            return res.json({ token });
        } catch (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    })();
}

async function handleGoogleLogin(req, res) {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ message: 'ID Token not provided' });
        }

        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: CLIENT_ID,
        });
        const payload = ticket.getPayload();

        if (!payload || !payload.email || !payload.email_verified) {
            return res.status(401).json({ message: 'Invalid Google ID token payload or unverified email.' });
        }

        const googleEmail = payload.email;
        const googleName = payload.name;
        let userId = null;
        let userRole = 'user'; // Default role for new Google users

        // 1. Check if user exists in our custom 'user' table
        const { data: existingUser, error: fetchError } = await supabase
            .from('user')
            .select('id, email, role') // Now selecting 'id', 'email', 'role'
            .eq('email', googleEmail) // Searching by email
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
            console.error('Error fetching user from Supabase custom table:', fetchError.message);
            return res.status(500).json({ message: 'Internal server error during user lookup.' });
        }

        if (existingUser) {
            userId = existingUser.id;
            userRole = existingUser.role; // Now we can get the role from the custom table
            console.log(`User ${googleEmail} found in custom table with role: ${userRole}`);
        } else {
            // If not in custom table, insert them. We assume Google login implies registration with Supabase Auth.
            // We get Supabase's internal user ID after a successful sign-in with ID token.
            const { data: authData, error: authError } = await supabase.auth.signInWithIdToken({
                provider: 'google',
                token: idToken,
            });

            if (authError) {
                console.error('Error signing in with ID token to Supabase Auth:', authError.message);
                return res.status(401).json({ message: 'Failed to authenticate with Supabase Auth using Google ID Token.' });
            }

            userId = authData.user.id; // Get Supabase's internal user ID
            
            // Insert into our custom 'user' table with 'id', 'email', 'name', 'role'
            const { data: newUser, error: insertError } = await supabase
                .from('user')
                .insert([{ id: userId, email: googleEmail, name: googleName, role: userRole }]); // Now inserting email, name, role

            if (insertError) {
                console.error('Error inserting new Google user into custom table:', insertError.message);
                // Even if insert fails for custom table, Supabase Auth is successful, so proceed.
            }
            console.log(`New Google user ${googleEmail} registered in custom table with ID: ${userId} with role: ${userRole}`);
        }

        // Create a custom JWT for your application
        const appUser = {
            id: userId,
            email: googleEmail,
            name: googleName,
            role: userRole, // Now can be from custom table or default
        };
        
        // Sign with the same BACKEND_JWT_SECRET used elsewhere for consistency
        const backendToken = jwt.sign({ sub: appUser.id, email: appUser.email, role: appUser.role }, process.env.BACKEND_JWT_SECRET, { expiresIn: '7d' });

        // Return token in `token` field for consistency with other endpoints
        res.json({ token: backendToken });

    } catch (error) {
        console.error('Google login error:', error);
        return res.status(401).json({ message: 'Invalid Google ID token', error: error.message });
    }
}

// Return current authenticated user info (from backend token)
function me(req, res) {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    return res.json({ id: req.user.id, email: req.user.email, role: req.user.role });
}

// (Removed) admin registration-token generation - simplified flow: register -> immediate JWT

// Public endpoint: simple register (no registration token required)
async function registerUser(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password, name } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'email and password are required.' });

        // Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('user')
            .select('id')
            .eq('email', email)
            .limit(1)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Error checking existing user:', fetchError.message || fetchError);
            return res.status(500).json({ message: 'Internal server error' });
        }

        if (existingUser) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Create user record in Supabase custom table (not Supabase Auth)
        const id = uuidv4();
        const password_hash = await bcrypt.hash(password, 10);
        const role = 'user';

        // Build payload dynamically so we only send fields that exist.
        const insertPayload = { id, email, password_hash, role };
        if (name) insertPayload.name = name;

        // Try inserting; if insertion fails because of unknown column (e.g. 'name'), retry without that column.
        let insertResult;
        try {
            insertResult = await supabase.from('user').insert([insertPayload]);
        } catch (err) {
            console.error('Supabase client threw during insert:', err);
            return res.status(500).json({ message: 'Failed to create user', detail: err.message || err });
        }

        // supabase-js may return error in the result object
        if (insertResult.error) {
            const errMsg = (insertResult.error && insertResult.error.message) || String(insertResult.error);
            console.error('Error inserting new user:', errMsg);

            // If error looks like missing column `name`, try again without `name` and return that result.
            if (insertPayload.name && /name/i.test(errMsg) && /could not find|column.*name|unknown column/i.test(errMsg.toLowerCase())) {
                console.warn("Insert failed due to missing 'name' column; retrying without it.");
                delete insertPayload.name;
                const retry = await supabase.from('user').insert([insertPayload]);
                if (retry.error) {
                    console.error('Retry insert also failed:', retry.error.message || retry.error);
                    return res.status(500).json({ message: 'Failed to create user after retry', detail: retry.error.message || retry.error });
                }
            } else {
                return res.status(500).json({ message: 'Failed to create user', detail: errMsg });
            }
        }

        // Issue backend JWT and return to client
        const backendToken = jwt.sign({ sub: id, email, role }, process.env.BACKEND_JWT_SECRET, { expiresIn: '7d' });

        return res.status(201).json({ success: true, token: backendToken });
    } catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// (Removed) admin registration token listing/revocation - no longer used in simplified flow

// Refresh token endpoint
async function refreshToken(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
        const { refreshToken } = req.body;
        const { data: tokenRow, error } = await supabase.from('refresh_tokens').select('*').eq('jti', refreshToken).limit(1).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (!tokenRow) return res.status(400).json({ message: 'Refresh token not found' });
        if (tokenRow.revoked) return res.status(400).json({ message: 'Refresh token revoked' });
        if (new Date(tokenRow.expires_at) < new Date()) return res.status(400).json({ message: 'Refresh token expired' });

        // Issue new access token
        const userId = tokenRow.user_id;
        // Fetch user
        const { data: userRow, error: userErr } = await supabase.from('user').select('*').eq('id', userId).single();
        if (userErr) return res.status(400).json({ message: 'User not found' });

        const newAccessToken = jwt.sign({ sub: userRow.id, email: userRow.email, role: userRow.role }, process.env.BACKEND_JWT_SECRET, { expiresIn: '15m' });

        // Rotate refresh token: revoke old, create new
        const newRefresh = crypto.randomUUID();
        const newExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        await supabase.from('refresh_tokens').update({ revoked: true }).eq('jti', refreshToken);
        await supabase.from('refresh_tokens').insert([{ jti: newRefresh, user_id: userId, revoked: false, expires_at: newExpires }]);

        return res.json({ token: newAccessToken, refreshToken: newRefresh });
    } catch (e) {
        console.error('Refresh token error:', e.message || e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Admin-only: set user's role (admin manages roles)
async function setUserRole(req, res) {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { id } = req.params;
        const { role } = req.body;
        if (!id || !role) return res.status(400).json({ message: 'Missing id or role' });

        // Update user role in Supabase
        const { data, error } = await supabase.from('user').update({ role }).eq('id', id).select('*').single();
        if (error) {
            console.error('Failed to update user role:', error.message || error);
            return res.status(500).json({ message: 'Failed to update user role', detail: error.message || error });
        }

        // Log change (console for now). In production, write to audit table.
        console.log(`User role updated by ${req.user?.email || 'unknown'}: ${id} -> ${role}`);

        return res.json({ success: true, user: data });
    } catch (e) {
        console.error('setUserRole error:', e);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

module.exports = {
    login,
    handleGoogleLogin,
    registerUser,
    me,
    setUserRole,
};