// backend/models/Complaint.js
const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    complaintDate: { type: Date, required: true },
    description: { type: String, required: true },
    complainant: { type: String, required: true },
    station: { type: String },
    location: { type: String },
    status: {
        type: String,
        enum: ['Open', 'Completed'],
        default: 'Open'
    },
    remarks: String,
    createdBy: String,
    createdAt: { type: Date, default: Date.now },
    modifiedBy: String,
    modifiedAt: Date
});

module.exports = mongoose.model('Complaint', complaintSchema);