// backend/models/Scrap.js
const mongoose = require('mongoose');

const scrapSchema = new mongoose.Schema({
    srNo: { type: String, required: true, unique: true },
    date: { type: Date, required: true },
    location: { type: String },
    returnedBy: { type: String, required: true },
    sourceOfShifting: { type: String, default: '' },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'] },
    itemId: { type: String },
    itemName: { type: String },
    quantity: { type: Number },
    unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'] },
    // Multi-item support per entry
    items: [{
        tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'] },
        itemId: String,
        itemName: String,
        quantity: Number,
        unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'] },
        sourceDocType: {
            type: String,
            enum: ['COMPLAINT', 'APPROVAL', 'HSE_ANOMALY', 'EMAIL', 'ROUTINE_WORK']
        },
        sourceReference: { type: String, default: '' },
        description: String
    }],
    description: String,
    receivedBy: String,
    // Top-level legacy fallback
    sourceDocType: {
        type: String,
        enum: ['COMPLAINT', 'APPROVAL', 'HSE_ANOMALY', 'EMAIL', 'ROUTINE_WORK']
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

module.exports = mongoose.model('Scrap', scrapSchema);