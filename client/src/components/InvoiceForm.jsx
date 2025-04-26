import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';

// Validation schema
const schema = Yup.object().shape({
  client_id: Yup.number().required('Client is required'),
  due_date: Yup.date().required('Due date is required'),
  issue_date: Yup.date().required('Issue date is required'),
  items: Yup.array().of(
    Yup.object().shape({
      description: Yup.string().required('Description is required'),
      qty: Yup.number().min(1, 'Quantity must be at least 1').required('Quantity is required'),
      unit_price: Yup.number().min(0, 'Unit price cannot be negative').required('Unit price is required'),
    })
  ).min(1, 'At least one item is required'),
});

function InvoiceForm() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    client_id: '',
    tax: 0,
    discount: 0,
    due_date: '',
    issue_date: '',
    items: [{ description: '', qty: 1, unit_price: 0 }],
  });
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Fetch clients for dropdown
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(res.data);
      } catch (err) {
        setError('Failed to fetch clients');
      }
    };

    // Fetch invoice for edit mode
    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/invoices/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFormData({
          client_id: res.data.client_id,
          tax: res.data.tax,
          discount: res.data.discount,
          due_date: res.data.due_date.split('T')[0],
          issue_date: res.data.issue_date.split('T')[0],
          items: res.data.items.map(item => ({
            description: item.description,
            qty: item.qty,
            unit_price: item.unit_price,
          })),
        });
      } catch (err) {
        setError('Failed to fetch invoice');
      }
    };

    fetchClients();
    if (id) fetchInvoice();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleItemChange = (index, e) => {
    const { name, value } = e.target;
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [name]: value };
    setFormData({ ...formData, items: newItems });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { description: '', qty: 1, unit_price: 0 }],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form
      await schema.validate(formData, { abortEarly: false });

      const token = localStorage.getItem('token');
      const payload = { ...formData };

      if (id) {
        // Update invoice
        await axios.put(`http://localhost:5000/api/invoices/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create invoice
        await axios.post('http://localhost:5000/api/invoices', payload, {
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
        setError(err.response?.data?.message || 'Failed to save invoice');
      }
    }
  };

  // Calculate totals
  const subtotal = formData.items.reduce((sum, item) => sum + item.qty * item.unit_price, 0);
  const total = subtotal + (parseFloat(formData.tax) || 0) - (parseFloat(formData.discount) || 0);

  return (
    <div>
      <h2>{id ? 'Edit Invoice' : 'Create Invoice'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="client_id" className="form-label">Client</label>
          <select
            name="client_id"
            className={`form-control ${validationErrors.client_id ? 'is-invalid' : ''}`}
            value={formData.client_id}
            onChange={handleChange}
          >
            <option value="">Select Client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          {validationErrors.client_id && <div className="invalid-feedback">{validationErrors.client_id}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="issue_date" className="form-label">Issue Date</label>
          <input
            type="date"
            name="issue_date"
            className={`form-control ${validationErrors.issue_date ? 'is-invalid' : ''}`}
            value={formData.issue_date}
            onChange={handleChange}
          />
          {validationErrors.issue_date && <div className="invalid-feedback">{validationErrors.issue_date}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="due_date" className="form-label">Due Date</label>
          <input
            type="date"
            name="due_date"
            className={`form-control ${validationErrors.due_date ? 'is-invalid' : ''}`}
            value={formData.due_date}
            onChange={handleChange}
          />
          {validationErrors.due_date && <div className="invalid-feedback">{validationErrors.due_date}</div>}
        </div>
        <h4>Items</h4>
        {formData.items.map((item, index) => (
          <div key={index} className="row mb-3">
            <div className="col-md-4">
              <input
                type="text"
                name="description"
                className={`form-control ${validationErrors[`items[${index}].description`] ? 'is-invalid' : ''}`}
                placeholder="Description"
                value={item.description}
                onChange={(e) => handleItemChange(index, e)}
              />
              {validationErrors[`items[${index}].description`] && (
                <div className="invalid-feedback">{validationErrors[`items[${index}].description`]}</div>
              )}
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="qty"
                className={`form-control ${validationErrors[`items[${index}].qty`] ? 'is-invalid' : ''}`}
                placeholder="Qty"
                value={item.qty}
                onChange={(e) => handleItemChange(index, e)}
                min="1"
              />
              {validationErrors[`items[${index}].qty`] && (
                <div className="invalid-feedback">{validationErrors[`items[${index}].qty`]}</div>
              )}
            </div>
            <div className="col-md-2">
              <input
                type="number"
                name="unit_price"
                className={`form-control ${validationErrors[`items[${index}].unit_price`] ? 'is-invalid' : ''}`}
                placeholder="Unit Price"
                value={item.unit_price}
                onChange={(e) => handleItemChange(index, e)}
                min="0"
                step="0.01"
              />
              {validationErrors[`items[${index}].unit_price`] && (
                <div className="invalid-feedback">{validationErrors[`items[${index}].unit_price`]}</div>
              )}
            </div>
            <div className="col-md-2">
              <p className="form-control-plaintext">${(item.qty * item.unit_price).toFixed(2)}</p>
            </div>
            <div className="col-md-2">
              <button type="button" className="btn btn-danger" onClick={() => removeItem(index)}>
                Remove
              </button>
            </div>
          </div>
        ))}
        <button type="button" className="btn btn-secondary mb-3" onClick={addItem}>
          Add Item
        </button>
        <div className="mb-3">
          <label htmlFor="tax" className="form-label">Tax ($)</label>
          <input
            type="number"
            name="tax"
            className="form-control"
            value={formData.tax}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <label htmlFor="discount" className="form-label">Discount ($)</label>
          <input
            type="number"
            name="discount"
            className="form-control"
            value={formData.discount}
            onChange={handleChange}
            min="0"
            step="0.01"
          />
        </div>
        <div className="mb-3">
          <h5>Subtotal: ${subtotal.toFixed(2)}</h5>
          <h5>Total: ${total.toFixed(2)}</h5>
        </div>
        <button type="submit" className="btn btn-primary">Save Invoice</button>
      </form>
    </div>
  );
}

export default InvoiceForm;