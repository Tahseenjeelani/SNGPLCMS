// backend/routes/purchases.js
const express = require('express');
const router = express.Router();
const Purchase = require('../models/Purchase');
const Counter = require('../models/Counter');

// Get all purchases (optionally filter by sourceReference)
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.sourceRef) {
            filter.sourceReference = req.query.sourceRef;
            filter.sourceDocType = 'COMPLAINT';
        }
        const purchases = await Purchase.find(filter).sort({ createdAt: -1 });
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

        const items = (req.body.items || []).map(item => ({
            tradeSection: item.tradeSection || req.body.tradeSection || 'MASONRY',
            itemName: item.itemName,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'Pieces',
            unitPrice: Number(item.unitPrice) || 0,
            total: item.total || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
            location: item.location || '',
            description: item.description || '',
            isStoreStockItem: item.isStoreStockItem !== undefined ? !!item.isStoreStockItem : true,
            sourceDocType: item.sourceDocType || req.body.sourceDocType || 'ROUTINE_WORK',
            sourceReference: (item.sourceDocType || req.body.sourceDocType) === 'ROUTINE_WORK' ? '' : (item.sourceReference || req.body.sourceReference || '').trim()
        }));

        const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

        const purchase = new Purchase({
            cpNo,
            purchaseDate: req.body.purchaseDate || now,
            registerDate: req.body.registerDate || now,
            pageNo: req.body.pageNo || '',
            srNo: req.body.srNo || '',
            tradeSection: req.body.tradeSection || (items[0] ? items[0].tradeSection : 'MASONRY'),
            billInvoiceNo: req.body.billInvoiceNo || '',
            items,
            totalAmount,
            purchasedBy: req.body.purchasedBy,
            employeeSnNo: req.body.employeeSnNo || '',
            jobNo: req.body.jobNo || '',
            expenseHead: req.body.expenseHead || '',
            isStoreStockItem: items.some(i => i.isStoreStockItem),
            sourceDocType: req.body.sourceDocType || (items[0] ? items[0].sourceDocType : 'ROUTINE_WORK'),
            sourceReference: req.body.sourceReference || (items[0] ? items[0].sourceReference : ''),
            remarks: req.body.remarks || '',
            createdBy: 'Admin',
            createdAt: now,
            modifiedBy: 'Admin',
            modifiedAt: now,
            isActive: true
        });

        await purchase.save();
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

        const items = req.body.items ? req.body.items.map(item => ({
            tradeSection: item.tradeSection || req.body.tradeSection || 'MASONRY',
            itemName: item.itemName,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || 'Pieces',
            unitPrice: Number(item.unitPrice) || 0,
            total: item.total || ((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)),
            location: item.location || '',
            description: item.description || '',
            isStoreStockItem: item.isStoreStockItem !== undefined ? !!item.isStoreStockItem : true,
            sourceDocType: item.sourceDocType || 'ROUTINE_WORK',
            sourceReference: item.sourceDocType === 'ROUTINE_WORK' ? '' : (item.sourceReference || '').trim()
        })) : purchase.items;

        const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);

        Object.assign(purchase, {
            purchaseDate: req.body.purchaseDate || purchase.purchaseDate,
            registerDate: req.body.registerDate || purchase.registerDate,
            pageNo: req.body.pageNo !== undefined ? req.body.pageNo : purchase.pageNo,
            srNo: req.body.srNo !== undefined ? req.body.srNo : purchase.srNo,
            tradeSection: req.body.tradeSection || purchase.tradeSection,
            billInvoiceNo: req.body.billInvoiceNo !== undefined ? req.body.billInvoiceNo : purchase.billInvoiceNo,
            items,
            totalAmount,
            purchasedBy: req.body.purchasedBy || purchase.purchasedBy,
            employeeSnNo: req.body.employeeSnNo !== undefined ? req.body.employeeSnNo : purchase.employeeSnNo,
            jobNo: req.body.jobNo !== undefined ? req.body.jobNo : purchase.jobNo,
            expenseHead: req.body.expenseHead !== undefined ? req.body.expenseHead : purchase.expenseHead,
            isStoreStockItem: items.some(i => i.isStoreStockItem),
            sourceDocType: req.body.sourceDocType || purchase.sourceDocType,
            sourceReference: req.body.sourceReference !== undefined ? req.body.sourceReference : purchase.sourceReference,
            remarks: req.body.remarks !== undefined ? req.body.remarks : purchase.remarks,
            modifiedBy: 'Admin',
            modifiedAt: new Date()
        });

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