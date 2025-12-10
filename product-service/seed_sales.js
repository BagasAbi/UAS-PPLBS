require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Error: SUPABASE_URL and SUPABASE_KEY must be set in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Generate random dates within last N days
function getRandomDate(daysBack) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
}

async function seedSales() {
    console.log("🌱 Seeding Sales History...");

    // 1. Get all products
    const { data: products, error: prodError } = await supabase.from('products').select('id');
    if (prodError || !products) {
        console.error("❌ Failed to fetch products:", prodError);
        return;
    }

    const salesData = [];
    const today = new Date();

    // 2. Generate sales for each product for the last 14 days
    for (const prod of products) {
        for (let i = 0; i < 14; i++) {
            const date = new Date();
            date.setDate(today.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Random quantity between 5 and 50
            const quantity = Math.floor(Math.random() * 45) + 5;

            salesData.push({
                product_id: prod.id,
                quantity_sold: quantity,
                transaction_date: dateStr,
                sales_person: 'system_seed'
            });
        }
    }

    // 3. Batch insert
    // Note: Supabase limits bulk insert size, splitting if necessary
    const chunkSize = 100;
    for (let i = 0; i < salesData.length; i += chunkSize) {
        const chunk = salesData.slice(i, i + chunkSize);
        const { error } = await supabase.from('transactions').insert(chunk);
        if (error) {
            console.error(`❌ Failed to insert transactions chunk ${i}:`, error.message);
        } else {
            console.log(`✅ Inserted transactions chunk ${i} - ${i + chunk.length}`);
        }
    }

    console.log("✨ Sales (Transactions) seeding completed.");
}

seedSales();
