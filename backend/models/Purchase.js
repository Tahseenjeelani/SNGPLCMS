// backend/models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    cpNo: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, required: true },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'], required: true },
    billInvoiceNo: String,
    items: [{
        itemName: String,
        quantity: Number,
        unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'] },
        unitPrice: Number,
        total: Number,
        description: String
    }],
    totalAmount: Number,
    purchasedBy: { type: String, required: true },
    jobNo: String,
    expenseHead: String,
    // Top-level flag: does this purchase go into the Store Stock?
    isStoreStockItem: { type: Boolean, default: false },
    // Flat single source document (one per entry)
    sourceDocType: {
        type: String,
        enum: ['COMPLAINT', 'APPROVAL', 'HSE_ANOMALY', 'EMAIL', 'ROUTINE_WORK'],
        required: true
    },
    sourceReference: {
        type: String,
        default: ''
    },
    remarks: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Purchase', purchaseSchema);