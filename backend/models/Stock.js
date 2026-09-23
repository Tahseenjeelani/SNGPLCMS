// backend/models/Stock.js
const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
    itemId: { type: String, required: true, unique: true },
    itemName: { type: String, required: true, unique: true },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'], required: true },
    category: String,
    unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'], required: true },
    currentStock: { type: Number, default: 0 },
    minimumStock: { type: Number, required: true },
    maximumStock: Number,
    openingStock: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    totalValue: { type: Number, default: 0 },
    location: String,
    status: { type: String, enum: ['GOOD', 'LOW', 'CRITICAL'], default: 'GOOD' },
    transactions: [{
        date: { type: Date, default: Date.now },
        type: { type: String, enum: ['OPENING', 'ISSUE', 'CASH_PURCHASE'] },
        documentNo: String,
        quantity: Number,
        balance: Number,
        sourceDoc: String,
        remarks: String
    }],
    lastUpdated: { type: Date, default: Date.now },
    lastVerifiedDate: Date,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Stock', stockSchema);