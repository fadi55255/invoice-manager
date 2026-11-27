import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import {
  invoiceIdParamSchema,
  listInvoicesQuerySchema,
} from './invoices.schema.js';
import { invoicesService } from './invoices.service.js';

export const invoicesRouter = Router();

invoicesRouter.use(authenticate);

invoicesRouter.get(
  '/statuses',
  requireRole('admin', 'accountant', 'viewer'),
  (_req, res) => {
    res.json({ data: invoicesService.getStatusesMetadata() });
  }
);

invoicesRouter.get(
  '/export',
  requireRole('admin', 'accountant', 'viewer'),
  async (req, res, next) => {
    try {
      const filters = listInvoicesQuerySchema.parse({
        ...req.query,
        page: 1,
        limit: 100,
      });
      const result = await invoicesService.listInvoices(filters);
      const csv = invoicesService.buildCsvExport(result.data);

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="factures-${new Date().toISOString().slice(0, 10)}.csv"`
      );
      res.send(csv);
    } catch (err) {
      next(err);
    }
  }
);

invoicesRouter.get(
  '/',
  requireRole('admin', 'accountant', 'viewer'),
  async (req, res, next) => {
    try {
      const filters = listInvoicesQuerySchema.parse(req.query);
      const result = await invoicesService.listInvoices(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

invoicesRouter.get(
  '/:id',
  requireRole('admin', 'accountant', 'viewer'),
  async (req, res, next) => {
    try {
      const { id } = invoiceIdParamSchema.parse(req.params);
      const invoice = await invoicesService.getInvoiceById(id);
      res.json({ data: invoice });
    } catch (err) {
      next(err);
    }
  }
);
