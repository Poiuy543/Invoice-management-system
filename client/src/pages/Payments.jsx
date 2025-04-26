import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function Payments() {
  const { invoice_id } = useParams();
  const [payments, setPayments] = useState([]);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem('token');
        const paymentsRes = await axios.get(`http://localhost:5000/api/payments/invoice/${invoice_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPayments(paymentsRes.data);

        const invoiceRes = await axios.get(`http://localhost:5000/api/invoices/${invoice_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoice(invoiceRes.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch payments');
      }
    };

    fetchPayments();
  }, [invoice_id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayments(payments.filter(payment => payment.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete payment');
    }
  };

  return (
    <div>
      <h2>Payments for Invoice {invoice?.invoice_no}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      {invoice && (
        <div className="mb-3">
          <p><strong>Client:</strong> {invoice.client_name}</p>
          <p><strong>Total:</strong> ${parseFloat(invoice.total).toFixed(2)}</p>
          <p><strong>Status:</strong> {invoice.status}</p>
        </div>
      )}
      <Link to={`/payments/new/${invoice_id}`} className="btn btn-primary mb-3">Record Payment</Link>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Amount</th>
            <th>Mode</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {payments.map(payment => (
            <tr key={payment.id}>
              <td>${parseFloat(payment.amount).toFixed(2)}</td>
              <td>{payment.mode}</td>
              <td>{new Date(payment.date).toLocaleDateString()}</td>
              <td>
                <Link to={`/payments/edit/${payment.id}`} className="btn btn-sm btn-warning">Edit</Link>
                <button
                  className="btn btn-sm btn-danger ms-2"
                  onClick={() => handleDelete(payment.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Payments;