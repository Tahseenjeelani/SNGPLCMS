// src/components/ScrapReturn/ScrapForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_DOC_TYPES, getSourceDocConfig } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const ScrapForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        tradeSection: 'MASONRY',
        itemId: '',
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        description: '',
        returnedBy: '',
        receivedBy: 'Store Keeper',
        sourceDocType: 'COMPLAINT',
        sourceReference: '',
        remarks: ''
    });

    const [stockItems, setStockItems] = useState([]);
    const [openComplaints, setOpenComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sourceConfig = getSourceDocConfig(formData.sourceDocType);

    useEffect(() => {
        loadStockItems();
        loadOpenComplaints();
        if (isEdit) loadScrap();
    }, [id]);

    const loadStockItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            setStockItems((data?.stock || []).filter(s => s.isActive !== false));
        } catch (e) { console.error(e); }
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
        try {
            const scrap = await api.getScrap(id);
            if (scrap && scrap.srNo) { applyScrap(scrap); return; }
        } catch (_) {}
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const scrap = (data?.scraps || []).find(s => s.srNo === id);
            if (scrap) applyScrap(scrap);
        } catch (e) { console.error(e); }
    };

    const applyScrap = (s) => {
        setFormData({
            date: s.date ? new Date(s.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            tradeSection: s.tradeSection || 'MASONRY',
            itemId: s.itemId || '',
            itemName: s.itemName || '',
            quantity: s.quantity || 1,
            unit: s.unit || 'Pieces',
            description: s.description || '',
            returnedBy: s.returnedBy || '',
            receivedBy: s.receivedBy || 'Store Keeper',
            sourceDocType: s.sourceDocType || 'COMPLAINT',
            sourceReference: s.sourceReference || '',
            remarks: s.remarks || ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'sourceDocType') {
            setFormData(prev => ({ ...prev, sourceDocType: value, sourceReference: '' }));
            return;
        }

        if (name === 'itemId') {
            const item = stockItems.find(s => s.itemId === value);
            setFormData(prev => ({
                ...prev,
                itemId: value,
                itemName: item ? item.itemName : '',
                unit: item ? item.unit : prev.unit
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.itemName.trim() && !formData.itemId) return 'Item is required.';
        if (!formData.quantity || Number(formData.quantity) <= 0) return 'Quantity must be greater than 0.';
        if (!formData.returnedBy.trim()) return '"Returned By" is required.';
        if (!formData.sourceDocType) return 'Source Document Type is required.';
        if (formData.sourceDocType === 'COMPLAINT' && !formData.sourceReference)
            return 'Please select an Open Complaint as the source.';
        if (formData.sourceDocType !== 'COMPLAINT' && formData.sourceDocType !== 'ROUTINE_WORK' && !formData.sourceReference.trim())
            return `A reference number is required for ${sourceConfig.label}.`;
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setLoading(true);
        const payload = {
            ...formData,
            quantity: Number(formData.quantity),
            sourceReference: formData.sourceDocType === 'ROUTINE_WORK' ? '' : formData.sourceReference.trim()
        };

        // Try API
        try {
            if (isEdit) { await api.updateScrap(id, payload); }
            else { await api.createScrap(payload); }
            navigate('/scraps');
            return;
        } catch (apiErr) { console.warn('API fallback:', apiErr); }

        // localStorage fallback
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || { scraps: [], counters: { scrap: 0 } };
            const now = new Date().toISOString();
            if (isEdit) {
                const idx = data.scraps.findIndex(s => s.srNo === id);
                if (idx !== -1) data.scraps[idx] = { ...data.scraps[idx], ...payload, modifiedBy: 'Admin', modifiedAt: now };
            } else {
                data.counters = data.counters || {};
                data.counters.scrap = (data.counters.scrap || 0) + 1;
                const srNo = `SR-${String(data.counters.scrap).padStart(3, '0')}`;
                data.scraps = data.scraps || [];
                data.scraps.push({ srNo, ...payload, createdBy: 'Admin', createdAt: now, modifiedBy: 'Admin', modifiedAt: now, isActive: true });
            }
            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/scraps');
        } catch (localErr) {
            console.error(localErr);
            setError('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Scrap Return' : 'New Scrap Return'}</h1>
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

            <form onSubmit={handleSubmit} className="card">
                {/* Basic Fields */}
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Return Date *</label>
                        <input type="date" name="date" value={formData.date}
                            onChange={handleChange} className="form-control" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Trade Section *</label>
                        <select name="tradeSection" value={formData.tradeSection}
                            onChange={handleChange} className="form-control" required>
                            {TRADE_SECTIONS.map(s => (
                                <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Item *</label>
                        {stockItems.length > 0 ? (
                            <select name="itemId" value={formData.itemId}
                                onChange={handleChange} className="form-control" required>
                                <option value="">Select Item</option>
                                {stockItems.map(item => (
                                    <option key={item.itemId} value={item.itemId}>
                                        {item.itemName}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input type="text" name="itemName" value={formData.itemName}
                                onChange={e => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
                                className="form-control" placeholder="Enter item name" required />
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Quantity *</label>
                        <input type="number" name="quantity" value={formData.quantity}
                            onChange={handleChange} className="form-control" min="1" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Unit</label>
                        <select name="unit" value={formData.unit}
                            onChange={handleChange} className="form-control"
                            disabled={!!formData.itemId && stockItems.some(s => s.itemId === formData.itemId)}>
                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Returned By *</label>
                        <input type="text" name="returnedBy" value={formData.returnedBy}
                            onChange={handleChange} className="form-control"
                            placeholder="Worker / Supervisor name" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Received By</label>
                        <input type="text" name="receivedBy" value={formData.receivedBy}
                            onChange={handleChange} className="form-control"
                            placeholder="Store Keeper name" />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea name="description" value={formData.description}
                        onChange={handleChange} className="form-control" rows="2"
                        placeholder="Optional description of returned item condition..." />
                </div>

                {/* ─── Source Document Section ─────────────────────────────── */}
                <div className="items-section" style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                        Source Document <span style={{ color: '#dc2626' }}>*</span>
                    </h3>

                    <div className="form-group">
                        <label className="form-label">Document Type</label>
                        <select name="sourceDocType" value={formData.sourceDocType}
                            onChange={handleChange} className="form-control" style={{ maxWidth: '300px' }}>
                            {SOURCE_DOC_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {formData.sourceDocType === 'COMPLAINT' && (
                        <div className="form-group">
                            <label className="form-label">Select Open Complaint *</label>
                            <select name="sourceReference" value={formData.sourceReference}
                                onChange={handleChange} className="form-control" required>
                                <option value="">— Select a Complaint —</option>
                                {openComplaints.length === 0
                                    ? <option value="" disabled>No Open complaints available</option>
                                    : openComplaints.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.id} — {c.complainant} ({c.description?.slice(0, 50)}{c.description?.length > 50 ? '…' : ''})
                                        </option>
                                    ))
                                }
                            </select>
                            {openComplaints.length === 0 && (
                                <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#ef4444' }}>
                                    <FaInfoCircle style={{ marginRight: '4px' }} />
                                    No Open complaints. Create a complaint first, or choose a different source type.
                                </p>
                            )}
                        </div>
                    )}

                    {formData.sourceDocType !== 'COMPLAINT' && formData.sourceDocType !== 'ROUTINE_WORK' && (
                        <div className="form-group">
                            <label className="form-label">{sourceConfig.label} Reference Number *</label>
                            <input type="text" name="sourceReference" value={formData.sourceReference}
                                onChange={handleChange} className="form-control"
                                placeholder={`Enter ${sourceConfig.label} reference number...`}
                                required style={{ maxWidth: '400px' }} />
                        </div>
                    )}

                    {formData.sourceDocType === 'ROUTINE_WORK' && (
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FaInfoCircle />
                            Routine Work does not require a reference document.
                        </p>
                    )}
                </div>

                <div className="form-group">
                    <label className="form-label">Remarks</label>
                    <textarea name="remarks" value={formData.remarks}
                        onChange={handleChange} className="form-control" rows="2"
                        placeholder="Optional notes..." />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Scrap Return' : 'Create Scrap Return')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ScrapForm;