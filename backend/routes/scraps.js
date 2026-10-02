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
        let counter = await Counter.findById('scrap');
        if (!counter) {
            counter = new Counter({ _id: 'scrap', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const srNo = `SR-${String(counter.seq).padStart(3, '0')}`;
        const now = new Date();

        const items = (req.body.items || []).map(item => ({
            tradeSection: item.tradeSection || req.body.tradeSection || 'MASONRY',
            itemId: item.itemId || '',
            itemName: item.itemName,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'Pieces',
            sourceDocType: item.sourceDocType || req.body.sourceDocType || 'ROUTINE_WORK',
            sourceReference: (item.sourceDocType || req.body.sourceDocType) === 'ROUTINE_WORK' ? '' : (item.sourceReference || req.body.sourceReference || '').trim(),
            description: item.description || ''
        }));

        const firstItem = items[0] || {};

        const scrap = new Scrap({
            srNo,
            date: req.body.date || now,
            location: req.body.location || '',
            returnedBy: req.body.returnedBy,
            sourceOfShifting: req.body.sourceOfShifting || '',
            tradeSection: req.body.tradeSection || firstItem.tradeSection || 'MASONRY',
            itemId: req.body.itemId || firstItem.itemId || '',
            itemName: req.body.itemName || firstItem.itemName || '',
            quantity: req.body.quantity || firstItem.quantity || 0,
            unit: req.body.unit || firstItem.unit || 'Pieces',
            items,
            description: req.body.description || '',
            receivedBy: req.body.receivedBy || 'Store Keeper',
            sourceDocType: req.body.sourceDocType || firstItem.sourceDocType || 'ROUTINE_WORK',
            sourceReference: req.body.sourceReference || firstItem.sourceReference || '',
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

        const items = req.body.items ? req.body.items.map(item => ({
            tradeSection: item.tradeSection || req.body.tradeSection || 'MASONRY',
            itemId: item.itemId || '',
            itemName: item.itemName,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'Pieces',
            sourceDocType: item.sourceDocType || 'ROUTINE_WORK',
            sourceReference: item.sourceDocType === 'ROUTINE_WORK' ? '' : (item.sourceReference || '').trim(),
            description: item.description || ''
        })) : scrap.items;

        const firstItem = items[0] || {};

        Object.assign(scrap, {
            date: req.body.date || scrap.date,
            location: req.body.location !== undefined ? req.body.location : scrap.location,
            returnedBy: req.body.returnedBy || scrap.returnedBy,
            sourceOfShifting: req.body.sourceOfShifting !== undefined ? req.body.sourceOfShifting : scrap.sourceOfShifting,
            tradeSection: req.body.tradeSection || firstItem.tradeSection || scrap.tradeSection,
            itemId: req.body.itemId || firstItem.itemId || scrap.itemId,
            itemName: req.body.itemName || firstItem.itemName || scrap.itemName,
            quantity: req.body.quantity || firstItem.quantity || scrap.quantity,
            unit: req.body.unit || firstItem.unit || scrap.unit,
            items,
            description: req.body.description !== undefined ? req.body.description : scrap.description,
            receivedBy: req.body.receivedBy || scrap.receivedBy,
            sourceDocType: req.body.sourceDocType || firstItem.sourceDocType || scrap.sourceDocType,
            sourceReference: req.body.sourceReference !== undefined ? req.body.sourceReference : scrap.sourceReference,
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