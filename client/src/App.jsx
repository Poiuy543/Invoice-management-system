import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import Navbar from './components/Navbar';
import InvoiceForm from './components/InvoiceForm';
import PaymentForm from './components/PaymentForm';
import ClientForm from './components/ClientForm';
import Dashboard from './pages/Dashboard';
import Invoices from './pages/Invoices';
import Clients from './pages/Clients';
import Payments from './pages/Payments';
import ErrorBoundary from './components/ErrorBoundary';

const ProtectedRoute = ({ children }) => {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
};

const NotFound = () => {
    <div className="text-center mt-5">
        <h2>404 - Page Not Found</h2>
        <p>The page you are looking for does not exists.</p>
    </div>
};

function App() {
    return (
        <Router>
        <Navbar />
        <div className="container mt-4">
          <ErrorBoundary> {/* Wrap Routes with ErrorBoundary */}
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
              <Route path="/invoices/new" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
              <Route path="/invoices/edit/:id" element={<ProtectedRoute><InvoiceForm /></ProtectedRoute>} />
              <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
              <Route path="/clients/new" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
              <Route path="/clients/edit/:id" element={<ProtectedRoute><ClientForm /></ProtectedRoute>} />
              <Route path="/payments/:invoice_id" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
              <Route path="/payments/new/:invoice_id" element={<ProtectedRoute><PaymentForm /></ProtectedRoute>} />
              <Route path="/payments/edit/:id" element={<ProtectedRoute><PaymentForm /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </Router>
    );
}

export default App;