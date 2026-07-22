// src/components/StockRegister/StockForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaSave, FaTimes } from 'react-icons/fa';
import { TRADE_SECTIONS, UNITS } from '../../data/preDefinedLists';

const StockForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = !!id;

    const [formData, setFormData] = useState({
        itemName: '',
        tradeSection: 'MASONRY',
        category: '',
        unit: 'Pieces',
        currentStock: 0,
        minimumStock: 10,
        maximumStock: 100,
        openingStock: 0,
        unitPrice: 0,
        location: '',
        isActive: true
    });

    useEffect(() => {
        if (isEdit) {
            loadStockItem();
        }
    }, [id]);

    const loadStockItem = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const item = data.stock.find(s => s.itemId === id);
            if (item) {
                setFormData({
                    itemName: item.itemName,
                    tradeSection: item.tradeSection,
                    category: item.category || '',
                    unit: item.unit,
                    currentStock: item.currentStock,
                    minimumStock: item.minimumStock,
                    maximumStock: item.maximumStock || 100,
                    openingStock: item.openingStock || 0,
                    unitPrice: item.unitPrice || 0,
                    location: item.location || '',
                    isActive: item.isActive !== false
                });
            }
        } catch (error) {
            console.error('Error loading stock item:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.itemName || !formData.tradeSection || !formData.unit) {
            alert('Please fill in all required fields');
            return;
        }

        if (formData.minimumStock < 0 || formData.currentStock < 0) {
            alert('Stock values cannot be negative');
            return;
        }

        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            const now = new Date().toISOString();

            // Check for duplicate item name
            const existing = data.stock.find(s =>
                s.itemName.toLowerCase() === formData.itemName.toLowerCase() &&
                s.itemId !== id
            );
            if (existing) {
                alert('An item with this name already exists');
                return;
            }

            if (isEdit) {
                const index = data.stock.findIndex(s => s.itemId === id);
                if (index !== -1) {
                    const oldItem = data.stock[index];
                    data.stock[index] = {
                        ...oldItem,
                        ...formData,
                        totalValue: formData.currentStock * formData.unitPrice,
                        status: getStockStatus(formData.currentStock, formData.minimumStock),
                        lastUpdated: now,
                        modifiedBy: 'Admin',
                        modifiedAt: now
                    };

                    // Add transaction if stock changed
                    if (oldItem.currentStock !== formData.currentStock) {
                        const diff = formData.currentStock - oldItem.currentStock;
                        if (!data.stock[index].transactions) data.stock[index].transactions = [];
                        data.stock[index].transactions.push({
                            date: now,
                            type: 'OPENING',
                            documentNo: 'ADJUSTMENT',
                            quantity: diff,
                            balance: formData.currentStock,
                            sourceDoc: 'Manual Adjustment',
                            remarks: `Stock adjusted from ${oldItem.currentStock} to ${formData.currentStock}`
                        });
                    }
                }
            } else {
                const itemCount = data.stock.length + 1;
                const itemId = `MAT-${String(itemCount).padStart(3, '0')}`;

                const newItem = {
                    itemId,
                    ...formData,
                    totalValue: formData.currentStock * formData.unitPrice,
                    status: getStockStatus(formData.currentStock, formData.minimumStock),
                    transactions: [{
                        date: now,
                        type: 'OPENING',
                        documentNo: 'OPEN-001',
                        quantity: formData.currentStock,
                        balance: formData.currentStock,
                        sourceDoc: 'Initial Stock',
                        remarks: 'Opening stock entry'
                    }],
                    lastUpdated: now,
                    createdBy: 'Admin',
                    createdAt: now,
                    modifiedBy: 'Admin',
                    modifiedAt: now
                };

                data.stock.push(newItem);
                data.counters.stock = itemCount;
            }

            localStorage.setItem('snglData', JSON.stringify(data));
            navigate('/stock');
        } catch (error) {
            console.error('Error saving stock item:', error);
            alert('Error saving stock item');
        }
    };

    const getStockStatus = (current, minimum) => {
        if (current < minimum * 0.5) return 'CRITICAL';
        if (current < minimum) return 'LOW';
        return 'GOOD';
    };

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">{isEdit ? 'Edit Stock Item' : 'Add Stock Item'}</h1>
                <div className="page-actions">
                    <button onClick={() => navigate('/stock')} className="btn btn-outline">
                        <FaTimes /> Cancel
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card">
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Item Name *</label>
                        <input
                            type="text"
                            name="itemName"
                            value={formData.itemName}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Item name"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Trade Section *</label>
                        <select
                            name="tradeSection"
                            value={formData.tradeSection}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            {TRADE_SECTIONS.map(section => (
                                <option key={section.value} value={section.value}>
                                    {section.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Category"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Unit *</label>
                        <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className="form-control"
                            required
                        >
                            {UNITS.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Current Stock</label>
                        <input
                            type="number"
                            name="currentStock"
                            value={formData.currentStock}
                            onChange={handleChange}
                            className="form-control"
                            min="0"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Minimum Stock *</label>
                        <input
                            type="number"
                            name="minimumStock"
                            value={formData.minimumStock}
                            onChange={handleChange}
                            className="form-control"
                            min="0"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Maximum Stock</label>
                        <input
                            type="number"
                            name="maximumStock"
                            value={formData.maximumStock}
                            onChange={handleChange}
                            className="form-control"
                            min="0"
                        />
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Unit Price</label>
                        <input
                            type="number"
                            name="unitPrice"
                            value={formData.unitPrice}
                            onChange={handleChange}
                            className="form-control"
                            min="0"
                            step="0.01"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Location</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            className="form-control"
                            placeholder="Rack/Bin number"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="checkbox-label">
                        <input
                            type="checkbox"
                            name="isActive"
                            checked={formData.isActive}
                            onChange={handleChange}
                        />
                        Active
                    </label>
                </div>

                {!isEdit && (
                    <div className="alert alert-info">
                        <strong>Note:</strong> Opening stock will be set to current stock value.
                    </div>
                )}

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary">
                        <FaSave /> {isEdit ? 'Update' : 'Add'} Stock Item
                    </button>
                </div>
            </form>
        </div>
    );
};

export default StockForm;