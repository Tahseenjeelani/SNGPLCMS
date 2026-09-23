// backend/models/Issue.js
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({
    irNo: { type: String, required: true, unique: true },
    issueDate: { type: Date, required: true },
    tradeSection: { type: String, enum: ['MASONRY', 'PLUMBING', 'CARPENTRY', 'PAINTING'], required: true },
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, enum: ['Bags', 'Kg', 'Pieces', 'Liters', 'Meters', 'Cft', 'Tins', 'Rolls'], required: true },
    description: String,
    issuedTo: { type: String, required: true },
    issuedBy: String,
    station: { type: String },
    location: { type: String },
    isSiteReturn: { type: Boolean, default: false },
    // Flat single source document (one per entry)
    sourceDocType: {
        type: String,
        enum: ['COMPLAINT', 'APPROVAL', 'HSE_ANOMALY', 'EMAIL', 'ROUTINE_WORK'],
        required: true
    },
    sourceReference: {
        type: String,
        // Required for all types except ROUTINE_WORK
        default: ''
    },
    remarks: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date,
    isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Issue', issueSchema);