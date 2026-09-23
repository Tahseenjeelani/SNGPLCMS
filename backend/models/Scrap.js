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
    location: { type: String },
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

module.exports = mongoose.model('Scrap', scrapSchema);