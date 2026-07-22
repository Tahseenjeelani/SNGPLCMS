// backend/models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    complaintDate: { type: Date, required: true },
    location: { type: String, required: true },
    indenter: { type: String, required: true },
    procurementType: { type: String, enum: ['STORE', 'MARKET', 'BOTH'], required: true },
    storeItems: [{
        itemId: String,
        itemName: String,
        quantity: Number,
        unit: String
    }],
    marketItems: [{
        itemName: String,
        quantity: Number,
        unit: String,
        unitPrice: Number,
        total: Number
    }],
    voucherNumber: String,
    totalBillAmount: Number,
    attendedBy: String,
    completedDate: Date,
    status: {
        type: String,
        enum: ['NEW', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'VERIFIED', 'CLOSED'],
        default: 'NEW'
    },
    sourceDocType: { type: String, default: 'COMPLAINT' },
    sourceReference: String,
    isCompleted: { type: Boolean, default: false },
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date,
    remarks: String
});

module.exports = mongoose.model('Complaint', complaintSchema);