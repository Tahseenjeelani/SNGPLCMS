// backend/routes/complaints.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Counter = require('../models/Counter');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const Scrap = require('../models/Scrap');

// Get all complaints
router.get('/', async (req, res) => {
    try {
        const complaints = await Complaint.find().sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single complaint
router.get('/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        res.json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create complaint
router.post('/', async (req, res) => {
    try {
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();

        // Get counter
        let counter = await Counter.findById('complaint');
        if (!counter) {
            counter = new Counter({ _id: 'complaint', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const complaintId = `${String(counter.seq).padStart(2, '0')}/${month}/${year}`;

        const complaint = new Complaint({
            ...req.body,
            id: complaintId,
            sourceReference: complaintId,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now
        });

        await complaint.save();
        res.status(201).json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update complaint
router.put('/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        Object.assign(complaint, req.body);
        complaint.modifiedBy = 'Admin';
        complaint.modifiedAt = new Date();

        await complaint.save();
        res.json(complaint);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Complete complaint
router.post('/:id/complete', async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }

        const now = new Date();

        // Update complaint
        complaint.status = 'COMPLETED';
        complaint.isCompleted = true;
        complaint.completedDate = now;
        complaint.modifiedBy = 'Admin';
        complaint.modifiedAt = now;
        await complaint.save();

        // Lock linked issues
        await Issue.updateMany(
            { 'sourceDocuments.reference': req.params.id, 'sourceDocuments.status': 'PENDING' },
            {
                $set: {
                    'sourceDocuments.$.status': 'COMPLETED',
                    'sourceDocuments.$.isLocked': true,
                    'sourceDocuments.$.lockedAt': now,
                    'sourceDocuments.$.lockedBy': 'Admin'
                }
            }
        );

        // Lock linked purchases
        await Purchase.updateMany(
            { 'sourceDocuments.reference': req.params.id, 'sourceDocuments.status': 'PENDING' },
            {
                $set: {
                    'sourceDocuments.$.status': 'COMPLETED',
                    'sourceDocuments.$.isLocked': true,
                    'sourceDocuments.$.lockedAt': now,
                    'sourceDocuments.$.lockedBy': 'Admin'
                }
            }
        );

        // Lock linked scraps
        await Scrap.updateMany(
            { 'sourceDocuments.reference': req.params.id, 'sourceDocuments.status': 'PENDING' },
            {
                $set: {
                    'sourceDocuments.$.status': 'COMPLETED',
                    'sourceDocuments.$.isLocked': true,
                    'sourceDocuments.$.lockedAt': now,
                    'sourceDocuments.$.lockedBy': 'Admin'
                }
            }
        );

        res.json({ message: 'Complaint completed successfully', complaint });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete complaint
router.delete('/:id', async (req, res) => {
    try {
        const complaint = await Complaint.findOneAndDelete({ id: req.params.id });
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        res.json({ message: 'Complaint deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;