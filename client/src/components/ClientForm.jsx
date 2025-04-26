import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';

// Validation schema
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email format').nullable(),
  phone: Yup.string().matches(/^[0-9]{10}$/, 'Phone must be 10 digits').nullable(),
  gst_no: Yup.string().matches(/^[A-Z0-9]{15}$/, 'GST number must be 15 alphanumeric characters').nullable(),
});

function ClientForm() {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    gst_no: '',
  });
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Fetch client for edit mode
    if (id) {
      const fetchClient = async () => {
        try {
          const token = localStorage.getItem('token');
          const res = await axios.get(`http://localhost:5000/api/clients/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFormData({
            name: res.data.name,
            company: res.data.company || '',
            email: res.data.email || '',
            phone: res.data.phone || '',
            address: res.data.address || '',
            gst_no: res.data.gst_no || '',
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to fetch client');
        }
      };
      fetchClient();
    }
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
        // Update client
        await axios.put(`http://localhost:5000/api/clients/${id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        // Create client
        await axios.post('http://localhost:5000/api/clients', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      navigate('/clients');
    } catch (err) {
      if (err.name === 'ValidationError') {
        const errors = err.inner.reduce((acc, error) => ({
          ...acc,
          [error.path]: error.message,
        }), {});
        setValidationErrors(errors);
      } else {
        setError(err.response?.data?.message || 'Failed to save client');
      }
    }
  };

  return (
    <div>
      <h2>{id ? 'Edit Client' : 'Add Client'}</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label">Name</label>
          <input
            type="text"
            name="name"
            className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
            value={formData.name}
            onChange={handleChange}
          />
          {validationErrors.name && <div className="invalid-feedback">{validationErrors.name}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="company" className="form-label">Company</label>
          <input
            type="text"
            name="company"
            className="form-control"
            value={formData.company}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input
            type="email"
            name="email"
            className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
            value={formData.email}
            onChange={handleChange}
          />
          {validationErrors.email && <div className="invalid-feedback">{validationErrors.email}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="phone" className="form-label">Phone</label>
          <input
            type="text"
            name="phone"
            className={`form-control ${validationErrors.phone ? 'is-invalid' : ''}`}
            value={formData.phone}
            onChange={handleChange}
          />
          {validationErrors.phone && <div className="invalid-feedback">{validationErrors.phone}</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="address" className="form-label">Address</label>
          <textarea
            name="address"
            className="form-control"
            value={formData.address}
            onChange={handleChange}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="gst_no" className="form-label">GST Number</label>
          <input
            type="text"
            name="gst_no"
            className={`form-control ${validationErrors.gst_no ? 'is-invalid' : ''}`}
            value={formData.gst_no}
            onChange={handleChange}
          />
          {validationErrors.gst_no && <div className="invalid-feedback">{validationErrors.gst_no}</div>}
        </div>
        <button type="submit" className="btn btn-primary">Save Client</button>
      </form>
    </div>
  );
}

export default ClientForm;