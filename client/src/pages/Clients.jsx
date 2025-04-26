import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function Clients() {
  const [clients, setClients] = useState([]);
  const [stats, setStats] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchClientsAndStats = async () => {
      try {
        const token = localStorage.getItem('token');
        // Fetch clients
        const clientsRes = await axios.get('http://localhost:5000/api/clients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setClients(clientsRes.data);

        // Fetch stats for each client
        const statsPromises = clientsRes.data.map(client =>
          axios.get(`http://localhost:5000/api/clients/${client.id}/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        );
        const statsResponses = await Promise.all(statsPromises);
        const statsData = statsResponses.reduce((acc, res, index) => ({
          ...acc,
          [clientsRes.data[index].id]: res.data,
        }), {});
        setStats(statsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch clients');
      }
    };

    fetchClientsAndStats();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this client?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/clients/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClients(clients.filter(client => client.id !== id));
      setStats(prev => {
        const newStats = { ...prev };
        delete newStats[id];
        return newStats;
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client');
    }
  };

  return (
    <div>
      <h2>Clients</h2>
      {error && <div className="alert alert-danger">{error}</div>}
      <Link to="/clients/new" className="btn btn-primary mb-3">Add Client</Link>
      <table className="table table-striped">
        <thead>
          <tr>
            <th>Name</th>
            <th>Company</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Total Invoices</th>
            <th>Outstanding</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client.id}>
              <td>{client.name}</td>
              <td>{client.company || 'N/A'}</td>
              <td>{client.email || 'N/A'}</td>
              <td>{client.phone || 'N/A'}</td>
              <td>{stats[client.id]?.totalInvoices || 0}</td>
              <td>${stats[client.id]?.outstanding || '0.00'}</td>
              <td>
                <Link to={`/clients/edit/${client.id}`} className="btn btn-sm btn-warning">Edit</Link>
                <button
                  className="btn btn-sm btn-danger ms-2"
                  onClick={() => handleDelete(client.id)}
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

export default Clients;