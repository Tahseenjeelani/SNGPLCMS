// backend/routes/purchases.js
const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Stock = require('../models/Stock');
const Counter = require('../models/Counter');

// Get all purchases
router.get('/', async (req, res) => {
    try {
        const purchases = await Purchase.find().sort({ createdAt: -1 });
        res.json(purchases);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get single purchase
router.get('/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findOne({ cpNo: req.params.id });
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }
        res.json(purchase);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create purchase
router.post('/', async (req, res) => {
    try {
        let counter = await Counter.findById('purchase');
        if (!counter) {
            counter = new Counter({ _id: 'purchase', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const cpNo = `CP-${String(counter.seq).padStart(3, '0')}`;
        const now = new Date();
        const hasStoreItems = req.body.items.some(item => item.isStoreItem);

        const purchase = new Purchase({
            ...req.body,
            cpNo,
            addedToStock: hasStoreItems,
            stockUpdateDate: hasStoreItems ? now : null,
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now
        });

        await purchase.save();

        // Update stock for store items
        if (hasStoreItems) {
            for (const item of req.body.items) {
                if (item.isStoreItem) {
                    let stockItem = await Stock.findOne({ itemName: item.itemName });

                    if (stockItem) {
                        // Update existing stock
                        stockItem.currentStock += item.quantity;
                        stockItem.totalValue = stockItem.currentStock * stockItem.unitPrice;
                        stockItem.lastUpdated = now;
                        stockItem.modifiedBy = 'Admin';
                        stockItem.modifiedAt = now;

                        if (stockItem.currentStock < stockItem.minimumStock * 0.5) {
                            stockItem.status = 'CRITICAL';
                        } else if (stockItem.currentStock < stockItem.minimumStock) {
                            stockItem.status = 'LOW';
                        } else {
                            stockItem.status = 'GOOD';
                        }

                        stockItem.transactions.push({
                            date: now,
                            type: 'CASH_PURCHASE',
                            documentNo: cpNo,
                            quantity: item.quantity,
                            balance: stockItem.currentStock,
                            sourceDoc: req.body.sourceDocuments[0]?.reference || '',
                            remarks: `Purchased from market - ${item.description || ''}`
                        });

                        await stockItem.save();
                    } else {
                        // Create new stock item
                        let stockCounter = await Counter.findById('stock');
                        if (!stockCounter) {
                            stockCounter = new Counter({ _id: 'stock', seq: 0 });
                        }
                        stockCounter.seq += 1;
                        await stockCounter.save();

                        const itemId = `MAT-${String(stockCounter.seq).padStart(3, '0')}`;

                        const newStockItem = new Stock({
                            itemId,
                            itemName: item.itemName,
                            tradeSection: req.body.tradeSection,
                            category: req.body.expenseHead,
                            unit: item.unit,
                            currentStock: item.quantity,
                            minimumStock: 5,
                            maximumStock: 100,
                            openingStock: 0,
                            unitPrice: item.unitPrice,
                            totalValue: item.quantity * item.unitPrice,
                            location: 'New Item',
                            status: 'GOOD',
                            transactions: [{
                                date: now,
                                type: 'CASH_PURCHASE',
                                documentNo: cpNo,
                                quantity: item.quantity,
                                balance: item.quantity,
                                sourceDoc: req.body.sourceDocuments[0]?.reference || '',
                                remarks: `New item purchased from market - ${item.description || ''}`
                            }],
                            lastUpdated: now,
                            createdBy: 'Admin',
                            createdAt: now,
                            modifiedBy: 'Admin',
                            modifiedAt: now,
                            isActive: true
                        });

                        await newStockItem.save();
                    }
                }
            }
        }

        res.status(201).json(purchase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update purchase
router.put('/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findOne({ cpNo: req.params.id });
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }

        Object.assign(purchase, req.body);
        purchase.modifiedBy = 'Admin';
        purchase.modifiedAt = new Date();

        await purchase.save();
        res.json(purchase);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete purchase
router.delete('/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findOneAndDelete({ cpNo: req.params.id });
        if (!purchase) {
            return res.status(404).json({ message: 'Purchase not found' });
        }
        res.json({ message: 'Purchase deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;