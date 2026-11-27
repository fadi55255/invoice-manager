import express from 'express';
import cors from 'cors';
import { contactsRouter } from './modules/contacts/contacts.routes.js';
import { invoicesRouter } from './modules/invoices/invoices.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// 1. Global middleware (always before routes)
app.use(
  cors({
    origin: process.env.CLIENT_URL || process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// 2. Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/contacts', contactsRouter);
app.use('/api/invoices', invoicesRouter);

// 3. Error handlers (always after all routes)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;