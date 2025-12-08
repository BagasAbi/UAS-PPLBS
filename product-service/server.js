require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

// Inisialisasi Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// --- CRUD Endpoints for Products using Supabase ---

// GET /products - Get all products
app.get('/products', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .select('*');

    if (error) {
        return res.status(500).json({ message: 'Error fetching products', error });
    }
    res.json(data);
});

// GET /products/:id - Get a single product by ID
app.get('/products/:id', async (req, res) => {
    const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', req.params.id)
        .single(); // Mengambil satu baris data

    if (error) {
        return res.status(500).json({ message: 'Error fetching product', error });
    }
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
});

// POST /products - Create a new product
app.post('/products', async (req, res) => {
    const { name, sku, category, stock } = req.body;

    // Validasi dasar
    if (!name || !sku || !category) {
        return res.status(400).json({ message: 'Name, SKU, and category are required' });
    }

    const { data, error } = await supabase
        .from('products')
        .insert([{ name, sku, category, stock: stock || 0 }])
        .select();

    if (error) {
        // Periksa jika ada pelanggaran unik (misalnya, SKU sudah ada)
        if (error.code === '23505') { // Kode error PostgreSQL untuk unique violation
            return res.status(409).json({ message: 'Product with this SKU already exists', error });
        }
        return res.status(500).json({ message: 'Error creating product', error });
    }

    res.status(201).json(data[0]);
});

// PUT /products/:id - Update a product
app.put('/products/:id', async (req, res) => {
    const { name, sku, category, stock } = req.body;

    // Validasi dasar
    if (!name || !sku || !category) {
        return res.status(400).json({ message: 'Name, SKU, and category are required' });
    }

    const { data, error } = await supabase
        .from('products')
        .update({ name, sku, category, stock })
        .eq('id', req.params.id)
        .select();

    if (error) {
        return res.status(500).json({ message: 'Error updating product', error });
    }
    if (data.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.json(data[0]);
});

// DELETE /products/:id - Delete a product
app.delete('/products/:id', async (req, res) => {
    const { data, error } = await supabase
        .from('products')
        .delete()
        .eq('id', req.params.id)
        .select();

    if (error) {
        return res.status(500).json({ message: 'Error deleting product', error });
    }
    if (data.length === 0) {
        return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(204).send(); // No Content
});


app.listen(port, () => {
    console.log(`Product Service running on http://localhost:${port}`);
});