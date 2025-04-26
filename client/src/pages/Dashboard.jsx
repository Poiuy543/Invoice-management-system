import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Dashboard() {
    const [stats, setStats] = useState({
        totalInvoices: 0,
        totalReceived: 0,
        outstanding: 0,
        upcomingDue: 0,
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [topClients, setTopClients] = useState([]); // New state for top clients
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Please log in to view the dashboard');
                    return;
                }

                const headers = { Authorization: `Bearer ${token}` };

                // Fetch existing dashboard data
                const res = await axios.get('http://localhost:5000/api/dashboard', {
                    headers,
                });
                console.log('Dashboard response:', res.data);
                console.log('Top clients:', res.data.topClients);
                setStats({
                    totalInvoices: parseInt(res.data.stats.totalInvoices) || 0,
                    totalReceived: parseFloat(res.data.stats.totalReceived) || 0,
                    outstanding: parseFloat(res.data.stats.outstanding) || 0,
                    upcomingDue: parseInt(res.data.stats.upcomingDue) || 0,
                });
                setRecentActivity(res.data.recentActivity || []);
                setTopClients(res.data.topClients || []);

            } catch (err) {
                console.log('Dashboard fetch error:', err);
                setError(err.response?.data?.message || 'Failed to fetch dashboard data');
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <h2>Dashboard</h2>
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Stats Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card text-white bg-primary">
                        <div className="card-body">
                            <h5 className="card-title">Total Invoices</h5>
                            <p className="card-text">{stats.totalInvoices}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-success">
                        <div className="card-body">
                            <h5 className="card-title">Total Received</h5>
                            <p className="card-text">${parseFloat(stats.totalReceived).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-warning">
                        <div className="card-body">
                            <h5 className="card-title">Outstanding Payments</h5>
                            <p className="card-text">${parseFloat(stats.outstanding).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-white bg-info">
                        <div className="card-body">
                            <h5 className="card-title">Upcoming Due</h5>
                            <p className="card-text">{stats.upcomingDue}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top CLients */}
            <h3>Top Clients (by Outstanding)</h3>
            {topClients.length > 0 ? (
                <div className="table-responsive">
                    <table className="table table-striped mb-4">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Total Invoices</th>
                                <th>Outstanding</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {topClients.map(client => (
                                <tr key={client.id}>
                                    <td>{client.name}</td>
                                    <td>{client.total_invoices}</td>
                                    <td>₹{parseFloat(client.outstanding).toFixed(2)}</td>
                                    <td>
                                        <Link to={`/clients/edit/${client.id}`} className="btn btn-sm btn-primary">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <p>No clients with outstanding invoices found.</p>
            )}

            {/* Recent ctivity */}
            <h3>Recent Activity</h3>
            <div className="table-responsive">
                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>Type</th>
                            <th>Invoice No</th>
                            <th>Client</th>
                            <th>Amount</th>
                            <th>Status/Mode</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivity.length > 0 ? (
                            recentActivity.map(activity => (
                                <tr key={`${activity.type}-${activity.id}`}>
                                    <td>{activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}</td>
                                    <td>{activity.invoice_no}</td>
                                    <td>{activity.client_name || 'N/A'}</td>
                                    <td>₹{parseFloat(activity.total).toFixed(2)}</td>
                                    <td>{activity.status}</td>
                                    <td>{new Date(activity.due_date || activity.created_at).toLocaleDateString()}</td>
                                    <td>
                                        {activity.type === 'invoice' ? (
                                            <Link to={`/invoices/edit/${activity.id}`} className="btn btn-sm btn-primary">
                                                View
                                            </Link>
                                        ) : (
                                            <Link to={`/payments/${activity.invoice_id}`} className="btn btn-sm btn-info">
                                                View Invoice
                                            </Link>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7">No recent activity found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Dashboard;