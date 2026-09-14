// src/components/IssueRegister/IssueForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_DOC_TYPES, getSourceDocConfig } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const IssueForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        issueDate: new Date().toISOString().split('T')[0],
        tradeSection: 'MASONRY',
        itemId: '',
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        description: '',
        issuedTo: '',
        issuedBy: 'Store Keeper',
        sourceDocType: 'COMPLAINT',
        sourceReference: '',
        remarks: ''
    });

    const [stockItems, setStockItems] = useState([]);
    const [openComplaints, setOpenComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Derived: config for selected source type
    const sourceConfig = getSourceDocConfig(formData.sourceDocType);

    useEffect(() => {
        loadStockItems();
        loadOpenComplaints();
        if (isEdit) loadIssue();
    }, [id]);

    const loadStockItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            setStockItems((data?.stock || []).filter(s => s.isActive !== false));
        } catch (e) {
            console.error('Error loading stock items:', e);
        }
    };

    const loadOpenComplaints = useCallback(async () => {
        // Try API
        try {
            const complaints = await api.getOpenComplaints();
            if (Array.isArray(complaints)) {
                setOpenComplaints(complaints);
                return;
            }
        } catch (_) {}

        // Fallback to localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const open = (data?.complaints || []).filter(c => c.status === 'Open');
            setOpenComplaints(open);
        } catch (e) {
            console.error('Error loading open complaints:', e);
        }
    }, []);

    const loadIssue = async () => {
        // Try API
        try {
            const issue = await api.getIssue(id);
            if (issue && issue.irNo) {
                setFormData({
                    issueDate: issue.issueDate ? new Date(issue.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    tradeSection: issue.tradeSection || 'MASONRY',
                    itemId: issue.itemId || '',
                    itemName: issue.itemName || '',
                    quantity: issue.quantity || 1,
                    unit: issue.unit || 'Pieces',
                    description: issue.description || '',
                    issuedTo: issue.issuedTo || '',
                    issuedBy: issue.issuedBy || 'Store Keeper',
                    sourceDocType: issue.sourceDocType || 'COMPLAINT',
                    sourceReference: issue.sourceReference || '',
                    remarks: issue.remarks || ''
                });
                return;
            }
        } catch (_) {}

        // Fallback to localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const issue = (data?.issues || []).find(i => i.irNo === id);
            if (issue) {
                setFormData({
                    issueDate: issue.issueDate ? new Date(issue.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    tradeSection: issue.tradeSection || 'MASONRY',
                    itemId: issue.itemId || '',
                    itemName: issue.itemName || '',
                    quantity: issue.quantity || 1,
                    unit: issue.unit || 'Pieces',
                    description: issue.description || '',
                    issuedTo: issue.issuedTo || '',
                    issuedBy: issue.issuedBy || 'Store Keeper',
                    sourceDocType: issue.sourceDocType || 'COMPLAINT',
                    sourceReference: issue.sourceReference || '',
                    remarks: issue.remarks || ''
                });
            }
        } catch (e) {
            console.error('Error loading issue:', e);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'sourceDocType') {
            // Clear reference when switching source type
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
        if (!formData.itemId && !formData.itemName) {
            return 'Please select or enter an item.';
        }
        if (!formData.quantity || Number(formData.quantity) <= 0) {
            return 'Quantity must be greater than 0.';
        }
        if (!formData.issuedTo.trim()) {
            return '"Issued To" is required.';
        }
        if (!formData.sourceDocType) {
            return 'Source Document Type is required.';
        }
        if (formData.sourceDocType === 'COMPLAINT') {
            if (!formData.sourceReference) {
                return 'Please select an Open Complaint as the source.';
            }
        } else if (formData.sourceDocType !== 'ROUTINE_WORK') {
            if (!formData.sourceReference.trim()) {
                return `A reference number is required for ${sourceConfig.label}.`;
            }
        }
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            quantity: Number(formData.quantity),
            sourceReference: formData.sourceDocType === 'ROUTINE_WORK' ? '' : formData.sourceReference.trim()
        };

        // Try API
        try {
            if (isEdit) {
                await api.updateIssue(id, payload);
            } else {
                await api.createIssue(payload);
            }
            navigate('/issues');
            return;
        } catch (apiErr) {
            console.warn('API call failed, using localStorage fallback:', apiErr);
        }

        // Fallback: localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || { issues: [], counters: { issue: 0 } };
            const now = new Date().toISOString();

            if (isEdit) {
                const index = data.issues.findIndex(i => i.irNo === id);
                if (index !== -1) {
                    data.issues[index] = { ...data.issues[index], ...payload, modifiedBy: 'Admin', modifiedAt: now };
                }
            } else {
                data.counters = data.counters || {};
                data.counters.issue = (data.counters.issue || 0) + 1;
                const irNo = `IR-${String(data.counters.issue).padStart(3, '0')}`;
                data.issues = data.issues || [];
                data.issues.push({
                    irNo,
                    ...payload,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now,
                    isActive: true
                });
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/issues');
        } catch (localErr) {
            console.error('localStorage save error:', localErr);
            setError('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Issue Entry' : 'New Issue Entry'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/issues')} className="btn btn-outline">
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
                        <label className="form-label">Issue Date *</label>
                        <input type="date" name="issueDate" value={formData.issueDate}
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
                                <option value="">Select Item from Stock</option>
                                {stockItems.map(item => (
                                    <option key={item.itemId} value={item.itemId}>
                                        {item.itemName} ({item.currentStock || 0} {item.unit} available)
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
                        <label className="form-label">Issued To *</label>
                        <input type="text" name="issuedTo" value={formData.issuedTo}
                            onChange={handleChange} className="form-control"
                            placeholder="Worker / Supervisor name" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Issued By</label>
                        <input type="text" name="issuedBy" value={formData.issuedBy}
                            onChange={handleChange} className="form-control"
                            placeholder="Store Keeper name" />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea name="description" value={formData.description}
                        onChange={handleChange} className="form-control" rows="2"
                        placeholder="Optional description..." />
                </div>

                {/* ─── Source Document Section ─────────────────────────────── */}
                <div className="items-section" style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                        Source Document <span style={{ color: '#dc2626' }}>*</span>
                    </h3>

                    {/* Type Selector */}
                    <div className="form-group">
                        <label className="form-label">Document Type</label>
                        <select
                            name="sourceDocType"
                            value={formData.sourceDocType}
                            onChange={handleChange}
                            className="form-control"
                            style={{ maxWidth: '300px' }}
                        >
                            {SOURCE_DOC_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Dynamic Reference Field */}
                    {formData.sourceDocType === 'COMPLAINT' && (
                        <div className="form-group">
                            <label className="form-label">Select Open Complaint *</label>
                            <select
                                name="sourceReference"
                                value={formData.sourceReference}
                                onChange={handleChange}
                                className="form-control"
                                required
                            >
                                <option value="">— Select a Complaint —</option>
                                {openComplaints.length === 0 ? (
                                    <option value="" disabled>No Open complaints available</option>
                                ) : (
                                    openComplaints.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.id} — {c.complainant} ({c.description?.slice(0, 50)}{c.description?.length > 50 ? '…' : ''})
                                        </option>
                                    ))
                                )}
                            </select>
                            {openComplaints.length === 0 && (
                                <p style={{ marginTop: '6px', fontSize: '0.8rem', color: '#ef4444' }}>
                                    <FaInfoCircle style={{ marginRight: '4px' }} />
                                    No Open complaints exist. Create a complaint first, or choose a different source type.
                                </p>
                            )}
                        </div>
                    )}

                    {formData.sourceDocType !== 'COMPLAINT' && formData.sourceDocType !== 'ROUTINE_WORK' && (
                        <div className="form-group">
                            <label className="form-label">{sourceConfig.label} Reference Number *</label>
                            <input
                                type="text"
                                name="sourceReference"
                                value={formData.sourceReference}
                                onChange={handleChange}
                                className="form-control"
                                placeholder={`Enter ${sourceConfig.label} reference number...`}
                                required
                                style={{ maxWidth: '400px' }}
                            />
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
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Issue' : 'Create Issue')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default IssueForm;