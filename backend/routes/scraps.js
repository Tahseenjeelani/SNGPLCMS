// backend/routes/scraps.js
const express = require('express');
const router = express.Router();
const Scrap = require('../models/Scrap');
const Counter = require('../models/Counter');

// Get all scraps (optionally filter by sourceReference)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.sourceRef) {
            filter.sourceReference = req.query.sourceRef;
            filter.sourceDocType = 'COMPLAINT';
        }
        const scraps = await Scrap.find(filter).sort({ createdAt: -1 });
        res.json(scraps);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single scrap
router.get('/:id', async (req, res) => {
    try {
        const scrap = await Scrap.findOne({ srNo: req.params.id });
        if (!scrap) {
            return res.status(404).json({ message: 'Scrap not found' });
        }
        res.json(scrap);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create scrap
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

        let counter = await Counter.findById('scrap');
        if (!counter) {
            counter = new Counter({ _id: 'scrap', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const srNo = `SR-${String(counter.seq).padStart(3, '0')}`;
        const now = new Date();

        const scrap = new Scrap({
            srNo,
            date: req.body.date,
            tradeSection: req.body.tradeSection,
            itemId: req.body.itemId,
            itemName: req.body.itemName,
            quantity: req.body.quantity,
            unit: req.body.unit,
            description: req.body.description || '',
            returnedBy: req.body.returnedBy,
            receivedBy: req.body.receivedBy || 'Store Keeper',
            sourceDocType,
            sourceReference: sourceDocType === 'ROUTINE_WORK' ? '' : (sourceReference || '').trim(),
            remarks: req.body.remarks || '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        });

        await scrap.save();
        res.status(201).json(scrap);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update scrap
router.put('/:id', async (req, res) => {
    try {
        const scrap = await Scrap.findOne({ srNo: req.params.id });
        if (!scrap) {
            return res.status(404).json({ message: 'Scrap not found' });
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

        Object.assign(scrap, {
            date: req.body.date || scrap.date,
            tradeSection: req.body.tradeSection || scrap.tradeSection,
            itemId: req.body.itemId || scrap.itemId,
            itemName: req.body.itemName || scrap.itemName,
            quantity: req.body.quantity || scrap.quantity,
            unit: req.body.unit || scrap.unit,
            description: req.body.description !== undefined ? req.body.description : scrap.description,
            returnedBy: req.body.returnedBy || scrap.returnedBy,
            receivedBy: req.body.receivedBy || scrap.receivedBy,
            sourceDocType: req.body.sourceDocType || scrap.sourceDocType,
            sourceReference: req.body.sourceDocType === 'ROUTINE_WORK' ? '' : (req.body.sourceReference || scrap.sourceReference),
            remarks: req.body.remarks !== undefined ? req.body.remarks : scrap.remarks,
            modifiedBy: 'Admin',
            modifiedAt: new Date()
        });

        await scrap.save();
        res.json(scrap);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete scrap
router.delete('/:id', async (req, res) => {
    try {
        const scrap = await Scrap.findOneAndDelete({ srNo: req.params.id });
        if (!scrap) {
            return res.status(404).json({ message: 'Scrap not found' });
        }
        res.json({ message: 'Scrap deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;