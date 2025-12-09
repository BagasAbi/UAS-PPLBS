const express = require('express');
const cors = require('cors');

const stockRoutes = require('./routes/stockRoutes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

// health check
app.get('/', (req, res) => {
  res.json({ message: 'Stock Service is running (Supabase)' });
});

// routes
app.use('/', stockRoutes);

app.listen(PORT, () => {
  console.log(`Stock Service running on port ${PORT}`);
});
