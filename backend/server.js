// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const complaintRoutes = require('./routes/complaints');
const issueRoutes = require('./routes/issues');
const purchaseRoutes = require('./routes/purchases');
const scrapRoutes = require('./routes/scraps');
const stockRoutes = require('./routes/stock');
const dashboardRoutes = require('./routes/dashboard');

app.use('/api/complaints', complaintRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/scraps', scrapRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/dashboard', dashboardRoutes);

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB connected successfully'))
    .catch((err) => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});