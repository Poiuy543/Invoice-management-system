const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create Client
router.post('/', authMiddleware, async (req, res) => {
  const { name, company, email, phone, address, gst_no } = req.body;

  try {
    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check for duplicate email
    if (email) {
      const existingClient = await pool.query('SELECT * FROM clients WHERE email = $1', [email]);
      if (existingClient.rows.length > 0) {
        return res.status(400).json({ message: 'Client with this email already exists' });
      }
    }

    // Insert client
    const newClient = await pool.query(
      'INSERT INTO clients (name, company, email, phone, address, gst_no) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, company, email, phone, address, gst_no]
    );

    res.status(201).json(newClient.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Clients
router.get('/', authMiddleware, async (req, res) => {
  try {
    const clients = await pool.query('SELECT * FROM clients ORDER BY name');
    res.json(clients.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Client
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Client Stats (Total Invoices, Outstanding Amount)
router.get('/:id/stats', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    // Verify client exists
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Role-based filtering
    const whereClause = role === 'admin' ? '' : 'AND created_by = $2';
    const queryParams = role === 'admin' ? [id] : [id, userId];

    // Total Invoices
    const totalInvoices = await pool.query(
      `SELECT COUNT(*) as count FROM invoices WHERE client_id = $1 ${whereClause}`,
      queryParams
    );

    // Outstanding Amount
    const outstanding = await pool.query(
      `SELECT COALESCE(SUM(i.total - COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE p.invoice_id = i.id
      ), 0)), 0) as total
      FROM invoices i
      WHERE i.client_id = $1
      AND i.status IN ('Sent', 'Overdue', 'Partially Paid')
      ${whereClause}`,
      queryParams
    );

    res.json({
      totalInvoices: parseInt(totalInvoices.rows[0].count),
      outstanding: parseFloat(outstanding.rows[0].total).toFixed(2),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Client
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { name, company, email, phone, address, gst_no } = req.body;

  try {
    // Verify client exists
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Validate input
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    // Check for duplicate email (excluding current client)
    if (email) {
      const existingClient = await pool.query('SELECT * FROM clients WHERE email = $1 AND id != $2', [email, id]);
      if (existingClient.rows.length > 0) {
        return res.status(400).json({ message: 'Client with this email already exists' });
      }
    }

    // Update client
    const updatedClient = await pool.query(
      'UPDATE clients SET name = $1, company = $2, email = $3, phone = $4, address = $5, gst_no = $6 WHERE id = $7 RETURNING *',
      [name, company, email, phone, address, gst_no, id]
    );

    res.json(updatedClient.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Client
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify client exists
    const client = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (client.rows.length === 0) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Delete client (invoices will have client_id set to NULL due to ON DELETE SET NULL)
    await pool.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ message: 'Client deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;