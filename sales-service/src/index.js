require('dotenv').config();
const express = require('express');
const bodyParser = require('express').json;
const salesRoutes = require('./routes/salesRoutes');

const app = express();
app.use(bodyParser());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/sales', salesRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Sales Service listening on port ${PORT}`);
});
