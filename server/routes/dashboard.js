const express = require('express');
const pool = require('../config/db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Get Dashboard Stats
router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    console.log('Dashboard request:', { userId, role });

    // Base query condition for role-based filtering
    const whereClause = role === 'admin' ? '' : 'WHERE created_by = $1';
    const queryParams = role === 'admin' ? [] : [userId];

    // Total Invoices
    console.log('Running totalInvoicesQuery:', { query: `SELECT COUNT(*) as count
    FROM invoices${whereClause}`, params: queryParams });
    const totalInvoicesQuery = `SELECT COUNT(*) as count FROM invoices ${whereClause}`;
    const totalInvoices = await pool.query(totalInvoicesQuery, queryParams);

    // Total Received (sum of payments for Paid or Partially Paid invoices)
    console.log('Running totalReceivedQuery:', { query: `SELECT COALESCE(SUM(p.amount), 0) 
    as total FROM payments p JOIN invoices i ON p.invoice_id = i.id${whereClause}`, params: queryParams });
    const totalReceivedQuery = `
      SELECT COALESCE(SUM(p.amount), 0) as total
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      ${whereClause}
    `;
    const totalReceived = await pool.query(totalReceivedQuery, queryParams);

    // Outstanding Payments (sum of total for Sent, Overdue, Partially Paid invoices)
    console.log('Running outstandingQuery:', { query: `SELECT COALESCE(SUM(i.total - 
    COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)), 0)
    as total FROM invoices i${whereClause} AND i.status IN ('Sent', 'Overdue')`, params: queryParams });
    const outstandingQuery = `
      SELECT COALESCE(SUM(i.total - COALESCE((
        SELECT SUM(p.amount)
        FROM payments p
        WHERE p.invoice_id = i.id
      ), 0)), 0) as total
      FROM invoices i
      WHERE
      i.status IN ('Sent', 'Overdue')
    `;
    const outstanding = await pool.query(outstandingQuery, queryParams);

    // Upcoming Due Invoices (due within 7 days)
    console.log('Running upcomingDueQuery:', { query: `SELECT COUNT(*) as count FROM
    invoices i${whereClause} AND i.status IN ('Sent', 'Overdue') AND i.due_date
    BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`, params: queryParams });
    const upcomingDueQuery = `
      SELECT COUNT(*) as count
      FROM invoices i
      WHERE i.status IN ('Sent', 'Overdue')
      AND i.due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
    `;
    const upcomingDue = await pool.query(upcomingDueQuery, queryParams);

    // Recent Activity (last 5 invoices or payments)
    console.log('Running recentActivityQuery:', { query: `...`, params:
    queryParams });
    const recentActivityQuery = `
      SELECT 
        'invoice' as type, 
        i.id, 
        i.invoice_no, 
        c.name as client_name, 
        i.total, 
        i.status, 
        i.due_date, 
        i.created_at
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      ${whereClause}
      UNION ALL
      SELECT 
        'payment' as type, 
        p.id, 
        i.invoice_no, 
        c.name as client_name, 
        p.amount as total, 
        p.mode as status, 
        p.date as due_date, 
        p.created_at
      FROM payments p
      JOIN invoices i ON p.invoice_id = i.id
      LEFT JOIN clients c ON i.client_id = c.id
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 5
    `;
    const recentActivity = await pool.query(recentActivityQuery, queryParams);

    // Top Clients (by outstanding amount, limited to 3)
    console.log('Running topClientsQuery:', { query: `SELECT c.id, c.name, COUNT(i.
    id) as total_invoices, COALESCE(SUM(i.total - COALESCE((SELECT SUM(p.amount) FROM
    payments p WHERE p.invoice_id = i.id), 0)), 0) as outstanding FROM clients c LEFT 
    JOIN invoices i ON c.id = i.client_id${whereClause} GROUP BY c.id, c.name HAVING 
    COUNT(i.id) > 0 ORDER BY outstanding DESC LIMIT 3`, params: queryParams });
    const topClientsQuery = `
      SELECT
        c.id,
        c.name,
        COUNT(i.id) as total_invoices,
        COALESCE(SUM(i.total - COALESCE((
          SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id
        ), 0)), 0) as outstanding
      FROM clients c
      LEFT JOIN invoices i ON c.id = i.client_id
      ${whereClause}
      GROUP BY c.id, c.name
      HAVING COUNT(i.id) > 0
      ORDER BY outstanding DESC
      LIMIT 3
    `;
    const topClients = await pool.query(topClientsQuery, queryParams);

    // Update Overdue statuses
    console.log('Running overdueUpdate:', { query: `UPDATE invoices SET status = 
    'Overdue' WHERE status = 'Sent' AND due_date < CURRENT_DATE${whereClause}`, 
    params: queryParams });
    const overdueUpdate = `
      UPDATE invoices
      SET status = 'Overdue'
      WHERE status = 'Sent'
      AND due_date < CURRENT_DATE
      ${whereClause}
    `;
    await pool.query(overdueUpdate, queryParams);

    res.json({
      stats: {
        totalInvoices: parseInt(totalInvoices.rows[0].count),
        totalReceived: parseFloat(totalReceived.rows[0].total).toFixed(2),
        outstanding: parseFloat(outstanding.rows[0].total).toFixed(2),
        upcomingDue: parseInt(upcomingDue.rows[0].count),
      },
      recentActivity: recentActivity.rows,
      topClients: topClients.rows,
    });
  } catch (err) {
    console.log('Error in api/dashboard:', err.stack);
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

module.exports = router;