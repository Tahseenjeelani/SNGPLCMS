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

// Get linked entries for a complaint (Issues, Purchases, Scraps)
router.get('/:id/links', async (req, res) => {
    try {
        const complaintId = decodeURIComponent(req.params.id);

        const issues = await Issue.find({ 'sourceDocuments.reference': complaintId });
        const purchases = await Purchase.find({ 'sourceDocuments.reference': complaintId });
        const scraps = await Scrap.find({ 'sourceDocuments.reference': complaintId });

        const formattedIssues = [];
        issues.forEach(issue => {
            const matchingDoc = issue.sourceDocuments.find(doc => doc.reference === complaintId);
            if (matchingDoc) {
                formattedIssues.push({
                    irNo: issue.irNo,
                    itemName: issue.itemName,
                    allocation: matchingDoc.allocation,
                    unit: issue.unit,
                    status: matchingDoc.status || 'PENDING',
                    isLocked: matchingDoc.isLocked || false,
                    issueDate: issue.issueDate,
                    issuedTo: issue.issuedTo
                });
            }
        });

        const formattedPurchases = [];
        purchases.forEach(purchase => {
            const matchingDoc = purchase.sourceDocuments.find(doc => doc.reference === complaintId);
            if (matchingDoc) {
                formattedPurchases.push({
                    cpNo: purchase.cpNo,
                    items: purchase.items ? purchase.items.map(item => item.itemName || item) : [],
                    allocation: matchingDoc.allocation,
                    status: matchingDoc.status || 'PENDING',
                    isLocked: matchingDoc.isLocked || false,
                    purchaseDate: purchase.purchaseDate,
                    purchasedBy: purchase.purchasedBy
                });
            }
        });

        const formattedScraps = [];
        scraps.forEach(scrap => {
            const matchingDoc = scrap.sourceDocuments.find(doc => doc.reference === complaintId);
            if (matchingDoc) {
                formattedScraps.push({
                    srNo: scrap.srNo,
                    itemName: scrap.itemName,
                    allocation: matchingDoc.allocation,
                    unit: scrap.unit,
                    status: matchingDoc.status || 'PENDING',
                    isLocked: matchingDoc.isLocked || false,
                    date: scrap.date,
                    returnedBy: scrap.returnedBy
                });
            }
        });

        res.json({
            complaintId,
            issues: formattedIssues,
            purchases: formattedPurchases,
            scraps: formattedScraps
        });
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