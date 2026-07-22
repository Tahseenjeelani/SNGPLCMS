// backend/models/Scrap.js
const mongoose = require('mongoose');

const scrapSchema = new mongoose.Schema({
    srNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'], required: true },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'], required: true },
    description: String,
    returnedBy: { type: String, required: true },
    receivedBy: String,
    sourceDocuments: [{
        sourceType: { type: String, enum: ['COMPLAINT', 'APPROVAL', 'EMAIL', 'HSE', 'OTHER'] },
        reference: String,
        allocation: Number,
        status: { type: String, enum: ['PENDING', 'COMPLETED'], default: 'PENDING' },
        isLocked: { type: Boolean, default: false },
        lockedAt: Date,
        lockedBy: String
    }],
    remarks: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date,
    modificationReason: String,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Scrap', scrapSchema);