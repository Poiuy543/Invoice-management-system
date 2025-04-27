import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';

// Validation schema 
const schema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
  role: Yup.string().oneOf(['admin', 'accountant'], 'Invalid role').required('Role is required'),
});

function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('accountant');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form
      await schema.validate({ name, email, password, role }, { abortEarly: false });

      const res = await axios.post('http://localhost:5000/api/auth/signup', {
        name,
        email,
        password,
        role,
      });
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch (err) {
      if (err.name === 'ValidationError') {
        const errors = err.inner.reduce((acc, error) => ({
          ...acc,
          [error.path]: error.message,
        }), {});
        setValidationErrors(errors);
      } else {
        setError(err.response?.data?.message || 'Signup failed');
      }
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="card shadow-sm p-4" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 className="text-center mb-4">Signup</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              className={`form-control ${validationErrors.name ? 'is-invalid' : ''}`}
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {validationErrors.name && <div className="invalid-feedback">{validationErrors.name}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className={`form-control ${validationErrors.email ? 'is-invalid' : ''}`}
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {validationErrors.email && <div className="invalid-feedback">{validationErrors.email}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className={`form-control ${validationErrors.password ? 'is-invalid' : ''}`}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {validationErrors.password && <div className="invalid-feedback">{validationErrors.password}</div>}
          </div>
          <div className="mb-3">
            <label htmlFor="role" className="form-label">Role</label>
            <select
              className={`form-control ${validationErrors.role ? 'is-invalid' : ''}`}
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="accountant">Accountant</option>
              <option value="admin">Admin</option>
            </select>
            {validationErrors.role && <div className="invalid-feedback">{validationErrors.role}</div>}
          </div>
          <button type="submit" className="btn btn-primary w-100">Signup</button>
        </form>
      </div>
    </div>
  );
}

export default Signup;