const path = require('path');
// PENTING: Kita harus kasih tau letak file .env ada di folder luar (naik satu level)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
// Perhatikan nama variabel ini, pastikan sama dengan di file .env kamu
// (Apakah SUPABASE_KEY atau SUPABASE_ANON_KEY?)
const supabaseAnonKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;

// Debugging: Biar ketahuan kalau masih null
console.log("--- Debug Supabase Client ---");
console.log("URL:", supabaseUrl);
console.log("Key Exists:", !!supabaseAnonKey); // Hanya print true/false biar aman
console.log("-----------------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ FATAL: Supabase URL/Key tidak terbaca! Cek file .env di folder gateway-service.');
  process.exit(1); 
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;