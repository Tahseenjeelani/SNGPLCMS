// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Generic helper with error handling
const request = async (url, options = {}) => {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json' },
        ...options
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(err.message || `Request failed: ${res.status}`);
    }
    return res.json();
};

export const api = {
    // ─── Complaints ───────────────────────────────────────────────
    getComplaints: () => request(`${API_URL}/complaints`),
    getComplaint: (id) => request(`${API_URL}/complaints/${encodeURIComponent(id)}`),
    /** Returns only Open complaints — for dropdowns in register forms */
    getOpenComplaints: () => request(`${API_URL}/complaints/open`),
    /** Returns all Issues, Purchases, and Scraps linked to this complaint ID */
    getComplaintLinks: (id) => request(`${API_URL}/complaints/${encodeURIComponent(id)}/links`),
    createComplaint: (data) => request(`${API_URL}/complaints`, { method: 'POST', body: JSON.stringify(data) }),
    updateComplaint: (id, data) => request(`${API_URL}/complaints/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteComplaint: (id) => request(`${API_URL}/complaints/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    // ─── Issues ───────────────────────────────────────────────────
    getIssues: () => request(`${API_URL}/issues`),
    getIssue: (id) => request(`${API_URL}/issues/${encodeURIComponent(id)}`),
    createIssue: (data) => request(`${API_URL}/issues`, { method: 'POST', body: JSON.stringify(data) }),
    updateIssue: (id, data) => request(`${API_URL}/issues/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteIssue: (id) => request(`${API_URL}/issues/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    // ─── Cash Purchases ───────────────────────────────────────────
    getPurchases: () => request(`${API_URL}/purchases`),
    getPurchase: (id) => request(`${API_URL}/purchases/${encodeURIComponent(id)}`),
    createPurchase: (data) => request(`${API_URL}/purchases`, { method: 'POST', body: JSON.stringify(data) }),
    updatePurchase: (id, data) => request(`${API_URL}/purchases/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deletePurchase: (id) => request(`${API_URL}/purchases/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    // ─── Scrap / Return ───────────────────────────────────────────
    getScraps: () => request(`${API_URL}/scraps`),
    getScrap: (id) => request(`${API_URL}/scraps/${encodeURIComponent(id)}`),
    createScrap: (data) => request(`${API_URL}/scraps`, { method: 'POST', body: JSON.stringify(data) }),
    updateScrap: (id, data) => request(`${API_URL}/scraps/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteScrap: (id) => request(`${API_URL}/scraps/${encodeURIComponent(id)}`, { method: 'DELETE' }),

    // ─── Stock Register (Read-Only, Computed) ─────────────────────
    /** Returns computed stock: aggregates from Issues + Store-marked Cash Purchases */
    getStock: () => request(`${API_URL}/stock`),

    // ─── Dashboard ────────────────────────────────────────────────
    getStats: () => request(`${API_URL}/dashboard/stats`),
    getRecentActivities: () => request(`${API_URL}/dashboard/recent-activities`)
};