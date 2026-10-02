// src/components/IssueRegister/IssueForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_DOC_TYPES, STATIONS, getSourceDocConfig } from '../../data/preDefinedLists';
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
        issuedQuantity: 1,
        unit: 'Pieces',
        returnQuantity: 0,
        returnUnit: 'Pieces',
        vehicleNo: '',
        description: '',
        issuedTo: '',
        issuedBy: 'Store Keeper',
        station: STATIONS[0] || 'Wah Terminal',
        location: '',
        sourceDocType: 'COMPLAINT',
        sourceReference: '',
        remarks: ''
    });

    const [allStockItems, setAllStockItems] = useState([]);
    const [openComplaints, setOpenComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sourceConfig = getSourceDocConfig(formData.sourceDocType);

    useEffect(() => {
        loadStockItems();
        loadOpenComplaints();
        if (isEdit) loadIssue();
    }, [id]);

    const loadStockItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = (data.issues || []).filter(i => i.isActive !== false);
            const purchases = (data.purchases || []).filter(p => p.isActive !== false);
            const manualStocks = (data.manualStocks || []);

            const itemMap = {};

            // 1. Inflows from Cash Purchases
            purchases.forEach(p => {
                const trade = p.tradeSection || 'MASONRY';
                (p.items || []).forEach(item => {
                    const isStoreStock = item.isStoreStockItem !== undefined ? item.isStoreStockItem : p.isStoreStockItem;
                    if (isStoreStock) {
                        const name = (item.itemName || '').trim();
                        if (!name) return;
                        const key = `${trade}_${name.toLowerCase()}`;
                        if (!itemMap[key]) {
                            itemMap[key] = {
                                itemId: key,
                                itemName: name,
                                tradeSection: trade,
                                unit: item.unit || 'Pieces',
                                currentStock: 0
                            };
                        }
                        itemMap[key].currentStock += Number(item.quantity) || 0;
                    }
                });
            });

            // 2. Manual stock entries
            manualStocks.forEach(m => {
                const trade = m.tradeSection || 'MASONRY';
                const name = (m.itemName || '').trim();
                if (!name) return;
                const key = `${trade}_${name.toLowerCase()}`;
                if (!itemMap[key]) {
                    itemMap[key] = {
                        itemId: key,
                        itemName: name,
                        tradeSection: trade,
                        unit: m.unit || 'Pieces',
                        currentStock: 0
                    };
                }
                itemMap[key].currentStock += Number(m.quantity) || 0;
            });

            // 3. Issues & Returns
            issues.forEach(iss => {
                const trade = iss.tradeSection || 'MASONRY';
                const name = (iss.itemName || '').trim();
                if (!name) return;
                const key = `${trade}_${name.toLowerCase()}`;
                if (!itemMap[key]) {
                    itemMap[key] = {
                        itemId: key,
                        itemName: name,
                        tradeSection: trade,
                        unit: iss.unit || 'Pieces',
                        currentStock: 0
                    };
                }
                const issuedQty = Number(iss.issuedQuantity !== undefined ? iss.issuedQuantity : (iss.isSiteReturn ? 0 : iss.quantity)) || 0;
                const returnQty = Number(iss.returnQuantity !== undefined ? iss.returnQuantity : (iss.isSiteReturn ? iss.quantity : 0)) || 0;
                itemMap[key].currentStock += (returnQty - issuedQty);
            });

            setAllStockItems(Object.values(itemMap));
        } catch (e) {
            console.error('Error loading stock items:', e);
        }
    };

    const loadOpenComplaints = useCallback(async () => {
        try {
            const complaints = await api.getOpenComplaints();
            if (Array.isArray(complaints)) {
                setOpenComplaints(complaints);
                return;
            }
        } catch (_) {}

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const open = (data?.complaints || []).filter(c => c.status === 'Open');
            setOpenComplaints(open);
        } catch (e) {
            console.error('Error loading open complaints:', e);
        }
    }, []);

    const loadIssue = async () => {
        let issue = null;
        try {
            issue = await api.getIssue(id);
        } catch (_) {}

        if (!issue || !issue.irNo) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                issue = (data?.issues || []).find(i => i.irNo === id);
            } catch (e) {
                console.error('Error loading issue:', e);
            }
        }

        if (issue) {
            setFormData({
                issueDate: issue.issueDate ? new Date(issue.issueDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                tradeSection: issue.tradeSection || 'MASONRY',
                itemId: issue.itemId || '',
                itemName: issue.itemName || '',
                issuedQuantity: issue.issuedQuantity !== undefined ? issue.issuedQuantity : (issue.isSiteReturn ? 0 : issue.quantity || 0),
                unit: issue.unit || 'Pieces',
                returnQuantity: issue.returnQuantity !== undefined ? issue.returnQuantity : (issue.isSiteReturn ? issue.quantity || 0 : 0),
                returnUnit: issue.returnUnit || issue.unit || 'Pieces',
                vehicleNo: issue.vehicleNo || '',
                description: issue.description || '',
                issuedTo: issue.issuedTo || '',
                issuedBy: issue.issuedBy || 'Store Keeper',
                station: issue.station || STATIONS[0],
                location: issue.location || '',
                sourceDocType: issue.sourceDocType || 'COMPLAINT',
                sourceReference: issue.sourceReference || '',
                remarks: issue.remarks || ''
            });
        }
    };

    const availableItems = allStockItems.filter(item =>
        item.tradeSection === formData.tradeSection &&
        (item.currentStock > 0 || item.itemId === formData.itemId)
    );

    const selectedStockItem = allStockItems.find(s => s.itemId === formData.itemId || (s.itemName.toLowerCase() === formData.itemName.toLowerCase() && s.tradeSection === formData.tradeSection));

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === 'tradeSection') {
            setFormData(prev => ({
                ...prev,
                tradeSection: value,
                itemId: '',
                itemName: '',
                unit: 'Pieces',
                returnUnit: 'Pieces'
            }));
            return;
        }

        if (name === 'sourceDocType') {
            setFormData(prev => ({ ...prev, sourceDocType: value, sourceReference: '' }));
            return;
        }

        if (name === 'itemId') {
            const item = availableItems.find(s => s.itemId === value);
            setFormData(prev => ({
                ...prev,
                itemId: value,
                itemName: item ? item.itemName : '',
                unit: item ? item.unit : prev.unit,
                returnUnit: item ? item.unit : prev.returnUnit
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.itemId && !formData.itemName) {
            return 'Please select an item.';
        }
        const issQty = Number(formData.issuedQuantity) || 0;
        const retQty = Number(formData.returnQuantity) || 0;
        if (issQty <= 0 && retQty <= 0) {
            return 'Either Issued Quantity or Return Quantity must be greater than 0.';
        }
        if (!formData.issuedTo.trim()) {
            return '"Issued To / Worker Name" is required.';
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

        const issQty = Number(formData.issuedQuantity) || 0;
        const retQty = Number(formData.returnQuantity) || 0;

        const payload = {
            ...formData,
            quantity: issQty,
            issuedQuantity: issQty,
            returnQuantity: retQty,
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
                {/* Basic Header Fields */}
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
                    <div className="form-group">
                        <label className="form-label">Vehicle No. (Issued/Returned via)</label>
                        <input
                            type="text"
                            name="vehicleNo"
                            value={formData.vehicleNo}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="e.g. LES-1234 or PickUp 02"
                        />
                    </div>
                </div>

                {/* Item & Quantities Section */}
                <div className="items-section" style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                        Item & Stock Quantities
                    </h3>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 2 }}>
                            <label className="form-label">
                                Item Name *
                            </label>
                            <select name="itemId" value={formData.itemId}
                                onChange={handleChange} className="form-control" required>
                                <option value="">— Select Trade Item —</option>
                                {availableItems.map(item => (
                                    <option key={item.itemId} value={item.itemId}>
                                        {item.itemName} (Stock: {item.currentStock} {item.unit})
                                    </option>
                                ))}
                            </select>
                            {selectedStockItem && (
                                <p style={{ marginTop: '6px', fontSize: '0.8rem', color: selectedStockItem.currentStock > 0 ? '#166534' : '#dc2626', fontWeight: '500' }}>
                                    Current Store Balance: <strong>{selectedStockItem.currentStock} {selectedStockItem.unit}</strong>
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="form-row" style={{ marginTop: '12px' }}>
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#dc2626', fontWeight: '600' }}>
                                Issued Quantity (Decreases Stock)
                            </label>
                            <input type="number" name="issuedQuantity" value={formData.issuedQuantity}
                                onChange={handleChange} className="form-control" min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Issued Unit</label>
                            <input
                                type="text"
                                name="unit"
                                value={formData.unit}
                                className="form-control"
                                disabled={true}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label" style={{ color: '#059669', fontWeight: '600' }}>
                                Return Quantity (Increases Stock)
                            </label>
                            <input type="number" name="returnQuantity" value={formData.returnQuantity}
                                onChange={handleChange} className="form-control" min="0" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Return Unit</label>
                            <select name="returnUnit" value={formData.returnUnit} onChange={handleChange} className="form-control">
                                {UNITS.map(u => (
                                    <option key={u} value={u}>{u}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Station *</label>
                        <select
                            name="station"
                            value={formData.station}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            {STATIONS.map(st => (
                                <option key={st} value={st}>{st}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Location *</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="e.g. Block C, Compressor Room"
                            required
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Issued To / Handed To *</label>
                        <input type="text" name="issuedTo" value={formData.issuedTo}
                            onChange={handleChange} className="form-control"
                            placeholder="Worker / Person name" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Store Keeper / In-Charge</label>
                        <input type="text" name="issuedBy" value={formData.issuedBy}
                            onChange={handleChange} className="form-control"
                            placeholder="Store Keeper name" />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea name="description" value={formData.description}
                        onChange={handleChange} className="form-control" rows="2"
                        placeholder="Optional details about work..." />
                </div>

                {/* Source Document Section */}
                <div className="items-section" style={{ background: '#f8fafc', borderRadius: '8px', padding: '16px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '12px', color: '#1e293b' }}>
                        Source Document <span style={{ color: '#dc2626' }}>*</span>
                    </h3>

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
                        placeholder="Optional remarks..." />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Issue' : 'Create Issue Entry')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default IssueForm;