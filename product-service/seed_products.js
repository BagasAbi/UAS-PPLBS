require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const products = [
    { name: "Beras Premium 5kg", sku: "SEM-001", category: "Beras", stock: 50, price: 65000, unit: "sack" },
    { name: "Beras Merah 1kg", sku: "SEM-002", category: "Beras", stock: 30, price: 25000, unit: "kg" },
    { name: "Minyak Goreng 1L", sku: "SEM-003", category: "Minyak", stock: 100, price: 16000, unit: "liter" },
    { name: "Minyak Goreng 2L", sku: "SEM-004", category: "Minyak", stock: 60, price: 31000, unit: "pouch" },
    { name: "Gula Pasir 1kg", sku: "SEM-005", category: "Gula", stock: 80, price: 14500, unit: "kg" },
    { name: "Gula Merah 500g", sku: "SEM-006", category: "Gula", stock: 40, price: 12000, unit: "pack" },
    { name: "Tepung Terigu 1kg", sku: "SEM-007", category: "Tepung", stock: 70, price: 11000, unit: "kg" },
    { name: "Tepung Tapioka 500g", sku: "SEM-008", category: "Tepung", stock: 50, price: 8000, unit: "pack" },
    { name: "Telur Ayam 1kg", sku: "SEM-009", category: "Telur", stock: 30, price: 28000, unit: "kg" },
    { name: "Mie Instan Goreng", sku: "SEM-010", category: "Mie", stock: 200, price: 3500, unit: "pcs" },
    { name: "Mie Instan Kuah", sku: "SEM-011", category: "Mie", stock: 200, price: 3500, unit: "pcs" },
    { name: "Kopi Bubuk 100g", sku: "SEM-012", category: "Minuman", stock: 60, price: 15000, unit: "pack" },
    { name: "Teh Celup 25s", sku: "SEM-013", category: "Minuman", stock: 70, price: 8500, unit: "box" },
    { name: "Susu Kental Manis", sku: "SEM-014", category: "Susu", stock: 90, price: 12000, unit: "can" },
    { name: "Susu UHT 1L", sku: "SEM-015", category: "Susu", stock: 40, price: 19000, unit: "liter" },
    { name: "Garam Halus 500g", sku: "SEM-016", category: "Bumbu", stock: 100, price: 5000, unit: "pack" },
    { name: "Kecap Manis 600ml", sku: "SEM-017", category: "Bumbu", stock: 50, price: 22000, unit: "bottle" },
    { name: "Saus Sambal 335ml", sku: "SEM-018", category: "Bumbu", stock: 50, price: 15000, unit: "bottle" },
    { name: "Sabun Cuci Piring", sku: "SEM-019", category: "Pembersih", stock: 80, price: 15000, unit: "pouch" },
    { name: "Deterjen Bubuk 1kg", sku: "SEM-020", category: "Pembersih", stock: 60, price: 25000, unit: "kg" },
    { name: "Pasta Gigi 190g", sku: "SEM-021", category: "Perawatan", stock: 70, price: 18000, unit: "tube" },
    { name: "Sabun Mandi Cair", sku: "SEM-022", category: "Perawatan", stock: 60, price: 22000, unit: "pouch" },
    { name: "Shampoo 170ml", sku: "SEM-023", category: "Perawatan", stock: 50, price: 20000, unit: "bottle" },
    { name: "Tisu Wajah 250s", sku: "SEM-024", category: "Perlengkapan", stock: 40, price: 15000, unit: "pack" }
];

async function seed() {
    console.log("🌱 Seeding Products...");

    // Optional: Clear existing products if needed
    // await supabase.from('products').delete().neq('id', 0);

    for (const p of products) {
        // Check if exists by SKU to avoid duplicates
        const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('sku', p.sku)
            .single();

        if (!existing) {
            const { error } = await supabase.from('products').insert([p]);
            if (error) console.error(`❌ Failed to insert ${p.name}:`, error.message);
            else console.log(`✅ Inserted: ${p.name}`);
        } else {
            console.log(`⚠️ Skipped (Already exists): ${p.name}`);
        }
    }
    console.log("✨ Seeding completed.");
}

seed();
