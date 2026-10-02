// backend/models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    cpNo: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, required: true },
    registerDate: { type: Date, default: Date.now },
    pageNo: { type: String, default: '' },
    srNo: { type: String, default: '' },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'], required: false },
    billInvoiceNo: String,
    items: [{
        tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'] },
        itemName: String,
        quantity: Number,
        unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'] },
        unitPrice: Number,
        total: Number,
        location: String,
        description: String,
        isStoreStockItem: { type: Boolean, default: false },
        sourceDocType: {
            type: String,
            enum: ['COMPLAINT', 'APPROVAL', 'HSE_ANOMALY', 'EMAIL', 'ROUTINE_WORK']
        },
        sourceReference: { type: String, default: '' }
    }],
    totalAmount: Number,
    purchasedBy: { type: String, required: true },
    employeeSnNo: { type: String, default: '' },
    jobNo: String,
    expenseHead: String,
    // Top-level flag: does this purchase go into the Store Stock?
    isStoreStockItem: { type: Boolean, default: false },
    // Flat single source document (optional legacy fallback)
    sourceDocType: {
        type: String,
        enum: ['COMPLAINT', 'APPROVAL', 'HSE_ANOMALY', 'EMAIL', 'ROUTINE_WORK'],
        required: false
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