import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as Yup from 'yup';

// Validation schema
const schema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
});

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate form
      await schema.validate({ email, password }, { abortEarly: false });

      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
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
        setError(err.response?.data?.message || 'Login failed');
      }
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-6">
        <h2 className="mb-4">Login</h2>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleSubmit}>
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
          <button type="submit" className="btn btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;