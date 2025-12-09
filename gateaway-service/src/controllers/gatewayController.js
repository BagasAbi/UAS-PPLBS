const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
const supabase = require('../supabaseClient'); // Import Supabase client

// DAFTAR PENGGUNA SIMULASI (untuk pengembangan)
// Di dunia nyata, data ini akan datang dari database yang aman.
const SIMULATED_USERS = {
    'admin': { role: 'admin' },          // Super admin, akses penuh
    'gudang': { role: 'admin_gudang' },   // Admin gudang
    'sales': { role: 'staff_sales' }     // Staf penjualan
};

// Endpoint login yang lebih aman
function login(req, res) {
    const { username } = req.body;
    // Periksa apakah username ada di daftar simulasi
    if (!username || !SIMULATED_USERS[username]) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Buat payload token dengan nama dan peran pengguna
    const user = {
        name: username,
        role: SIMULATED_USERS[username].role
    };

    // Buat token JWT
    const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.json({ accessToken: accessToken });
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
        
        const accessToken = jwt.sign(appUser, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });

        res.json({ accessToken: accessToken });

    } catch (error) {
        console.error('Google login error:', error);
        return res.status(401).json({ message: 'Invalid Google ID token', error: error.message });
    }
}

module.exports = {
    login,
    handleGoogleLogin,
};