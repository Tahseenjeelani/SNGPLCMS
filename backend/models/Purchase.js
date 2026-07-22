// backend/models/Purchase.js
const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
    cpNo: { type: String, required: true, unique: true },
    purchaseDate: { type: Date, required: true },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'], required: true },
    billInvoiceNo: String,
    items: [{
        itemId: String,
        itemName: String,
        quantity: Number,
        unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'] },
        unitPrice: Number,
        total: Number,
        description: String,
        isStoreItem: { type: Boolean, default: false },
        isNewItem: { type: Boolean, default: true }
    }],
    totalAmount: Number,
    purchasedBy: { type: String, required: true },
    jobNo: String,
    expenseHead: String,
    sourceDocuments: [{
        sourceType: { type: String, enum: ['COMPLAINT', 'APPROVAL', 'EMAIL', 'HSE', 'OTHER'] },
        reference: String,
        allocation: Number,
        allocatedItems: [String],
        status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
        isLocked: { type: Boolean, default: false },
        lockedAt: Date,
        lockedBy: String
    }],
    addedToStock: { type: Boolean, default: false },
    stockUpdateDate: Date,
    remarks: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date,
    modificationReason: String,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Purchase', purchaseSchema);