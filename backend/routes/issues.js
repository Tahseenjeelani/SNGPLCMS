// backend/routes/issues.js
const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Counter = require('../models/Counter');

// Get all issues (optionally filter by sourceReference)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.sourceRef) {
            filter.sourceReference = req.query.sourceRef;
            filter.sourceDocType = 'COMPLAINT';
        }
        const issues = await Issue.find(filter).sort({ createdAt: -1 });
        res.json(issues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single issue
router.get('/:id', async (req, res) => {
    try {
        const issue = await Issue.findOne({ irNo: req.params.id });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json(issue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create issue
router.post('/', async (req, res) => {
    try {
        const { sourceDocType, sourceReference } = req.body;

        // Validate source document
        if (!sourceDocType) {
            return res.status(400).json({ message: 'Source document type is required.' });
        }

        // COMPLAINT source: validate complaint exists and is Open
        if (sourceDocType === 'COMPLAINT') {
            if (!sourceReference || !sourceReference.trim()) {
                return res.status(400).json({ message: 'Complaint reference is required when source is COMPLAINT.' });
            }
            const Complaint = require('../models/Complaint');
            const complaint = await Complaint.findOne({ id: sourceReference.trim() });
            if (!complaint) {
                return res.status(400).json({ message: `Complaint '${sourceReference}' does not exist.` });
            }
            if (complaint.status !== 'Open') {
                return res.status(400).json({ message: `Complaint '${sourceReference}' is not Open. Only Open complaints can be referenced.` });
            }
        }

        // Non-ROUTINE_WORK and non-COMPLAINT sources require a reference
        if (sourceDocType !== 'ROUTINE_WORK' && sourceDocType !== 'COMPLAINT') {
            if (!sourceReference || !sourceReference.trim()) {
                return res.status(400).json({ message: 'A reference number is required for this source document type.' });
            }
        }

        let counter = await Counter.findById('issue');
        if (!counter) {
            counter = new Counter({ _id: 'issue', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const irNo = `IR-${String(counter.seq).padStart(3, '0')}`;
        const now = new Date();

        const issue = new Issue({
            irNo,
            issueDate: req.body.issueDate,
            tradeSection: req.body.tradeSection,
            itemId: req.body.itemId,
            itemName: req.body.itemName,
            quantity: req.body.quantity,
            unit: req.body.unit,
            description: req.body.description || '',
            issuedTo: req.body.issuedTo,
            issuedBy: req.body.issuedBy || 'Store Keeper',
            station: req.body.station || '',
            location: req.body.location || '',
            isSiteReturn: req.body.isSiteReturn === true,
            sourceDocType,
            sourceReference: sourceDocType === 'ROUTINE_WORK' ? '' : (sourceReference || '').trim(),
            remarks: req.body.remarks || '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        });

        await issue.save();
        res.status(201).json(issue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update issue
router.put('/:id', async (req, res) => {
    try {
        const issue = await Issue.findOne({ irNo: req.params.id });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }

        // Validate if source is changing to COMPLAINT
        if (req.body.sourceDocType === 'COMPLAINT' && req.body.sourceReference) {
            const Complaint = require('../models/Complaint');
            const complaint = await Complaint.findOne({ id: req.body.sourceReference.trim() });
            if (!complaint) {
                return res.status(400).json({ message: `Complaint '${req.body.sourceReference}' does not exist.` });
            }
            if (complaint.status !== 'Open') {
                return res.status(400).json({ message: `Complaint '${req.body.sourceReference}' is not Open.` });
            }
        }

        Object.assign(issue, {
            issueDate: req.body.issueDate || issue.issueDate,
            tradeSection: req.body.tradeSection || issue.tradeSection,
            itemId: req.body.itemId || issue.itemId,
            itemName: req.body.itemName || issue.itemName,
            quantity: req.body.quantity || issue.quantity,
            unit: req.body.unit || issue.unit,
            description: req.body.description !== undefined ? req.body.description : issue.description,
            issuedTo: req.body.issuedTo || issue.issuedTo,
            issuedBy: req.body.issuedBy || issue.issuedBy,
            station: req.body.station !== undefined ? req.body.station : issue.station,
            location: req.body.location !== undefined ? req.body.location : issue.location,
            isSiteReturn: req.body.isSiteReturn !== undefined ? req.body.isSiteReturn : issue.isSiteReturn,
            sourceDocType: req.body.sourceDocType || issue.sourceDocType,
            sourceReference: req.body.sourceDocType === 'ROUTINE_WORK' ? '' : (req.body.sourceReference || issue.sourceReference),
            remarks: req.body.remarks !== undefined ? req.body.remarks : issue.remarks,
            modifiedBy: 'Admin',
            modifiedAt: new Date()
        });

        await issue.save();
        res.json(issue);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete issue
router.delete('/:id', async (req, res) => {
    try {
        const issue = await Issue.findOneAndDelete({ irNo: req.params.id });
        if (!issue) {
            return res.status(404).json({ message: 'Issue not found' });
        }
        res.json({ message: 'Issue deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;