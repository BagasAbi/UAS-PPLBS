require('dotenv').config();
const supabase = require('../src/supabaseClient');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

(async () => {
  try {
    const email = process.env.NEW_ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.NEW_ADMIN_PASSWORD || 'admin123';
    const name = process.env.NEW_ADMIN_NAME || 'Admin';

    const id = uuidv4();
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase.from('user').insert([{ id, email, name, password_hash, role: 'admin' }]);
    if (error) {
      console.error('Failed to create admin user:', error.message || error);
      process.exit(1);
    }

    console.log('Admin user created:');
    console.log('  id:', id);
    console.log('  email:', email);
    console.log('  password:', password);
    console.log('NOTE: change the password after first login.');
    process.exit(0);
  } catch (e) {
    console.error('Error creating admin:', e);
    process.exit(1);
  }
})();
