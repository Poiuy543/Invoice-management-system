Invoice Management System

A web application for managing invoices, clients, and payments, with role-based access for admins and accountants. Features a dashboard displaying key metrics, recent activity, and top clients by outstanding amounts.


FOLDER STRUCTURE
invoice_management_system/
├── client/               # React frontend
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── package.json
│   
├── server/              # Node.js/Express backend
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── server.js
│   ├── package.json
│   └── .env
├── database/            # Database schema
│   ├── schema.sql
│   
├── README.md
└── .gitignore


SETUP INSTRUCTIONS
Prerequisites
-> Node.js 
-> PostgreSQL 
-> Git

Database Setup
1. Install PostgreSQL
2. Create a database: invoice_management_system

Backend Setup
1. Navigate to the server directory: cd server
2. Install dependencies: npm install
3. Create a .env file in server/
4. Start the server: node server.js
   Server runs on http://localhost:5000

Frontend Setup
1. Navigate to the client directory: cd client
2. Install dependencies: npm install
3. Start the frontend: npm run dev
    Frontend runs on http://localhost:5173


Tech Stack
-> Frontend
    - React
    - React Router
    - Bootstrap
    - Vite
-> Backend
    - Node.js
    - Express
    - PostgreSql
    - jsonwebtoken (JWT authentication)
    - bcryptjs (password hashing)
-> Database
    - PostgreSQL with tables: users, clients, invoices, invoice_items, payments
-> Tools:
    - Git (version Control)
    - Postman (API testing)

API Documentation
Dashboard:
-> GET /api/dashboard
    - Headers: Authentication: Bearer <JWT_TOKEN>
    - Description: Returns dashboard data (stats, recent activity, top clients)

Clients:
-> GET /api/clients: List all clients
-> POST /api/clients: Create a client
-> PUT /api/clients/:id: Update a client
-> DELETE /api/clients/:id: Delete a client

Invoices:
-> GET /api/invoices: List all invoices
-> POST /api/invoices: Create an invoice
-> PUT /api/invoices/:id: Update an invoice
-> DELETE /api/invoices/:id: Delete an invoice

Payments:
-> GET /api/payments: List all payments
-> POST /api/payments: Create a payment

Known Limitations and Areas for Improvement
-> Error Handling: Backend error responses could be more specific (e.g., Validation errors)
-> Features: Missing PDF invoice generation, email notifications, and advanced filtering
-> UI/Ux: Dashboard could include charts(e.g., Chart.js) for better visualizsation

