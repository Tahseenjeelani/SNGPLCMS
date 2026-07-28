// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const api = {
    // Complaints
    getComplaints: () => fetch(`${API_URL}/complaints`).then(res => res.json()),
    getComplaint: (id) => fetch(`${API_URL}/complaints/${id}`).then(res => res.json()),
    getComplaintLinks: (id) => fetch(`${API_URL}/complaints/${encodeURIComponent(id)}/links`).then(res => res.json()),
    createComplaint: (data) => fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateComplaint: (id, data) => fetch(`${API_URL}/complaints/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    completeComplaint: (id) => fetch(`${API_URL}/complaints/${id}/complete`, {
        method: 'POST'
    }).then(res => res.json()),
    deleteComplaint: (id) => fetch(`${API_URL}/complaints/${id}`, {
        method: 'DELETE'
    }).then(res => res.json()),

    // Issues
    getIssues: () => fetch(`${API_URL}/issues`).then(res => res.json()),
    getIssue: (id) => fetch(`${API_URL}/issues/${id}`).then(res => res.json()),
    createIssue: (data) => fetch(`${API_URL}/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateIssue: (id, data) => fetch(`${API_URL}/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteIssue: (id) => fetch(`${API_URL}/issues/${id}`, {
        method: 'DELETE'
    }).then(res => res.json()),

    // Purchases
    getPurchases: () => fetch(`${API_URL}/purchases`).then(res => res.json()),
    getPurchase: (id) => fetch(`${API_URL}/purchases/${id}`).then(res => res.json()),
    createPurchase: (data) => fetch(`${API_URL}/purchases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updatePurchase: (id, data) => fetch(`${API_URL}/purchases/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deletePurchase: (id) => fetch(`${API_URL}/purchases/${id}`, {
        method: 'DELETE'
    }).then(res => res.json()),

    // Scraps
    getScraps: () => fetch(`${API_URL}/scraps`).then(res => res.json()),
    getScrap: (id) => fetch(`${API_URL}/scraps/${id}`).then(res => res.json()),
    createScrap: (data) => fetch(`${API_URL}/scraps`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateScrap: (id, data) => fetch(`${API_URL}/scraps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteScrap: (id) => fetch(`${API_URL}/scraps/${id}`, {
        method: 'DELETE'
    }).then(res => res.json()),

    // Stock
    getStock: () => fetch(`${API_URL}/stock`).then(res => res.json()),
    getStockItem: (id) => fetch(`${API_URL}/stock/${id}`).then(res => res.json()),
    createStock: (data) => fetch(`${API_URL}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    updateStock: (id, data) => fetch(`${API_URL}/stock/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    }).then(res => res.json()),
    deleteStock: (id) => fetch(`${API_URL}/stock/${id}`, {
        method: 'DELETE'
    }).then(res => res.json()),

    // Dashboard
    getStats: () => fetch(`${API_URL}/dashboard/stats`).then(res => res.json()),
    getRecentActivities: () => fetch(`${API_URL}/dashboard/recent-activities`).then(res => res.json())
};