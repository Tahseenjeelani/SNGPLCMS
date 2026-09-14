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

        let counter = await Counter.findById('purchase');
        if (!counter) {
            counter = new Counter({ _id: 'purchase', seq: 0 });
        }
        counter.seq += 1;
        await counter.save();

        const cpNo = `CP-${String(counter.seq).padStart(3, '0')}`;
        const now = new Date();

        // Calculate total amount
        const items = req.body.items || [];
        const totalAmount = items.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice || 0), 0);

        const purchase = new Purchase({
            cpNo,
            purchaseDate: req.body.purchaseDate,
            tradeSection: req.body.tradeSection,
            billInvoiceNo: req.body.billInvoiceNo || '',
            items: items.map(item => ({
                itemName: item.itemName,
                quantity: item.quantity,
                unit: item.unit,
                unitPrice: item.unitPrice,
                total: item.total || (item.quantity * item.unitPrice),
                description: item.description || ''
            })),
            totalAmount,
            purchasedBy: req.body.purchasedBy,
            jobNo: req.body.jobNo || '',
            expenseHead: req.body.expenseHead || '',
            isStoreStockItem: !!req.body.isStoreStockItem,
            sourceDocType,
            sourceReference: sourceDocType === 'ROUTINE_WORK' ? '' : (sourceReference || '').trim(),
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

        const items = req.body.items || purchase.items;
        const totalAmount = items.reduce((sum, item) => sum + (item.total || item.quantity * item.unitPrice || 0), 0);

        Object.assign(purchase, {
            purchaseDate: req.body.purchaseDate || purchase.purchaseDate,
            tradeSection: req.body.tradeSection || purchase.tradeSection,
            billInvoiceNo: req.body.billInvoiceNo !== undefined ? req.body.billInvoiceNo : purchase.billInvoiceNo,
            items,
            totalAmount,
            purchasedBy: req.body.purchasedBy || purchase.purchasedBy,
            jobNo: req.body.jobNo !== undefined ? req.body.jobNo : purchase.jobNo,
            expenseHead: req.body.expenseHead !== undefined ? req.body.expenseHead : purchase.expenseHead,
            isStoreStockItem: req.body.isStoreStockItem !== undefined ? !!req.body.isStoreStockItem : purchase.isStoreStockItem,
            sourceDocType: req.body.sourceDocType || purchase.sourceDocType,
            sourceReference: req.body.sourceDocType === 'ROUTINE_WORK' ? '' : (req.body.sourceReference || purchase.sourceReference),
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