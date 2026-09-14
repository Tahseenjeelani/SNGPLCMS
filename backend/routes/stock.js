// backend/routes/stock.js
// Stock Register is READ-ONLY and COMPUTED.
// It aggregates data from:
//   1. All Issue Register entries (items issued from store)
//   2. Cash Purchase entries where isStoreStockItem === true
//
// Net Stock per item = Total Purchased (store) - Total Issued
const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');

// GET /api/stock — computed aggregate view
router.get('/', async (req, res) => {
    try {
        // Fetch all issues
        const issues = await Issue.find({ isActive: { $ne: false } });

        // Fetch only store-stock purchases
        const purchases = await Purchase.find({
            isStoreStockItem: true,
            isActive: { $ne: false }
        });

        // Build stock map keyed by itemName (normalised to lowercase for grouping)
        const stockMap = {};

        // Add incoming stock from store purchases
        for (const purchase of purchases) {
            for (const item of (purchase.items || [])) {
                const key = (item.itemName || '').trim().toLowerCase();
                if (!key) continue;
                if (!stockMap[key]) {
                    stockMap[key] = {
                        itemName: item.itemName.trim(),
                        unit: item.unit || '',
                        totalPurchased: 0,
                        totalIssued: 0,
                        lastUnitPrice: 0,
                        transactions: []
                    };
                }
                stockMap[key].totalPurchased += Number(item.quantity) || 0;
                stockMap[key].lastUnitPrice = item.unitPrice || stockMap[key].lastUnitPrice;
                stockMap[key].transactions.push({
                    type: 'PURCHASE',
                    docNo: purchase.cpNo,
                    date: purchase.purchaseDate,
                    quantity: Number(item.quantity) || 0,
                    sourceDocType: purchase.sourceDocType,
                    sourceReference: purchase.sourceReference
                });
            }
        }

        // Subtract issued stock from issues
        for (const issue of issues) {
            const key = (issue.itemName || '').trim().toLowerCase();
            if (!key) continue;
            if (!stockMap[key]) {
                // Item appears in issues but not in any store purchase
                stockMap[key] = {
                    itemName: issue.itemName.trim(),
                    unit: issue.unit || '',
                    totalPurchased: 0,
                    totalIssued: 0,
                    lastUnitPrice: 0,
                    transactions: []
                };
            }
            stockMap[key].totalIssued += Number(issue.quantity) || 0;
            if (issue.unit && !stockMap[key].unit) {
                stockMap[key].unit = issue.unit;
            }
            stockMap[key].transactions.push({
                type: 'ISSUE',
                docNo: issue.irNo,
                date: issue.issueDate,
                quantity: -(Number(issue.quantity) || 0),
                sourceDocType: issue.sourceDocType,
                sourceReference: issue.sourceReference
            });
        }

        // Convert map to sorted array
        const stockList = Object.values(stockMap).map(item => ({
            itemName: item.itemName,
            unit: item.unit,
            totalPurchased: item.totalPurchased,
            totalIssued: item.totalIssued,
            currentBalance: item.totalPurchased - item.totalIssued,
            lastUnitPrice: item.lastUnitPrice,
            estimatedValue: (item.totalPurchased - item.totalIssued) * item.lastUnitPrice,
            transactions: item.transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
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