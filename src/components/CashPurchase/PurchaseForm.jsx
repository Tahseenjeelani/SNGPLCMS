// src/components/CashPurchase/PurchaseForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaPlus, FaTrash, FaSave, FaTimes, FaBoxes, FaInfoCircle } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS, SOURCE_DOC_TYPES, EXPENSE_HEADS, getSourceDocConfig } from '../../data/preDefinedLists';
import { api } from '../../services/api';

const PurchaseForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        purchaseDate: new Date().toISOString().split('T')[0],
        registerDate: new Date().toISOString().split('T')[0],
        pageNo: '',
        srNo: '',
        billInvoiceNo: '',
        purchasedBy: '',
        employeeSnNo: '',
        jobNo: '',
        expenseHead: EXPENSE_HEADS[0] || '561',
        items: [],
        remarks: ''
    });

    const [newItem, setNewItem] = useState({
        tradeSection: 'MASONRY',
        selectedStockId: '',
        itemName: '',
        quantity: 1,
        unit: 'Pieces',
        unitPrice: 0,
        location: '',
        isStoreStockItem: true,
        sourceDocType: 'COMPLAINT',
        sourceReference: '',
        description: ''
    });

    const [allStockItems, setAllStockItems] = useState([]);
    const [openComplaints, setOpenComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadStockItems();
        loadOpenComplaints();
        if (isEdit) loadPurchase();
    }, [id]);

    const loadStockItems = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || {};
            const issues = (data.issues || []).filter(i => i.isActive !== false);
            const purchases = (data.purchases || []).filter(p => p.isActive !== false);
            const manualStocks = (data.manualStocks || []);

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

            manualStocks.forEach(m => {
                const trade = m.tradeSection || 'MASONRY';
                const name = (m.itemName || '').trim();
                if (!name) return;
                const key = `${trade}_${name.toLowerCase()}`;
                if (!itemMap[key]) {
                    itemMap[key] = { itemId: key, itemName: name, tradeSection: trade, unit: m.unit || 'Pieces' };
                }
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

            setAllStockItems(Object.values(itemMap));
        } catch (e) {
            console.error('Error loading stock items:', e);
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

    const loadPurchase = async () => {
        let purchase = null;
        try {
            purchase = await api.getPurchase(id);
        } catch (_) {}

        if (!purchase || !purchase.cpNo) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                purchase = (data?.purchases || []).find(p => p.cpNo === id);
            } catch (e) { console.error(e); }
        }

        if (purchase) {
            setFormData({
                purchaseDate: purchase.purchaseDate ? new Date(purchase.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                registerDate: purchase.registerDate ? new Date(purchase.registerDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                pageNo: purchase.pageNo || '',
                srNo: purchase.srNo || '',
                billInvoiceNo: purchase.billInvoiceNo || '',
                purchasedBy: purchase.purchasedBy || '',
                employeeSnNo: purchase.employeeSnNo || '',
                jobNo: purchase.jobNo || '',
                expenseHead: purchase.expenseHead || EXPENSE_HEADS[0] || '561',
                items: (purchase.items || []).map(item => ({
                    tradeSection: item.tradeSection || purchase.tradeSection || 'MASONRY',
                    itemName: item.itemName || '',
                    quantity: Number(item.quantity) || 1,
                    unit: item.unit || 'Pieces',
                    unitPrice: Number(item.unitPrice) || 0,
                    total: item.total || (Number(item.quantity) * Number(item.unitPrice)),
                    location: item.location || '',
                    isStoreStockItem: item.isStoreStockItem !== undefined ? item.isStoreStockItem : (purchase.isStoreStockItem || false),
                    sourceDocType: item.sourceDocType || purchase.sourceDocType || 'COMPLAINT',
                    sourceReference: item.sourceReference || purchase.sourceReference || '',
                    description: item.description || ''
                })),
                remarks: purchase.remarks || ''
            });
        }
    };

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleNewItemChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;

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

        setNewItem(prev => ({ ...prev, [name]: val }));
    };

    const handleStockSelect = (e) => {
        const val = e.target.value;
        if (val === '__NEW__') {
            setNewItem(prev => ({
                ...prev,
                selectedStockId: '__NEW__',
                itemName: ''
            }));
        } else {
            const found = allStockItems.find(s => s.itemId === val);
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
        const qty = Number(newItem.quantity) || 0;
        const price = Number(newItem.unitPrice) || 0;
        const total = qty * price;

        setFormData(prev => ({
            ...prev,
            items: [...prev.items, {
                tradeSection: newItem.tradeSection,
                itemName: newItem.itemName.trim(),
                quantity: qty,
                unit: newItem.unit,
                unitPrice: price,
                total,
                location: newItem.location.trim(),
                isStoreStockItem: newItem.isStoreStockItem,
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
            unitPrice: 0,
            location: '',
            isStoreStockItem: true,
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

        if (!formData.purchasedBy.trim()) {
            setError('"Purchased By" field is required in Header Section 1.');
            return;
        }
        if (formData.items.length === 0) {
            setError('Please add at least one item in Section 2.');
            return;
        }

        setLoading(true);

        const totalAmount = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);

        const payload = {
            ...formData,
            totalAmount
        };

        // Try API
        try {
            if (isEdit) {
                await api.updatePurchase(id, payload);
            } else {
                await api.createPurchase(payload);
            }
            navigate('/purchases');
            return;
        } catch (apiErr) {
            console.warn('API call failed, using localStorage fallback:', apiErr);
        }

        // Fallback localStorage
        try {
            const data = JSON.parse(localStorage.getItem('snglData')) || { purchases: [], counters: { purchase: 0 } };
            const now = new Date().toISOString();

            if (isEdit) {
                const index = data.purchases.findIndex(p => p.cpNo === id);
                if (index !== -1) {
                    data.purchases[index] = { ...data.purchases[index], ...payload, modifiedBy: 'Admin', modifiedAt: now };
                }
            } else {
                data.counters = data.counters || {};
                data.counters.purchase = (data.counters.purchase || 0) + 1;
                const cpNo = `CP-${String(data.counters.purchase).padStart(3, '0')}`;
                data.purchases = data.purchases || [];
                data.purchases.push({
                    cpNo,
                    ...payload,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now,
                    isActive: true
                });
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/purchases');
        } catch (localErr) {
            console.error('localStorage save error:', localErr);
            setError('Failed to save cash purchase.');
        } finally {
            setLoading(false);
        }
    };

    const tradeStockItems = allStockItems.filter(s => s.tradeSection === newItem.tradeSection);
    const itemSourceConfig = getSourceDocConfig(newItem.sourceDocType);

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Cash Purchase Entry' : 'New Cash Purchase Entry'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/purchases')} className="btn btn-outline">
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
                            <label className="form-label">Purchase Date *</label>
                            <input type="date" name="purchaseDate" value={formData.purchaseDate}
                                onChange={handleHeaderChange} className="form-control" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Register Date *</label>
                            <input type="date" name="registerDate" value={formData.registerDate}
                                onChange={handleHeaderChange} className="form-control" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Page No.</label>
                            <input type="text" name="pageNo" value={formData.pageNo}
                                onChange={handleHeaderChange} className="form-control" placeholder="e.g. PG-42" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Sr. No.</label>
                            <input type="text" name="srNo" value={formData.srNo}
                                onChange={handleHeaderChange} className="form-control" placeholder="e.g. SR-15" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Bill / Invoice No.</label>
                            <input type="text" name="billInvoiceNo" value={formData.billInvoiceNo}
                                onChange={handleHeaderChange} className="form-control" placeholder="Vendor Bill/Invoice #" />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Purchased By *</label>
                            <input type="text" name="purchasedBy" value={formData.purchasedBy}
                                onChange={handleHeaderChange} className="form-control" placeholder="Buyer Name / Officer" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Employee / SN No.</label>
                            <input type="text" name="employeeSnNo" value={formData.employeeSnNo}
                                onChange={handleHeaderChange} className="form-control" placeholder="e.g. SN-8842" />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Job No.</label>
                            <input type="text" name="jobNo" value={formData.jobNo}
                                onChange={handleHeaderChange} className="form-control" placeholder="Job number if applicable..." />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Expense Head *</label>
                            <select name="expenseHead" value={formData.expenseHead}
                                onChange={handleHeaderChange} className="form-control" required>
                                {EXPENSE_HEADS.map(eh => (
                                    <option key={eh} value={eh}>{eh}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* ─── SECTION 2: ITEM DETAILS (PER ITEM SEPARATELY) ───────────── */}
                <div className="card" style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '8px', color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
                        Section 2: Item Details (Per Item Separately)
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '16px' }}>
                        Each item can be assigned to its respective Trade, Location, and Complaint/Source document independently.
                    </p>

                    {/* Add Item Form Component */}
                    <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '20px' }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#0f172a', fontWeight: '600' }}>
                            Add Item Entry
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
                                <label className="form-label">Unit Price (PKR) *</label>
                                <input type="number" name="unitPrice" value={newItem.unitPrice} onChange={handleNewItemChange}
                                    className="form-control" min="0" step="any" required />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Total Price</label>
                                <input type="text" value={`PKR ${(Number(newItem.quantity) * Number(newItem.unitPrice)).toLocaleString()}`}
                                    className="form-control" disabled style={{ fontWeight: '700', color: '#059669' }} />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Location / Site</label>
                                <input type="text" name="location" value={newItem.location} onChange={handleNewItemChange}
                                    className="form-control" placeholder="e.g. Wah Terminal Block B" />
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: newItem.isStoreStockItem ? '#059669' : '#475569' }}>
                                <input type="checkbox" name="isStoreStockItem" checked={newItem.isStoreStockItem} onChange={handleNewItemChange}
                                    style={{ width: '18px', height: '18px', accentColor: '#059669' }} />
                                Add to Store Stock Register?
                            </label>

                            <button type="button" onClick={handleAddItem} className="btn btn-primary">
                                <FaPlus /> Add Item to Entry
                            </button>
                        </div>
                    </div>

                    {/* Table of Added Items */}
                    <div className="table-responsive">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Trade</th>
                                    <th>Item Name</th>
                                    <th>Qty & Unit</th>
                                    <th>Unit Price</th>
                                    <th>Total Amount</th>
                                    <th>Location</th>
                                    <th>Source Doc</th>
                                    <th>Stock?</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {formData.items.length === 0 ? (
                                    <tr>
                                        <td colSpan="10" className="empty-state">No items added to this purchase yet.</td>
                                    </tr>
                                ) : (
                                    formData.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td>{idx + 1}</td>
                                            <td><span className="badge badge-info">{item.tradeSection}</span></td>
                                            <td><strong>{item.itemName}</strong></td>
                                            <td>{item.quantity} {item.unit}</td>
                                            <td>PKR {item.unitPrice}</td>
                                            <td style={{ fontWeight: '700', color: '#059669' }}>PKR {(item.total || 0).toLocaleString()}</td>
                                            <td>{item.location || '—'}</td>
                                            <td>
                                                <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                                                    {item.sourceDocType}: {item.sourceReference || 'None'}
                                                </span>
                                            </td>
                                            <td>
                                                {item.isStoreStockItem ? (
                                                    <span className="badge badge-success"><FaBoxes /> Yes</span>
                                                ) : (
                                                    <span className="badge badge-secondary">Direct Expense</span>
                                                )}
                                            </td>
                                            <td>
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
                            className="form-control" rows="3" placeholder="Enter optional remarks or additional info..." />
                    </div>
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        <FaSave /> {loading ? 'Saving...' : (isEdit ? 'Update Cash Purchase' : 'Create Cash Purchase Entry')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseForm;