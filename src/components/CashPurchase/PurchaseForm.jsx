// src/components/CashPurchase/PurchaseForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes, FaInfoCircle, FaBoxes } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_DOC_TYPES, EXPENSE_HEADS, getSourceDocConfig } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const PurchaseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        purchaseDate: new Date().toISOString().split('T')[0],
        tradeSection: 'MASONRY',
        billInvoiceNo: '',
        items: [],
        purchasedBy: '',
        jobNo: '',
        expenseHead: 'Maintenance Materials',
        isStoreStockItem: false,
        sourceDocType: 'COMPLAINT',
        sourceReference: '',
        remarks: ''
    });

    const [newItem, setNewItem] = useState({
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        unitPrice: 0,
        description: ''
    });

    const [openComplaints, setOpenComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const sourceConfig = getSourceDocConfig(formData.sourceDocType);

    useEffect(() => {
        loadOpenComplaints();
        if (isEdit) loadPurchase();
    }, [id]);

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

    const loadPurchase = async () => {
        try {
            const purchase = await api.getPurchase(id);
            if (purchase && purchase.cpNo) { applyPurchase(purchase); return; }
        } catch (_) {}

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const purchase = (data?.purchases || []).find(p => p.cpNo === id);
            if (purchase) applyPurchase(purchase);
        } catch (e) { console.error(e); }
    };

    const applyPurchase = (p) => {
        setFormData({
            purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            tradeSection: p.tradeSection || 'MASONRY',
            billInvoiceNo: p.billInvoiceNo || '',
            items: p.items || [],
            purchasedBy: p.purchasedBy || '',
            jobNo: p.jobNo || '',
            expenseHead: p.expenseHead || 'Maintenance Materials',
            isStoreStockItem: !!p.isStoreStockItem,
            sourceDocType: p.sourceDocType || 'COMPLAINT',
            sourceReference: p.sourceReference || '',
            remarks: p.remarks || ''
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name === 'sourceDocType') {
            setFormData(prev => ({ ...prev, sourceDocType: value, sourceReference: '' }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleAddItem = () => {
        if (!newItem.itemName.trim()) { setError('Item name is required.'); return; }
        if (!newItem.quantity || Number(newItem.quantity) <= 0) { setError('Quantity must be > 0.'); return; }
        setError('');
        const total = Number(newItem.quantity) * Number(newItem.unitPrice);
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { ...newItem, quantity: Number(newItem.quantity), unitPrice: Number(newItem.unitPrice), total }]
        }));
        setNewItem({ itemName: '', quantity: 1, unit: 'Pieces', unitPrice: 0, description: '' });
    };

    const handleRemoveItem = (index) => {
        setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
    };

    const totalAmount = formData.items.reduce((sum, i) => sum + (i.total || 0), 0);

    const validate = () => {
        if (formData.items.length === 0) return 'At least one item is required.';
        if (!formData.purchasedBy.trim()) return '"Purchased By" is required.';
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
            totalAmount,
            sourceReference: formData.sourceDocType === 'ROUTINE_WORK' ? '' : formData.sourceReference.trim()
        };

        // Try API
        try {
            if (isEdit) { await api.updatePurchase(id, payload); }
            else { await api.createPurchase(payload); }
            navigate('/purchases');
            return;
        } catch (apiErr) { console.warn('API fallback:', apiErr); }

        // localStorage fallback
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || { purchases: [], counters: { purchase: 0 } };
            const now = new Date().toISOString();
            if (isEdit) {
                const idx = data.purchases.findIndex(p => p.cpNo === id);
                if (idx !== -1) data.purchases[idx] = { ...data.purchases[idx], ...payload, modifiedBy: 'Admin', modifiedAt: now };
            } else {
                data.counters = data.counters || {};
                data.counters.purchase = (data.counters.purchase || 0) + 1;
                const cpNo = `CP-${String(data.counters.purchase).padStart(3, '0')}`;
                data.purchases = data.purchases || [];
                data.purchases.push({ cpNo, ...payload, createdBy: 'Admin', createdAt: now, modifiedBy: 'Admin', modifiedAt: now, isActive: true });
            }
            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/purchases');
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
                <h1 className="page-title">{isEdit ? 'Edit Cash Purchase' : 'New Cash Purchase'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/purchases')} className="btn btn-outline"><FaTimes /> Cancel</button>
                </div>
            </div>

            {error && (
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '6px', color: '#dc2626' }}>
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="card">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Purchase Date *</label>
                        <input type="date" name="purchaseDate" value={formData.purchaseDate}
                            onChange={handleChange} className="form-control" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Trade Section *</label>
                        <select name="tradeSection" value={formData.tradeSection}
                            onChange={handleChange} className="form-control" required>
                            {TRADE_SECTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Bill / Invoice No.</label>
                        <input type="text" name="billInvoiceNo" value={formData.billInvoiceNo}
                            onChange={handleChange} className="form-control" placeholder="Optional" />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Purchased By *</label>
                        <input type="text" name="purchasedBy" value={formData.purchasedBy}
                            onChange={handleChange} className="form-control" placeholder="Name / designation" required />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Expense Head</label>
                        <select name="expenseHead" value={formData.expenseHead}
                            onChange={handleChange} className="form-control">
                            {EXPENSE_HEADS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Job No.</label>
                        <input type="text" name="jobNo" value={formData.jobNo}
                            onChange={handleChange} className="form-control" placeholder="Optional" />
                    </div>
                </div>

                {/* Store Stock Item Flag */}
                <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: '600', color: '#166534' }}>
                        <input
                            type="checkbox"
                            name="isStoreStockItem"
                            checked={formData.isStoreStockItem}
                            onChange={handleChange}
                            style={{ width: '18px', height: '18px', accentColor: '#16a34a' }}
                        />
                        <FaBoxes />
                        Mark as Store Stock Item
                    </label>
                    <p style={{ margin: '6px 0 0 28px', fontSize: '0.8rem', color: '#15803d' }}>
                        When checked, this purchase feeds into the Stock Register automatically.
                    </p>
                </div>

                {/* Items Section */}
                <div className="items-section">
                    <h3>Items Purchased</h3>
                    <div className="items-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '8px', alignItems: 'end', marginBottom: '8px' }}>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Item Name</label>
                            <input type="text" placeholder="Item name" value={newItem.itemName}
                                onChange={e => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
                                className="form-control" />
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Qty</label>
                            <input type="number" min="1" value={newItem.quantity}
                                onChange={e => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                className="form-control" />
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit</label>
                            <select value={newItem.unit}
                                onChange={e => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                                className="form-control">
                                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem' }}>Unit Price (PKR)</label>
                            <input type="number" min="0" step="0.01" value={newItem.unitPrice}
                                onChange={e => setNewItem(prev => ({ ...prev, unitPrice: Number(e.target.value) }))}
                                className="form-control" />
                        </div>
                        <button type="button" className="btn btn-primary" onClick={handleAddItem} style={{ marginBottom: 0 }}>
                            <FaPlus /> Add
                        </button>
                    </div>

                    {formData.items.length > 0 && (
                        <div className="items-list">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Qty</th>
                                        <th>Unit</th>
                                        <th>Unit Price</th>
                                        <th>Total</th>
                                        <th></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{item.itemName}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unit}</td>
                                            <td>PKR {item.unitPrice?.toLocaleString()}</td>
                                            <td><strong>PKR {item.total?.toLocaleString()}</strong></td>
                                            <td>
                                                <button type="button" className="btn btn-danger btn-sm"
                                                    onClick={() => handleRemoveItem(idx)}>
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan="4" style={{ textAlign: 'right', fontWeight: '600' }}>Total Amount:</td>
                                        <td colSpan="2" style={{ fontWeight: '700', fontSize: '1rem' }}>
                                            PKR {totalAmount.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
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
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Purchase' : 'Create Purchase')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseForm;