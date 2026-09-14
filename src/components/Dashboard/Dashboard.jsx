import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaClipboardList,
    FaExchangeAlt,
    FaShoppingCart,
    FaTrash,
    FaBoxes,
    FaExclamationTriangle,
    FaCheckCircle,
    FaClock,
    FaArrowUp,
    FaArrowDown
} from 'react-icons/fa';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Area,
    AreaChart
} from 'recharts';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalComplaints: 0,
        pendingComplaints: 0,
        completedComplaints: 0,
        totalIssues: 0,
        activeIssues: 0,
        totalPurchases: 0,
        totalScraps: 0,
        stockItems: 0,
        lowStockItems: 0,
        criticalStockItems: 0
    });

    const [complaintStatusData, setComplaintStatusData] = useState([]);
    const [tradeSectionData, setTradeSectionData] = useState([]);
    const [stockTrendData, setStockTrendData] = useState([]);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = () => {
        try {
            const data = JSON.parse(localStorage.getItem('snglData'));

            if (!data) {
                setLoading(false);
                return;
            }

            const complaints = data.complaints || [];
            const issues = data.issues || [];
            const purchases = data.purchases || [];
            const scraps = data.scraps || [];
            const stock = data.stock || [];

            // Stats
            setStats({
                totalComplaints: complaints.length,
                pendingComplaints: complaints.filter(c => c.status !== 'COMPLETED' && c.status !== 'CLOSED').length,
                completedComplaints: complaints.filter(c => c.status === 'COMPLETED' || c.status === 'CLOSED').length,
                totalIssues: issues.length,
                activeIssues: issues.filter(i => i.isActive !== false).length,
                totalPurchases: purchases.length,
                totalScraps: scraps.length,
                stockItems: stock.length,
                lowStockItems: stock.filter(s => s.status === 'LOW').length,
                criticalStockItems: stock.filter(s => s.status === 'CRITICAL').length
            });

            // Complaint Status Distribution
            const statusCount = {};
            complaints.forEach(c => {
                statusCount[c.status] = (statusCount[c.status] || 0) + 1;
            });
            setComplaintStatusData(
                Object.entries(statusCount).map(([name, value]) => ({
                    name,
                    value,
                    color: getStatusColor(name)
                }))
            );

            // Trade Section Distribution
            const sectionCount = {};
            complaints.forEach(c => {
                const issuesForComplaint = issues.filter(i =>
                    i.sourceDocType === 'COMPLAINT' && i.sourceReference === c.id
                );
                issuesForComplaint.forEach(i => {
                    sectionCount[i.tradeSection] = (sectionCount[i.tradeSection] || 0) + 1;
                });
            });
            setTradeSectionData(
                Object.entries(sectionCount).map(([name, value]) => ({
                    name: name.charAt(0) + name.slice(1).toLowerCase(),
                    value,
                    color: getTradeColor(name)
                }))
            );

            // Stock Trend (last 7 days)
            const trendData = [];
            const now = new Date();
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split('T')[0];

                let totalIssued = 0;
                let totalPurchased = 0;

                issues.forEach(issue => {
                    if (issue.issueDate === dateStr) {
                        totalIssued += issue.quantity || 0;
                    }
                });

                purchases.forEach(purchase => {
                    if (purchase.purchaseDate === dateStr && purchase.addedToStock) {
                        purchase.items.forEach(item => {
                            if (item.isStoreItem) {
                                totalPurchased += item.quantity || 0;
                            }
                        });
                    }
                });

                trendData.push({
                    date: dateStr,
                    issued: totalIssued,
                    purchased: totalPurchased
                });
            }
            setStockTrendData(trendData);

            // Recent Activities
            const activities = [];

            complaints.slice(-5).forEach(c => {
                activities.push({
                    id: c.id,
                    type: 'COMPLAINT',
                    title: `Complaint ${c.id}`,
                    description: `${c.location} - ${c.indenter}`,
                    status: c.status,
                    timestamp: c.createdAt,
                    color: getStatusColor(c.status)
                });
            });

            issues.slice(-3).forEach(i => {
                activities.push({
                    id: i.irNo,
                    type: 'ISSUE',
                    title: `Issue ${i.irNo}`,
                    description: `${i.itemName} (${i.quantity} ${i.unit})`,
                    status: i.isActive ? 'Active' : 'Inactive',
                    timestamp: i.createdAt,
                    color: '#2563EB'
                });
            });

            purchases.slice(-3).forEach(p => {
                activities.push({
                    id: p.cpNo,
                    type: 'PURCHASE',
                    title: `Purchase ${p.cpNo}`,
                    description: `PKR ${p.totalAmount} - ${p.tradeSection}`,
                    status: p.addedToStock ? 'Added to Stock' : 'Consumable',
                    timestamp: p.createdAt,
                    color: '#059669'
                });
            });

            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setRecentActivities(activities.slice(0, 10));

            setLoading(false);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'NEW': '#6B7280',
            'ASSIGNED': '#2563EB',
            'IN_PROGRESS': '#D97706',
            'ON_HOLD': '#9CA3AF',
            'COMPLETED': '#059669',
            'VERIFIED': '#7C3AED',
            'CLOSED': '#1F2937'
        };
        return colors[status] || '#6B7280';
    };

    const getTradeColor = (section) => {
        const colors = {
            'MASONRY': '#8B6914',
            'PLUMBING': '#2563EB',
            'CARPENTRY': '#D97706',
            'PAINTING': '#059669'
        };
        return colors[section] || '#6B7280';
    };

    const COLORS = ['#2563EB', '#D97706', '#059669', '#DC2626', '#7C3AED', '#6B7280', '#8B6914'];

    if (loading) {
        return <div className="dashboard-loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <div className="page-actions">
                    <button className="btn btn-outline btn-sm" onClick={loadDashboardData}>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Main Navigation */}
            <div className="stats-grid">
                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/complaints')}>
                    <div className="stat-icon blue">
                        <FaClipboardList />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>Complaints</div>
                        <div className="stat-sub text-gray">Manage and view all complaints</div>
                    </div>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/issues')}>
                    <div className="stat-icon green">
                        <FaExchangeAlt />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>Issue Register</div>
                        <div className="stat-sub text-gray">Materials issued from store</div>
                    </div>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/purchases')}>
                    <div className="stat-icon orange">
                        <FaShoppingCart />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>Cash Purchase Register</div>
                        <div className="stat-sub text-gray">Market purchases & stock addition</div>
                    </div>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/stock')}>
                    <div className="stat-icon purple">
                        <FaBoxes />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>Stock Register</div>
                        <div className="stat-sub text-gray">View current inventory status</div>
                    </div>
                </div>

                <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => navigate('/scraps')}>
                    <div className="stat-icon red">
                        <FaTrash />
                    </div>
                    <div className="stat-content">
                        <div className="stat-label" style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1f2937' }}>Scrap Register</div>
                        <div className="stat-sub text-gray">Returned materials & scrap items</div>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
                <div className="chart-card">
                    <h3>Complaint Status Distribution</h3>
                    <div className="chart-container">
                        <PieChart width={300} height={250}>
                            <Pie
                                data={complaintStatusData}
                                cx={150}
                                cy={125}
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {complaintStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </div>
                </div>

                <div className="chart-card">
                    <h3>Work Distribution by Trade</h3>
                    <div className="chart-container">
                        <BarChart
                            width={400}
                            height={250}
                            data={tradeSectionData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis type="category" dataKey="name" />
                            <Tooltip />
                            <Bar dataKey="value" fill="#2563EB">
                                {tradeSectionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </div>
                </div>

                <div className="chart-card full-width">
                    <h3>Stock Activity (Last 7 Days)</h3>
                    <div className="chart-container">
                        <AreaChart
                            width={800}
                            height={250}
                            data={stockTrendData}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area type="monotone" dataKey="issued" stackId="1" stroke="#DC2626" fill="#DC2626" fillOpacity={0.3} />
                            <Area type="monotone" dataKey="purchased" stackId="1" stroke="#059669" fill="#059669" fillOpacity={0.3} />
                        </AreaChart>
                    </div>
                </div>
            </div>

            {/* Recent Activities */}
            <div className="activities-section">
                <h3>Recent Activities</h3>
                <div className="activities-list">
                    {recentActivities.length === 0 ? (
                        <div className="empty-state">
                            <p>No recent activities</p>
                        </div>
                    ) : (
                        recentActivities.map((activity, index) => (
                            <div key={index} className="activity-item">
                                <div className="activity-dot" style={{ background: activity.color }}></div>
                                <div className="activity-content">
                                    <div className="activity-header">
                                        <span className="activity-title">{activity.title}</span>
                                        <span className="activity-time">
                                            {new Date(activity.timestamp).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="activity-description">{activity.description}</div>
                                    <span className="activity-badge" style={{ background: activity.color }}>
                                        {activity.status}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;