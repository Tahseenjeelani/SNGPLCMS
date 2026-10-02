const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const Scrap = require('../models/Scrap');

// GET /api/stock — computed aggregate view
router.get('/', async (req, res) => {
    try {
        const issues = await Issue.find({ isActive: { $ne: false } });
        const purchases = await Purchase.find({ isActive: { $ne: false } });
        const scraps = await Scrap.find({ isActive: { $ne: false } });

        const stockMap = {};

        const getOrCreate = (name, trade, unit) => {
            const key = (name || '').trim().toLowerCase();
            if (!key) return null;
            if (!stockMap[key]) {
                stockMap[key] = {
                    itemName: name.trim(),
                    tradeSection: trade || 'MASONRY',
                    unit: unit || 'Pieces',
                    totalPurchased: 0,
                    totalIssued: 0,
                    totalReturn: 0,
                    lastUnitPrice: 0,
                    transactions: []
                };
            }
            return stockMap[key];
        };

        // 1. Store Stock Purchases
        for (const purchase of purchases) {
            for (const item of (purchase.items || [])) {
                if (item.isStoreStockItem || purchase.isStoreStockItem) {
                    const sItem = getOrCreate(item.itemName, item.tradeSection || purchase.tradeSection, item.unit);
                    if (sItem) {
                        const qty = Number(item.quantity) || 0;
                        sItem.totalPurchased += qty;
                        sItem.lastUnitPrice = item.unitPrice || sItem.lastUnitPrice;
                        sItem.transactions.push({
                            type: 'PURCHASE',
                            docNo: purchase.cpNo,
                            date: purchase.purchaseDate,
                            quantity: qty,
                            sourceDocType: item.sourceDocType || purchase.sourceDocType,
                            sourceReference: item.sourceReference || purchase.sourceReference
                        });
                    }
                }
            }
        }

        // 2. Issues & Returns
        for (const issue of issues) {
            const sItem = getOrCreate(issue.itemName, issue.tradeSection, issue.unit);
            if (sItem) {
                const issuedQty = Number(issue.issuedQuantity !== undefined ? issue.issuedQuantity : (issue.isSiteReturn ? 0 : issue.quantity)) || 0;
                const returnQty = Number(issue.returnQuantity !== undefined ? issue.returnQuantity : (issue.isSiteReturn ? issue.quantity : 0)) || 0;

                if (issuedQty > 0) {
                    sItem.totalIssued += issuedQty;
                    sItem.transactions.push({
                        type: 'ISSUE',
                        docNo: issue.irNo,
                        date: issue.issueDate,
                        quantity: -issuedQty,
                        sourceDocType: issue.sourceDocType,
                        sourceReference: issue.sourceReference
                    });
                }
                if (returnQty > 0) {
                    sItem.totalReturn += returnQty;
                    sItem.transactions.push({
                        type: 'SITE_RETURN',
                        docNo: issue.irNo,
                        date: issue.issueDate,
                        quantity: returnQty,
                        sourceDocType: issue.sourceDocType,
                        sourceReference: issue.sourceReference
                    });
                }
            }
        }

        // 3. Scrap Returns
        for (const scrap of scraps) {
            const items = (scrap.items && scrap.items.length > 0) ? scrap.items : [scrap];
            for (const item of items) {
                const sItem = getOrCreate(item.itemName, item.tradeSection || scrap.tradeSection, item.unit);
                if (sItem) {
                    const qty = Number(item.quantity) || 0;
                    sItem.totalReturn += qty;
                    sItem.transactions.push({
                        type: 'SCRAP_RETURN',
                        docNo: scrap.srNo,
                        date: scrap.date,
                        quantity: qty,
                        sourceDocType: item.sourceDocType || scrap.sourceDocType,
                        sourceReference: item.sourceReference || scrap.sourceReference
                    });
                }
            }
        }

        // Convert map to sorted array
        const stockList = Object.values(stockMap).map(item => ({
            itemName: item.itemName,
            tradeSection: item.tradeSection,
            unit: item.unit,
            totalPurchased: item.totalPurchased,
            totalIssued: item.totalIssued,
            totalReturn: item.totalReturn,
            currentBalance: (item.totalPurchased + item.totalReturn) - item.totalIssued,
            lastUnitPrice: item.lastUnitPrice,
            estimatedValue: ((item.totalPurchased + item.totalReturn) - item.totalIssued) * item.lastUnitPrice,
            transactions: item.transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
        })).sort((a, b) => a.itemName.localeCompare(b.itemName));

        res.json(stockList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// All write operations are forbidden — Stock is read-only
router.post('/', (req, res) => {
    res.status(405).json({ message: 'Stock Register is read-only. Items are managed through the Issue and Cash Purchase registers.' });
});

router.put('/:id', (req, res) => {
    res.status(405).json({ message: 'Stock Register is read-only. Items are managed through the Issue and Cash Purchase registers.' });
});

router.delete('/:id', (req, res) => {
    res.status(405).json({ message: 'Stock Register is read-only. Items are managed through the Issue and Cash Purchase registers.' });
});

module.exports = router;