// src/components/StockRegister/StockList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaHistory, FaSearch } from 'react-icons/fa';
import { getTradeSectionLabel, getTradeSectionColor } from '../../data/preDefinedLists';

const StockList = () => {
    const [stock, setStock] = useState([]);
    const [filteredStock, setFilteredStock] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sectionFilter, setSectionFilter] = useState('ALL');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStock();
    }, []);

    useEffect(() => {
        filterStock();
    }, [stock, searchTerm, sectionFilter, statusFilter]);

    const loadStock = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));
            if (data && data.stock) {
                setStock(data.stock);
                setFilteredStock(data.stock);
            }
        } catch (error) {
            console.error('Error loading stock:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterStock = () => {
        let filtered = [...stock];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(s =>
                s.itemId.toLowerCase().includes(term) ||
                s.itemName.toLowerCase().includes(term) ||
                s.category?.toLowerCase().includes(term) ||
                s.location?.toLowerCase().includes(term)
            );
        }

        if (sectionFilter !== 'ALL') {
            filtered = filtered.filter(s => s.tradeSection === sectionFilter);
        }

        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(s => s.status === statusFilter);
        }

        setFilteredStock(filtered);
    };

    const handleDelete = (itemId) => {
        if (window.confirm('Are you sure you want to delete this stock item?')) {
            try {
                const data = JSON.parse(localStorage.getItem('snglData'));
                data.stock = data.stock.filter(s => s.itemId !== itemId);
                localStorage.setItem('snglData', JSON.stringify(data));
                loadStock();
            } catch (error) {
                console.error('Error deleting stock item:', error);
                alert('Error deleting stock item');
            }
        }
    };

    const getStatusBadge = (status) => {
        const classes = {
            'GOOD': 'badge-success',
            'LOW': 'badge-warning',
            'CRITICAL': 'badge-danger'
        };
        return classes[status] || 'badge-secondary';
    };

    if (loading) {
        return <div className="loading">Loading stock items...</div>;
    }

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Stock Register</h1>
                <div className="page-actions">
                    <Link to="/stock/new" className="btn btn-primary">
                        <FaPlus /> Add Item
                    </Link>
                </div>
            </div>

            <div className="card">
                <div className="search-bar">
                    <div className="search-input-wrapper">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by ID, name, category, location..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                    </div>
                    <select
                        value={sectionFilter}
                        onChange={(e) => setSectionFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Sections</option>
                        <option value="MASONRY">Masonry</option>
                        <option value="PLUMBING">Plumbing</option>
                        <option value="CARPENTRY">Carpentry</option>
                        <option value="PAINTING">Painting</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Status</option>
                        <option value="GOOD">Good</option>
                        <option value="LOW">Low</option>
                        <option value="CRITICAL">Critical</option>
                    </select>
                    <button className="btn btn-outline" onClick={loadStock}>
                        Refresh
                    </button>
                </div>

                <div className="stock-summary">
                    <div className="summary-item">
                        <span className="label">Total Items:</span>
                        <span className="value">{stock.length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Good:</span>
                        <span className="value text-green">{stock.filter(s => s.status === 'GOOD').length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Low:</span>
                        <span className="value text-yellow">{stock.filter(s => s.status === 'LOW').length}</span>
                    </div>
                    <div className="summary-item">
                        <span className="label">Critical:</span>
                        <span className="value text-red">{stock.filter(s => s.status === 'CRITICAL').length}</span>
                    </div>
                </div>

                <div className="table-responsive">
                    <table>
                        <thead>
                            <tr>
                                <th>Item ID</th>
                                <th>Item Name</th>
                                <th>Section</th>
                                <th>Category</th>
                                <th>Stock</th>
                                <th>Unit</th>
                                <th>Min Stock</th>
                                <th>Status</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStock.length === 0 ? (
                                <tr>
                                    <td colSpan="10" className="empty-state">
                                        No stock items found
                                    </td>
                                </tr>
                            ) : (
                                filteredStock.map((item) => (
                                    <tr key={item.itemId}>
                                        <td>
                                            <strong>{item.itemId}</strong>
                                            {!item.isActive && (
                                                <span className="badge badge-secondary ml-2">Inactive</span>
                                            )}
                                        </td>
                                        <td>{item.itemName}</td>
                                        <td>
                                            <span style={{ color: getTradeSectionColor(item.tradeSection) }}>
                                                {getTradeSectionLabel(item.tradeSection)}
                                            </span>
                                        </td>
                                        <td>{item.category || '-'}</td>
                                        <td>
                                            <strong>{item.currentStock}</strong>
                                        </td>
                                        <td>{item.unit}</td>
                                        <td>{item.minimumStock}</td>
                                        <td>
                                            <span className={`badge ${getStatusBadge(item.status)}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                        <td>PKR {item.totalValue}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <Link
                                                    to={`/stock/history/${item.itemId}`}
                                                    className="btn btn-info btn-sm"
                                                    title="History"
                                                >
                                                    <FaHistory />
                                                </Link>
                                                <Link
                                                    to={`/stock/edit/${item.itemId}`}
                                                    className="btn btn-outline btn-sm"
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(item.itemId)}
                                                    className="btn btn-danger btn-sm"
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="table-footer">
                    <span>Total: {filteredStock.length} items</span>
                </div>
            </div>
        </div>
    );
};

export default StockList;