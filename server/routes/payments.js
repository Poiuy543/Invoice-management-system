const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Helper function to update invoice status
async function updateInvoiceStatus(invoice_id) {
  const invoice = await pool.query('SELECT total, due_date FROM invoices WHERE id = $1', [invoice_id]);
  if (invoice.rows.length === 0) throw new Error('Invoice not found');

  const payments = await pool.query('SELECT SUM(amount) as total_paid FROM payments WHERE invoice_id = $1', [invoice_id]);
  const totalPaid = parseFloat(payments.rows[0].total_paid) || 0;
  const total = parseFloat(invoice.rows[0].total);
  const dueDate = new Date(invoice.rows[0].due_date);
  const today = new Date();

  let status;
  if (totalPaid >= total) {
    status = 'Paid';
  } else if (totalPaid > 0) {
    status = 'Partially Paid';
  } else if (dueDate < today) {
    status = 'Overdue';
  } else {
    status = 'Sent';
  }

  await pool.query('UPDATE invoices SET status = $1 WHERE id = $2', [status, invoice_id]);
  return status;
}

// Create Payment
router.post('/', authMiddleware, async (req, res) => {
  const { invoice_id, amount, mode, date } = req.body;

  try {
    // Validate input
    if (!invoice_id || !amount || !mode || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!['Cash', 'UPI', 'Bank'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid payment mode' });
    }
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }

    // Verify invoice exists and user has access
    const invoice = await pool.query('SELECT created_by FROM invoices WHERE id = $1', [invoice_id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Insert payment
    const newPayment = await pool.query(
      'INSERT INTO payments (invoice_id, amount, mode, date) VALUES ($1, $2, $3, $4) RETURNING *',
      [invoice_id, amount, mode, date]
    );

    // Update invoice status
    const status = await updateInvoiceStatus(invoice_id);

    res.status(201).json({ ...newPayment.rows[0], invoice_status: status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get Payments for an Invoice
router.get('/invoice/:invoice_id', authMiddleware, async (req, res) => {
  const { invoice_id } = req.params;

  try {
    // Verify invoice exists and user has access
    const invoice = await pool.query('SELECT created_by FROM invoices WHERE id = $1', [invoice_id]);
    if (invoice.rows.length === 0) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const payments = await pool.query('SELECT * FROM payments WHERE invoice_id = $1 ORDER BY date DESC', [invoice_id]);
    res.json(payments.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get All Payments (Admin only)
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    const payments = await pool.query('SELECT p.*, i.invoice_no FROM payments p JOIN invoices i ON p.invoice_id = i.id ORDER BY p.date DESC');
    res.json(payments.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update Payment
router.put('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;
  const { amount, mode, date } = req.body;

  try {
    // Verify payment exists
    const payment = await pool.query('SELECT invoice_id FROM payments WHERE id = $1', [id]);
    if (payment.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify invoice access
    const invoice = await pool.query('SELECT created_by FROM invoices WHERE id = $1', [payment.rows[0].invoice_id]);
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate input
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be positive' });
    }
    if (!['Cash', 'UPI', 'Bank'].includes(mode)) {
      return res.status(400).json({ message: 'Invalid payment mode' });
    }

    // Update payment
    const updatedPayment = await pool.query(
      'UPDATE payments SET amount = $1, mode = $2, date = $3 WHERE id = $4 RETURNING *',
      [amount, mode, date, id]
    );

    // Update invoice status
    const status = await updateInvoiceStatus(payment.rows[0].invoice_id);

    res.json({ ...updatedPayment.rows[0], invoice_status: status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete Payment
router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Verify payment exists
    const payment = await pool.query('SELECT invoice_id FROM payments WHERE id = $1', [id]);
    if (payment.rows.length === 0) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify invoice access
    const invoice = await pool.query('SELECT created_by FROM invoices WHERE id = $1', [payment.rows[0].invoice_id]);
    if (req.user.role !== 'admin' && invoice.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete payment
    await pool.query('DELETE FROM payments WHERE id = $1', [id]);

    // Update invoice status
    const status = await updateInvoiceStatus(payment.rows[0].invoice_id);

    res.json({ message: 'Payment deleted', invoice_status: status });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;