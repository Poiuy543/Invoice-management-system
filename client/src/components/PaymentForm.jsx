import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';

// Validation schema
const schema = Yup.object().shape({
  invoice_id: Yup.number().required('Invoice is required'),
  amount: Yup.number().min(0.01, 'Amount must be positive').required('Amount is required'),
  mode: Yup.string().oneOf(['Cash', 'UPI', 'Bank'], 'Invalid payment mode').required('Payment mode is required'),
  date: Yup.date().required('Date is required'),
});

function PaymentForm() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    invoice_id: '',
    amount: '',
    mode: 'Cash',
    date: new Date().toISOString().split('T')[0],
  });
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Fetch invoices for dropdown
    const fetchInvoices = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/invoices', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(res.data);
      } catch (err) {
        setError('Failed to fetch invoices');
      }
    };

    // Fetch payment for edit mode
    const fetchPayment = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/payments/invoice/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payment = res.data[0]; // Assume first payment for simplicity
        if (payment) {
          setFormData({
            invoice_id: payment.invoice_id,
            amount: payment.amount,
            mode: payment.mode,
            date: payment.date.split('T')[0],
          });
        }
      } catch (err) {
        setError('Failed to fetch payment');
      }
    };

    fetchInvoices();
    if (id) fetchPayment();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form
      await schema.validate(formData, { abortEarly: false });

      const token = localStorage.getItem('token');
      const payload = { ...formData };

      if (id) {
        // Update payment (requires payment ID, not invoice ID)
        const payment = (await axios.get(`http://localhost:5000/api/payments/invoice/${formData.invoice_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })).data[0];
        await axios.put(`http://localhost:5000/api/payments/${payment.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create payment
        await axios.post('http://localhost:5000/api/payments', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      navigate('/invoices');
    } catch (err) {
      if (err.name === 'ValidationError') {
        const errors = err.inner.reduce((acc, error) => ({
          ...acc,
          [error.path]: error.message,
        }), {});
        setValidationErrors(errors);
      } else {
        setError(err.response?.data?.message || 'Failed to save payment');
      }
    }
  };

  return (
    <div>
      <h2>{id ? 'Edit Payment' : 'Record Payment'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="invoice_id" className="form-label">Invoice</label>
          <select
            name="invoice_id"
            className={`form-control ${validationErrors.invoice_id ? 'is-invalid' : ''}`}
            value={formData.invoice_id}
            onChange={handleChange}
          >
            <option value="">Select Invoice</option>
            {invoices.map(invoice => (
              <option key={invoice.id} value={invoice.id}>{invoice.invoice_no}</option>
            ))}
          </select>
          {validationErrors.invoice_id && <div className="invalid-feedback">{validationErrors.invoice_id}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="amount" className="form-label">Amount ($)</label>
          <input
            type="number"
            name="amount"
            className={`form-control ${validationErrors.amount ? 'is-invalid' : ''}`}
            value={formData.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
          />
          {validationErrors.amount && <div className="invalid-feedback">{validationErrors.amount}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="mode" className="form-label">Payment Mode</label>
          <select
            name="mode"
            className={`form-control ${validationErrors.mode ? 'is-invalid' : ''}`}
            value={formData.mode}
            onChange={handleChange}
          >
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Bank">Bank</option>
          </select>
          {validationErrors.mode && <div className="invalid-feedback">{validationErrors.mode}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="date" className="form-label">Date</label>
          <input
            type="date"
            name="date"
            className={`form-control ${validationErrors.date ? 'is-invalid' : ''}`}
            value={formData.date}
            onChange={handleChange}
          />
          {validationErrors.date && <div className="invalid-feedback">{validationErrors.date}</div>}
        </div>
        <button type="submit" className="btn btn-primary">Save Payment</button>
      </form>
    </div>
  );
}

export default PaymentForm;