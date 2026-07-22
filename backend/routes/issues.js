// backend/routes/issues.js
const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Stock = require('../models/Stock');
const Counter = require('../models/Counter');

// Get all issues
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find().sort({ createdAt: -1 });
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
        let counter = await Counter.findById('issue');
        if (!counter) {
            counter = new Counter({ _id: 'issue', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const irNo = `IR-${String(counter.seq).padStart(3, '0')}`;

        const issue = new Issue({
            ...req.body,
            irNo,
            createdBy: 'Admin',
            createdAt: new Date(),
            modifiedBy: 'Admin',
            modifiedAt: new Date()
        });

        await issue.save();

        // Update stock
        const stockItem = await Stock.findOne({ itemId: req.body.itemId });
        if (stockItem) {
            stockItem.currentStock -= req.body.quantity;
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
                type: 'ISSUE',
                documentNo: irNo,
                quantity: -req.body.quantity,
                balance: stockItem.currentStock,
                sourceDoc: req.body.sourceDocuments[0]?.reference || '',
                remarks: req.body.description || 'Issued from store'
            });

            await stockItem.save();
        }

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

        Object.assign(issue, req.body);
        issue.modifiedBy = 'Admin';
        issue.modifiedAt = new Date();

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