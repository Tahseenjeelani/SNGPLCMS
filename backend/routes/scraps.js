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

        // Validate complaint source documents
        const Complaint = require('../models/Complaint');
        if (req.body.sourceDocuments && req.body.sourceDocuments.length > 0) {
            for (const doc of req.body.sourceDocuments) {
                if (doc.sourceType === 'COMPLAINT') {
                    const complaint = await Complaint.findOne({ id: doc.reference });
                    if (!complaint) {
                        return res.status(400).json({ message: `Complaint with ID '${doc.reference}' does not exist.` });
                    }
                }
            }
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

        // Update stock
        const Stock = require('../models/Stock');
        const stockItem = await Stock.findOne({ itemId: req.body.itemId });
        if (stockItem) {
            stockItem.currentStock += Number(req.body.quantity);
            stockItem.totalValue = stockItem.currentStock * stockItem.unitPrice;
            stockItem.lastUpdated = new Date();
            stockItem.modifiedBy = 'Admin';
            stockItem.modifiedAt = new Date();

            // Update status
            if (stockItem.currentStock < stockItem.minimumStock * 0.5) {
                stockItem.status = 'CRITICAL';
            } else if (stockItem.currentStock < stockItem.minimumStock) {
                stockItem.status = 'LOW';
            } else {
                stockItem.status = 'GOOD';
            }

            stockItem.transactions.push({
                date: new Date(),
                type: 'SCRAP_RETURN',
                documentNo: srNo,
                quantity: Number(req.body.quantity),
                balance: stockItem.currentStock,
                sourceDoc: req.body.sourceDocuments[0]?.reference || '',
                remarks: req.body.description || 'Returned scrap material'
            });

            await stockItem.save();
        }

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