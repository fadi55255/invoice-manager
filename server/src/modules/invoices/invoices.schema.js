import { z } from 'zod';
import { INVOICE_STATUSES } from '../../shared/invoiceStatuses.js';
import { AppError } from '../../shared/errors.js';

const STATUS_ALIASES = {
  draft: 'draft',
  brouillon: 'draft',
  sent: 'sent',
  envoyee: 'sent',
  partially_paid: 'partially_paid',
  paid: 'paid',
  payee: 'paid',
  overdue: 'overdue',
  en_retard: 'overdue',
  void: 'void',
  cancelled: 'void',
  annulee: 'void',
};

function parseStatusList(raw) {
  if (!raw || raw.trim().toLowerCase() === 'all') return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  const normalized = [];
  for (const part of parts) {
    const mapped = STATUS_ALIASES[part];
    if (!mapped) {
      throw new AppError(
        400,
        `Statut invalide "${part}". Statuts autorisés : ${INVOICE_STATUSES.join(', ')}.`,
        'VALIDATION_ERROR',
        { status: `Statut invalide "${part}".` }
      );
    }
    if (!normalized.includes(mapped)) {
      normalized.push(mapped);
    }
  }
  return normalized.length > 0 ? normalized : undefined;
}

const DIRECTION_ALIASES = {
  vente: 'vente',
  ventes: 'vente',
  sales: 'vente',
  sale: 'vente',
  achat: 'achat',
  achats: 'achat',
  purchase: 'achat',
  purchases: 'achat',
};

export const invoiceIdParamSchema = z.object({
  id: z.string().uuid('Identifiant de facture invalide.'),
});

export const listInvoicesQuerySchema = z
  .object({
    status: z.string().optional(),
    direction: z.string().optional(),
    category: z.string().optional(),
    contactId: z.string().uuid('contactId invalide.').optional(),
    q: z.string().trim().optional(),
    search: z.string().trim().optional(),
    dateFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateFrom doit être au format YYYY-MM-DD.')
      .optional(),
    dateTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'dateTo doit être au format YYYY-MM-DD.')
      .optional(),
    period: z
      .enum(['all', 'this_month', 'last_month', 'quarter'])
      .optional()
      .default('all'),
    sortBy: z
      .enum(['createdAt', 'dueDate', 'total', 'number'])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  })
  .transform((raw) => {
    const statuses = parseStatusList(raw.status);
    const rawDir = (raw.direction || raw.category || '').trim().toLowerCase();
    let direction;
    if (rawDir && rawDir !== 'all' && rawDir !== 'toutes') {
      direction = DIRECTION_ALIASES[rawDir];
      if (!direction) {
        throw new AppError(
          400,
          'Direction invalide. Utilisez "vente" (sales) ou "achat" (purchase).',
          'VALIDATION_ERROR',
          { direction: 'Direction invalide.' }
        );
      }
    }

    return {
      statuses,
      direction,
      contactId: raw.contactId,
      q: raw.q || raw.search || undefined,
      dateFrom: raw.dateFrom,
      dateTo: raw.dateTo,
      period: raw.period,
      sortBy: raw.sortBy,
      sortOrder: raw.sortOrder,
      page: raw.page,
      limit: raw.limit,
    };
  });
