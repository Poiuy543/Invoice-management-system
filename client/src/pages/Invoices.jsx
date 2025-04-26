import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch invoices');
      }
    };

    fetchInvoices();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this invoice?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoices(invoices.filter(inv => inv.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete invoice');
    }
  };

  return (
    <div>
      <h2>Invoices</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <Link to="/invoices/new" className="btn btn-primary mb-3">Create Invoice</Link>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Invoice No</th>
            <th>Client</th>
            <th>Total</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map(inv => (
            <tr key={inv.id}>
              <td>{inv.invoice_no}</td>
              <td>{inv.client_name || inv.client_id}</td>
              <td>${parseFloat(inv.total).toFixed(2)}</td>
              <td>{inv.status}</td>
              <td>{new Date(inv.due_date).toLocaleDateString()}</td>
              <td>
                <Link to={`/invoices/edit/${inv.id}`} className="btn btn-sm btn-warning">Edit</Link>
                <button
                  className="btn btn-sm btn-danger ms-2"
                  onClick={() => handleDelete(inv.id)}
                >
                  Delete
                </button>
                <Link to={`/payments/${inv.id}`} className="btn btn-sm btn-info
                ms-2">View Payments</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Invoices;