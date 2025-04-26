const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Create Invoice
router.post('/', authMiddleware, async (req, res) => {
  const { client_id, items, tax, discount, due_date, issue_date } = req.body;

  try {
    // Validate input
    if (!client_id || !items || !due_date || !issue_date || !items.length) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Generate unique invoice number (e.g., INV-0001)
    const count = await pool.query('SELECT COUNT(*) FROM invoices');
    const invoice_no = `INV-${(parseInt(count.rows[0].count) + 1).toString().padStart(4, '0')}`;

    // Calculate total
    const itemTotals = items.map(item => item.qty * item.unit_price);
    const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);
    const total = subtotal + (tax || 0) - (discount || 0);

    // Check due date for Overdue status
    const dueDate = new Date(due_date);
    const today = new Date();
    const status = dueDate < today ? 'Overdue' : 'Draft';

    // Insert invoice
    const newInvoice = await pool.query(
      'INSERT INTO invoices (invoice_no, client_id, total, tax, discount, status, due_date, issue_date, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [invoice_no, client_id, total, tax || 0, discount || 0, status, due_date, issue_date, req.user.id]
    );

    // Insert invoice items
    for (const item of items) {
      await pool.query(
        'INSERT INTO invoice_items (invoice_id, description, qty, unit_price, total) VALUES ($1, $2, $3, $4, $5)',
        [newInvoice.rows[0].id, item.description, item.qty, item.unit_price, item.qty * item.unit_price]
      );
    }

    res.status(201).json(newInvoice.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Invoices (Admin sees all, Accountant sees own)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let invoices;
    if (req.user.role === 'admin') {
      invoices = await pool.query(`
        SELECT i.*, c.name as client_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
      `);
    } else {
      invoices = await pool.query(`
        SELECT i.*, c.name as client_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        WHERE i.created_by = $1
      `, [req.user.id]);
    }

    // Check for Overdue status
    for (const invoice of invoices.rows) {
      if (invoice.status !== 'Paid' && new Date(invoice.due_date) < new Date()) {
        await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', ['Overdue', invoice.id]);
        invoice.status = 'Overdue';
      }
    }

    res.json(invoices.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Single Invoice with Items
router.get('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const invoice = await pool.query(
      'SELECT i.*, c.name as client_name FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE i.id = $1',
      [id]
    );
    if (invoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    // Restrict access for accountants
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const items = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);

    // Check Overdue status
    if (invoice.rows[0].status !== 'Paid' && new Date(invoice.rows[0].due_date) < new Date()) {
      await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', ['Overdue', id]);
      invoice.rows[0].status = 'Overdue';
    }

    res.json({ ...invoice.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Invoice
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { client_id, items, tax, discount, due_date, issue_date, status } = req.body;

  try {
    // Verify invoice exists and user has access
    const invoice = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Calculate total
    const itemTotals = items.map(item => item.qty * item.unit_price);
    const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);
    const total = subtotal + (tax || 0) - (discount || 0);

    // Update invoice
    const updatedInvoice = await pool.query(
      'UPDATE invoices SET client_id = $1, total = $2, tax = $3, discount = $4, status = $5, due_date = $6, issue_date = $7 WHERE id = $8 RETURNING *',
      [client_id, total, tax || 0, discount || 0, status || invoice.rows[0].status, due_date, issue_date, id]
    );

    // Delete existing items
    await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

    // Insert new items
    for (const item of items) {
      await pool.query(
        'INSERT INTO invoice_items (invoice_id, description, qty, unit_price, total) VALUES ($1, $2, $3, $4, $5)',
        [id, item.description, item.qty, item.unit_price, item.qty * item.unit_price]
      );
    }

    res.json(updatedInvoice.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Invoice
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify invoice exists and user has access
    const invoice = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;