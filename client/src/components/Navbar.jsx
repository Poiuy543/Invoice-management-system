import { NavLink, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true }); // Use replace to prevent back navigation
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light" aria-label="Main navigation">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/" aria-current="page">
          Invoice System
        </NavLink>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto">
            {token ? (
              <>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to="/dashboard"
                    aria-current={token && window.location.pathname === '/dashboard' ? 'page' : undefined}
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to="/invoices"
                    aria-current={token && window.location.pathname === '/invoices' ? 'page' : undefined}
                  >
                    Invoices
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to="/clients"
                    aria-current={token && window.location.pathname === '/clients' ? 'page' : undefined}
                  >
                    Clients
                  </NavLink>
                </li>
                <li className="nav-item">
                  <button
                    className="nav-link btn btn-link"
                    onClick={handleLogout}
                    aria-label="Logout"
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to="/login"
                    aria-current={!token && window.location.pathname === '/login' ? 'page' : undefined}
                  >
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    to="/signup"
                    aria-current={!token && window.location.pathname === '/signup' ? 'page' : undefined}
                  >
                    Signup
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;