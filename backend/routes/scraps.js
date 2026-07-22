// backend/routes/scraps.js
const express = require('express');
const router = express.Router();
const Scrap = require('../models/Scrap');
const Counter = require('../models/Counter');

// Get all scraps
router.get('/', async (req, res) => {
    try {
        const scraps = await Scrap.find().sort({ createdAt: -1 });
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

        const scrap = new Scrap({
            ...req.body,
            srNo,
            createdBy: 'Admin',
            createdAt: new Date(),
            modifiedBy: 'Admin',
            modifiedAt: new Date()
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

        Object.assign(scrap, req.body);
        scrap.modifiedBy = 'Admin';
        scrap.modifiedAt = new Date();

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