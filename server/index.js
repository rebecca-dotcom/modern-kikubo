require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes     = require('./routes/auth');
const productRoutes  = require('./routes/products');
const vendorRoutes   = require('./routes/vendors');
const orderRoutes    = require('./routes/orders');
const deliveryRoutes = require('./routes/delivery');
const adminRoutes    = require('./routes/admin');

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/vendors',  vendorRoutes);
app.use('/api/orders',   orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/admin',    adminRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Modern Kikubo' }));

// Serve built React frontend in production/demo mode
const clientDist = path.join(__dirname, '../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
