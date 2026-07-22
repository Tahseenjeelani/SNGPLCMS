// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const Issue = require('../models/Issue');
const Purchase = require('../models/Purchase');
const Scrap = require('../models/Scrap');
const Stock = require('../models/Stock');

router.get('/stats', async (req, res) => {
    try {
        const complaints = await Complaint.find();
        const issues = await Issue.find();
        const purchases = await Purchase.find();
        const scraps = await Scrap.find();
        const stock = await Stock.find();

        const stats = {
            totalComplaints: complaints.length,
            pendingComplaints: complaints.filter(c => c.status !== 'COMPLETED' && c.status !== 'CLOSED').length,
            completedComplaints: complaints.filter(c => c.status === 'COMPLETED' || c.status === 'CLOSED').length,
            totalIssues: issues.length,
            totalPurchases: purchases.length,
            totalScraps: scraps.length,
            stockItems: stock.length,
            lowStockItems: stock.filter(s => s.status === 'LOW').length,
            criticalStockItems: stock.filter(s => s.status === 'CRITICAL').length
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/recent-activities', async (req, res) => {
    try {
        const activities = [];

        const complaints = await Complaint.find().sort({ createdAt: -1 }).limit(5);
        complaints.forEach(c => {
            activities.push({
                id: c.id,
                type: 'COMPLAINT',
                title: `Complaint ${c.id}`,
                description: `${c.location} - ${c.indenter}`,
                status: c.status,
                timestamp: c.createdAt
            });
        });

        const issues = await Issue.find().sort({ createdAt: -1 }).limit(3);
        issues.forEach(i => {
            activities.push({
                id: i.irNo,
                type: 'ISSUE',
                title: `Issue ${i.irNo}`,
                description: `${i.itemName} (${i.quantity} ${i.unit})`,
                status: i.isActive ? 'Active' : 'Inactive',
                timestamp: i.createdAt
            });
        });

        const purchases = await Purchase.find().sort({ createdAt: -1 }).limit(3);
        purchases.forEach(p => {
            activities.push({
                id: p.cpNo,
                type: 'PURCHASE',
                title: `Purchase ${p.cpNo}`,
                description: `$${p.totalAmount} - ${p.tradeSection}`,
                status: p.addedToStock ? 'Added to Stock' : 'Consumable',
                timestamp: p.createdAt
            });
        });

        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        res.json(activities.slice(0, 10));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;