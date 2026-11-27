# Invoice Manager

A full-stack web application for small businesses to create, send, and track customer sales invoices and supplier purchase invoices, complete with payment tracking, automated overdue reminders, and financial reporting.

## Features

- **Contact Management:** Create, edit, and archive customer and supplier records.
- **Sales & Purchase Invoices:** Generate sequential sales invoices (`INV-YYYY-NNNN`) and record supplier bills with multi-line items and automatic tax calculations.
- **Invoice Lifecycle:** Manage statuses (`Draft`, `Sent`, `Partially Paid`, `Paid`, `Overdue`, `Void`) with role-based controls.
- **PDF & Email Delivery:** Generate printable PDF invoices and email them directly to customers.
- **Payment Tracking:** Record full or partial payments with automatic balance updates.
- **Automated Reminders:** Daily scheduled job that detects overdue sales invoices and sends reminder emails.
- **Financial Dashboard & Reports:** Track receivables, payables, overdue balances, and monthly revenue, with filtering, CSV export, and an activity audit log.
- **Attachments:** Upload original supplier invoice files (PDF or image) to purchase records.

## User Roles

- **Admin:** Full system access, user management, and invoice void approval.
- **Accountant:** Day-to-day invoicing, contact management, payment recording, and reminders.
- **Viewer:** Read-only access to invoices, reports, and financial dashboards.

## Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, Axios
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Tools & Libraries:** JWT & `bcrypt` (Auth), `PDFKit` (PDF generation), `Nodemailer` / `Resend` (Email), `node-cron` (Scheduled tasks)

## Project Structure

```text
SE-project/
├── client/                         # React + Vite frontend
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── public/
│   └── src/
│       ├── api/                    # HTTP client & API wrappers
│       ├── components/             # Reusable UI components
│       ├── context/                # Auth & user session state
│       ├── pages/                  # Application views
│       ├── utils/                  # Formatting helpers
│       ├── App.jsx
│       ├── index.css
│       └── main.jsx
│
└── server/                         # Node.js + Express REST API
    ├── .env.example
    ├── package.json
    ├── prisma/                     # Database schema, migrations & seed script
    └── src/
        ├── index.js                # Server & scheduler entry point
        ├── app.js                  # Express app & route mounting
        ├── config/                 # Environment & database configuration
        ├── middleware/             # Auth, RBAC & error handling
        ├── modules/                # Feature modules (auth, users, contacts, invoices, payments, dashboard, activity-logs)
        ├── shared/                 # Shared services (pdf, email, storage)
        └── jobs/                   # Background cron jobs
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL (v14+)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd invoice-manager
   ```

2. **Configure and start the backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   ```
   Edit `server/.env` with your PostgreSQL connection string (`DATABASE_URL`), `JWT_SECRET`, and SMTP credentials, then run migrations and start the server:
   ```bash
   npx prisma migrate dev
   npm run dev
   ```

3. **Start the frontend**
   ```bash
   cd ../client
   npm install
   cp .env.example .env
   npm run dev
   ```

The application will be available at `http://localhost:5173`.