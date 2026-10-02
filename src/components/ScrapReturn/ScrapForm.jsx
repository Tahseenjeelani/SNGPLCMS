// src/components/ScrapReturn/ScrapForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_DOC_TYPES, getSourceDocConfig } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const ScrapForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        returnedBy: '',
        sourceOfShifting: '',
        items: [],
        remarks: ''
    });

    const [newItem, setNewItem] = useState({
        tradeSection: 'MASONRY',
        selectedStockId: '',
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        sourceDocType: 'COMPLAINT',
        sourceReference: '',
        description: ''
    });

    const [allTradeItems, setAllTradeItems] = useState([]);
    const [openComplaints, setOpenComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadAllTradeItems();
        loadOpenComplaints();
        if (isEdit) loadScrap();
    }, [id]);

    const loadAllTradeItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = data.issues || [];
            const purchases = data.purchases || [];
            const manualStocks = data.manualStocks || [];

            const itemMap = {};

            purchases.forEach(p => {
                const trade = p.tradeSection || 'MASONRY';
                (p.items || []).forEach(item => {
                    const name = (item.itemName || '').trim();
                    if (!name) return;
                    const key = `${trade}_${name.toLowerCase()}`;
                    if (!itemMap[key]) {
                        itemMap[key] = { itemId: key, itemName: name, tradeSection: trade, unit: item.unit || 'Pieces' };
                    }
                });
            });

            issues.forEach(iss => {
                const trade = iss.tradeSection || 'MASONRY';
                const name = (iss.itemName || '').trim();
                if (!name) return;
                const key = `${trade}_${name.toLowerCase()}`;
                if (!itemMap[key]) {
                    itemMap[key] = { itemId: key, itemName: name, tradeSection: trade, unit: iss.unit || 'Pieces' };
                }
            });

            manualStocks.forEach(m => {
                const trade = m.tradeSection || 'MASONRY';
                const name = (m.itemName || '').trim();
                if (!name) return;
                const key = `${trade}_${name.toLowerCase()}`;
                if (!itemMap[key]) {
                    itemMap[key] = { itemId: key, itemName: name, tradeSection: trade, unit: m.unit || 'Pieces' };
                }
            });

            setAllTradeItems(Object.values(itemMap));
        } catch (e) {
            console.error('Error loading trade items:', e);
        }
    };

    const loadOpenComplaints = useCallback(async () => {
        try {
            const complaints = await api.getOpenComplaints();
            if (Array.isArray(complaints)) { setOpenComplaints(complaints); return; }
        } catch (_) {}
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            setOpenComplaints((data?.complaints || []).filter(c => c.status === 'Open'));
        } catch (e) { console.error(e); }
    }, []);

    const loadScrap = async () => {
        let scrap = null;
        try {
            scrap = await api.getScrap(id);
        } catch (_) {}

        if (!scrap || !scrap.srNo) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                scrap = (data?.scraps || []).find(s => s.srNo === id);
            } catch (e) { console.error(e); }
        }

        if (scrap) {
            const itemsList = (scrap.items && scrap.items.length > 0) ? scrap.items : [{
                tradeSection: scrap.tradeSection || 'MASONRY',
                itemName: scrap.itemName || '',
                quantity: scrap.quantity || 1,
                unit: scrap.unit || 'Pieces',
                sourceDocType: scrap.sourceDocType || 'COMPLAINT',
                sourceReference: scrap.sourceReference || '',
                description: scrap.description || ''
            }];

            setFormData({
                date: scrap.date ? new Date(scrap.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                location: scrap.location || '',
                returnedBy: scrap.returnedBy || '',
                sourceOfShifting: scrap.sourceOfShifting || '',
                items: itemsList,
                remarks: scrap.remarks || ''
            });
        }
    };

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewItemChange = (e) => {
        const { name, value } = e.target;

        if (name === 'sourceDocType') {
            setNewItem(prev => ({ ...prev, sourceDocType: value, sourceReference: '' }));
            return;
        }

        if (name === 'tradeSection') {
            setNewItem(prev => ({
                ...prev,
                tradeSection: value,
                selectedStockId: '',
                itemName: ''
            }));
            return;
        }

        setNewItem(prev => ({ ...prev, [name]: value }));
    };

    const handleStockSelect = (e) => {
        const val = e.target.value;
        if (val === '__NEW__') {
            setNewItem(prev => ({ ...prev, selectedStockId: '__NEW__', itemName: '' }));
        } else {
            const found = allTradeItems.find(s => s.itemId === val);
            setNewItem(prev => ({
                ...prev,
                selectedStockId: val,
                itemName: found ? found.itemName : '',
                unit: found ? found.unit : prev.unit
            }));
        }
    };

    const handleAddItem = () => {
        if (!newItem.itemName.trim()) { setError('Item name is required for Section 2 item.'); return; }
        if (!newItem.quantity || Number(newItem.quantity) <= 0) { setError('Item Quantity must be > 0.'); return; }
        if (newItem.sourceDocType === 'COMPLAINT' && !newItem.sourceReference) {
            setError('Please select a Complaint reference for the item.');
            return;
        }
        if (newItem.sourceDocType !== 'ROUTINE_WORK' && newItem.sourceDocType !== 'COMPLAINT' && !newItem.sourceReference.trim()) {
            setError(`Reference document number is required for ${newItem.sourceDocType}.`);
            return;
        }

        setError('');
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                tradeSection: newItem.tradeSection,
                itemName: newItem.itemName.trim(),
                quantity: Number(newItem.quantity),
                unit: newItem.unit,
                sourceDocType: newItem.sourceDocType,
                sourceReference: newItem.sourceDocType === 'ROUTINE_WORK' ? '' : newItem.sourceReference.trim(),
                description: newItem.description || ''
            }]
        }));

        setNewItem({
            tradeSection: newItem.tradeSection,
            selectedStockId: '',
            itemName: '',
            quantity: 1,
            unit: 'Pieces',
            sourceDocType: 'COMPLAINT',
            sourceReference: '',
            description: ''
        });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.returnedBy.trim()) {
            setError('"Return By" field is required in Header Section 1.');
            return;
        }
        if (formData.items.length === 0) {
            setError('Please add at least one item in Section 2.');
            return;
        }

        setLoading(true);

        const firstItem = formData.items[0] || {};
        const payload = {
            ...formData,
            tradeSection: firstItem.tradeSection,
            itemName: firstItem.itemName,
            quantity: firstItem.quantity,
            unit: firstItem.unit,
            sourceDocType: firstItem.sourceDocType,
            sourceReference: firstItem.sourceReference
        };

        // Try API
        try {
            if (isEdit) {
                await api.updateScrap(id, payload);
            } else {
                await api.createScrap(payload);
            }
            navigate('/scraps');
            return;
        } catch (apiErr) {
            console.warn('API call failed, using localStorage fallback:', apiErr);
        }

        // Fallback localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || { scraps: [], counters: { scrap: 0 } };
            const now = new Date().toISOString();

            if (isEdit) {
                const index = data.scraps.findIndex(s => s.srNo === id);
                if (index !== -1) {
                    data.scraps[index] = { ...data.scraps[index], ...payload, modifiedBy: 'Admin', modifiedAt: now };
                }
            } else {
                data.counters = data.counters || {};
                data.counters.scrap = (data.counters.scrap || 0) + 1;
                const srNo = `SR-${String(data.counters.scrap).padStart(3, '0')}`;
                data.scraps = data.scraps || [];
                data.scraps.push({
                    srNo,
                    ...payload,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now,
                    isActive: true
                });
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/scraps');
        } catch (localErr) {
            console.error('localStorage save error:', localErr);
            setError('Failed to save scrap return entry.');
        } finally {
            setLoading(false);
        }
    };

    const tradeStockItems = allTradeItems.filter(s => s.tradeSection === newItem.tradeSection);
    const itemSourceConfig = getSourceDocConfig(newItem.sourceDocType);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Scrap Return Entry' : 'New Scrap Return Entry'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/scraps')} className="btn btn-outline">
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                {/* ─── SECTION 1: HEADER INFORMATION ─────────────────────────── */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                        Section 1: Header Information
                    </h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date *</label>
                            <input type="date" name="date" value={formData.date}
                                onChange={handleHeaderChange} className="form-control" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Location / Site *</label>
                            <input type="text" name="location" value={formData.location}
                                onChange={handleHeaderChange} className="form-control" placeholder="e.g. Wah Terminal" required />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Return By *</label>
                            <input type="text" name="returnedBy" value={formData.returnedBy}
                                onChange={handleHeaderChange} className="form-control" placeholder="Person / Supervisor name" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Source of Shifting</label>
                            <input type="text" name="sourceOfShifting" value={formData.sourceOfShifting}
                                onChange={handleHeaderChange} className="form-control" placeholder="Manual text entry (e.g. Dismantled structure, Site transfer)" />
                        </div>
                    </div>
                </div>

                {/* ─── SECTION 2: ITEM DETAILS (PER ITEM SEPARATELY) ───────────── */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                        Section 2: Item Details (Per Item Separately)
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                        Each item can be assigned to its respective Trade Section and Complaint/Source document independently.
                    </p>

                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>
                            Add Scrap Item
                        </h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Trade Section *</label>
                                <select name="tradeSection" value={newItem.tradeSection} onChange={handleNewItemChange} className="form-control">
                                    {TRADE_SECTIONS.map(ts => (
                                        <option key={ts.value} value={ts.value}>{ts.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Item Selection</label>
                                <select value={newItem.selectedStockId} onChange={handleStockSelect} className="form-control">
                                    <option value="">— Select Existing Item —</option>
                                    {tradeStockItems.map(s => (
                                        <option key={s.itemId} value={s.itemId}>{s.itemName} ({s.unit})</option>
                                    ))}
                                    <option value="__NEW__">+ Type New Item Name</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Item Name *</label>
                                <input type="text" name="itemName" value={newItem.itemName} onChange={handleNewItemChange}
                                    className="form-control" placeholder="Item Name..." required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Quantity *</label>
                                <input type="number" name="quantity" value={newItem.quantity} onChange={handleNewItemChange}
                                    className="form-control" min="0.01" step="any" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Unit *</label>
                                <select name="unit" value={newItem.unit} onChange={handleNewItemChange} className="form-control">
                                    {UNITS.map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Source Doc Type *</label>
                                <select name="sourceDocType" value={newItem.sourceDocType} onChange={handleNewItemChange} className="form-control">
                                    {SOURCE_DOC_TYPES.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1.5 }}>
                                <label className="form-label">Source Document No. *</label>
                                {newItem.sourceDocType === 'COMPLAINT' ? (
                                    <select name="sourceReference" value={newItem.sourceReference} onChange={handleNewItemChange} className="form-control" required>
                                        <option value="">— Select Open Complaint —</option>
                                        {openComplaints.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.id} — {c.complainant} ({c.description?.slice(0, 30)}...)
                                            </option>
                                        ))}
                                    </select>
                                ) : newItem.sourceDocType === 'ROUTINE_WORK' ? (
                                    <input type="text" value="No Reference Needed" className="form-control" disabled />
                                ) : (
                                    <input type="text" name="sourceReference" value={newItem.sourceReference} onChange={handleNewItemChange}
                                        className="form-control" placeholder={`Enter ${itemSourceConfig.label} #...`} required />
                                )}
                            </div>
                        </div>

                        <div style={{ textAlign: 'right', marginTop: '12px' }}>
                            <button type="button" onClick={handleAddItem} className="btn btn-primary">
                                <FaPlus /> Add Item to Entry
                            </button>
                        </div>
                    </div>

                    {/* Table of Added Scrap Items */}
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Trade</th>
                                    <th>Item Name</th>
                                    <th>Qty & Unit</th>
                                    <th>Source Document</th>
                                    <th style={{ textAlign: 'center' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="empty-state">No scrap items added to this entry yet.</td>
                                    </tr>
                                ) : (
                                    formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td><span className="badge badge-info">{item.tradeSection}</span></td>
                                            <td><strong>{item.itemName}</strong></td>
                                            <td style={{ fontWeight: '700', color: '#d97706' }}>{item.quantity} {item.unit}</td>
                                            <td>
                                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                                    {item.sourceDocType}: {item.sourceReference || 'None'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <button type="button" onClick={() => handleRemoveItem(idx)} className="btn btn-danger btn-sm">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ─── SECTION 3: ADDITIONAL INFO ─────────────────────────────── */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                        Section 3: Additional Info
                    </h2>
                    <div className="form-group">
                        <label className="form-label">Remarks</label>
                        <textarea name="remarks" value={formData.remarks} onChange={handleHeaderChange}
                            className="form-control" rows="3" placeholder="Enter optional remarks..." />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Scrap Entry' : 'Create Scrap Return Entry')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScrapForm;