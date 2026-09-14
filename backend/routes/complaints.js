// backend/routes/complaints.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Counter = require('../models/Counter');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const Scrap = require('../models/Scrap');

// Get all complaints (optionally filter by status)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        const complaints = await Complaint.find(filter).sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get only Open complaints (for dropdowns in register forms)
router.get('/open', async (req, res) => {
    try {
        const complaints = await Complaint.find({ status: 'Open' })
            .select('id complaintDate complainant description')
            .sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get linked register entries for a complaint
router.get('/:id/links', async (req, res) => {
    try {
        const complaintId = decodeURIComponent(req.params.id);

        const issues = await Issue.find({
            sourceDocType: 'COMPLAINT',
            sourceReference: complaintId
        });

        const purchases = await Purchase.find({
            sourceDocType: 'COMPLAINT',
            sourceReference: complaintId
        });

        const scraps = await Scrap.find({
            sourceDocType: 'COMPLAINT',
            sourceReference: complaintId
        });

        res.json({
            complaintId,
            issues: issues.map(issue => ({
                irNo: issue.irNo,
                itemName: issue.itemName,
                quantity: issue.quantity,
                unit: issue.unit,
                issuedTo: issue.issuedTo,
                issueDate: issue.issueDate,
                tradeSection: issue.tradeSection
            })),
            purchases: purchases.map(purchase => ({
                cpNo: purchase.cpNo,
                items: (purchase.items || []).map(i => i.itemName),
                totalAmount: purchase.totalAmount,
                purchasedBy: purchase.purchasedBy,
                purchaseDate: purchase.purchaseDate,
                isStoreStockItem: purchase.isStoreStockItem
            })),
            scraps: scraps.map(scrap => ({
                srNo: scrap.srNo,
                itemName: scrap.itemName,
                quantity: scrap.quantity,
                unit: scrap.unit,
                returnedBy: scrap.returnedBy,
                date: scrap.date,
                tradeSection: scrap.tradeSection
            }))
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single complaint by its business ID
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

        let counter = await Counter.findById('complaint');
        if (!counter) {
            counter = new Counter({ _id: 'complaint', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const complaintId = `${String(counter.seq).padStart(2, '0')}/${month}/${year}`;

        const complaint = new Complaint({
            id: complaintId,
            complaintDate: req.body.complaintDate,
            description: req.body.description,
            complainant: req.body.complainant,
            status: 'Open',
            remarks: req.body.remarks || '',
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

        // Only allow valid status values
        const allowedStatuses = ['Open', 'Completed'];
        if (req.body.status && !allowedStatuses.includes(req.body.status)) {
            return res.status(400).json({ message: `Invalid status. Allowed: ${allowedStatuses.join(', ')}` });
        }

        complaint.complaintDate = req.body.complaintDate || complaint.complaintDate;
        complaint.description = req.body.description || complaint.description;
        complaint.complainant = req.body.complainant || complaint.complainant;
        complaint.status = req.body.status || complaint.status;
        complaint.remarks = req.body.remarks !== undefined ? req.body.remarks : complaint.remarks;
        complaint.modifiedBy = 'Admin';
        complaint.modifiedAt = new Date();

        await complaint.save();
        res.json(complaint);
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