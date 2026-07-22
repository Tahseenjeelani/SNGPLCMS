// backend/routes/stock.js
const express = require('express');
const router = express.Router();
const Stock = require('../models/Stock');
const Counter = require('../models/Counter');

// Get all stock items
router.get('/', async (req, res) => {
    try {
        const stock = await Stock.find().sort({ createdAt: -1 });
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single stock item
router.get('/:id', async (req, res) => {
    try {
        const stock = await Stock.findOne({ itemId: req.params.id });
        if (!stock) {
            return res.status(404).json({ message: 'Stock item not found' });
        }
        res.json(stock);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create stock item
router.post('/', async (req, res) => {
    try {
        // Check for duplicate name
        const existing = await Stock.findOne({ itemName: req.body.itemName });
        if (existing) {
            return res.status(400).json({ message: 'Item name already exists' });
        }

        let counter = await Counter.findById('stock');
        if (!counter) {
            counter = new Counter({ _id: 'stock', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const itemId = `MAT-${String(counter.seq).padStart(3, '0')}`;
        const now = new Date();

        const stock = new Stock({
            ...req.body,
            itemId,
            totalValue: req.body.currentStock * req.body.unitPrice,
            status: getStockStatus(req.body.currentStock, req.body.minimumStock),
            transactions: [{
                date: now,
                type: 'OPENING',
                documentNo: 'OPEN-001',
                quantity: req.body.currentStock,
                balance: req.body.currentStock,
                sourceDoc: 'Initial Stock',
                remarks: 'Opening stock entry'
            }],
            lastUpdated: now,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now
        });

        await stock.save();
        res.status(201).json(stock);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update stock item
router.put('/:id', async (req, res) => {
    try {
        const stock = await Stock.findOne({ itemId: req.params.id });
        if (!stock) {
            return res.status(404).json({ message: 'Stock item not found' });
        }

        const oldStock = stock.currentStock;
        Object.assign(stock, req.body);
        stock.totalValue = req.body.currentStock * req.body.unitPrice;
        stock.status = getStockStatus(req.body.currentStock, req.body.minimumStock);
        stock.lastUpdated = new Date();
        stock.modifiedBy = 'Admin';
        stock.modifiedAt = new Date();

        // Add transaction if stock changed
        if (oldStock !== req.body.currentStock) {
            const diff = req.body.currentStock - oldStock;
            stock.transactions.push({
                date: new Date(),
                type: 'OPENING',
                documentNo: 'ADJUSTMENT',
                quantity: diff,
                balance: req.body.currentStock,
                sourceDoc: 'Manual Adjustment',
                remarks: `Stock adjusted from ${oldStock} to ${req.body.currentStock}`
            });
        }

        await stock.save();
        res.json(stock);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete stock item
router.delete('/:id', async (req, res) => {
    try {
        const stock = await Stock.findOneAndDelete({ itemId: req.params.id });
        if (!stock) {
            return res.status(404).json({ message: 'Stock item not found' });
        }
        res.json({ message: 'Stock item deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

function getStockStatus(current, minimum) {
    if (current < minimum * 0.5) return 'CRITICAL';
    if (current < minimum) return 'LOW';
    return 'GOOD';
}

module.exports = router;