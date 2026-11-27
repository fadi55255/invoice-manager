import { query } from '../../config/pool.js';
import { INVOICE_STATUS_METADATA } from '../../shared/invoiceStatuses.js';

function toIsoDate(val) {
  if (val instanceof Date) return val.toISOString().slice(0, 10);
  return String(val).slice(0, 10);
}

function mapInvoiceRow(row) {
  return {
    id: row.id,
    number: row.number,
    contactId: row.contact_id,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    category: row.direction,
    createdAt: toIsoDate(row.issue_date),
    dueDate: toIsoDate(row.due_date),
    subtotal: Number(row.subtotal),
    taxTotal: Number(row.tax_total),
    total: Number(row.total),
    paidAmount: Number(row.paid_amount),
    balance: Number(row.balance),
    status: row.status,
    statusLabel: INVOICE_STATUS_METADATA[row.status]?.labelFr || row.status,
    voidReason: row.void_reason,
  };
}

const SORT_COLUMNS = {
  createdAt: 'i.issue_date',
  dueDate: 'i.due_date',
  total: 'i.total',
  number: 'i.number',
};

export const invoicesRepository = {
  async syncOverdueStatuses() {
    const result = await query(
      `UPDATE invoices
       SET status = 'overdue'
       WHERE status IN ('sent', 'partially_paid')
         AND due_date < CURRENT_DATE
         AND balance > 0`
    );
    return result.rowCount ?? 0;
  },

  async list(filters) {
    const conditions = [];
    const params = [];

    if (filters.statuses && filters.statuses.length > 0) {
      params.push(filters.statuses);
      conditions.push(`i.status = ANY($${params.length}::text[])`);
    }

    if (filters.direction) {
      params.push(filters.direction);
      conditions.push(`i.direction = $${params.length}`);
    }

    if (filters.contactId) {
      params.push(filters.contactId);
      conditions.push(`i.contact_id = $${params.length}`);
    }

    if (filters.q) {
      params.push(`%${filters.q}%`);
      const p = `$${params.length}`;
      conditions.push(
        `(i.number ILIKE ${p} OR c.name ILIKE ${p} OR c.email ILIKE ${p})`
      );
    }

    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      conditions.push(`i.issue_date >= $${params.length}::date`);
    }

    if (filters.dateTo) {
      params.push(filters.dateTo);
      conditions.push(`i.issue_date <= $${params.length}::date`);
    }

    if (filters.period === 'this_month') {
      conditions.push(
        `date_trunc('month', i.issue_date) = date_trunc('month', CURRENT_DATE)`
      );
    } else if (filters.period === 'last_month') {
      conditions.push(
        `date_trunc('month', i.issue_date) = date_trunc('month', CURRENT_DATE - INTERVAL '1 month')`
      );
    } else if (filters.period === 'quarter') {
      conditions.push(`i.issue_date >= CURRENT_DATE - INTERVAL '3 months'`);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*)::text AS total
       FROM invoices i
       JOIN contacts c ON c.id = i.contact_id
       ${whereClause}`,
      params
    );
    const total = Number(countRes.rows[0]?.total ?? 0);

    const sortCol = SORT_COLUMNS[filters.sortBy] || 'i.issue_date';
    const sortDir = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
    const offset = (filters.page - 1) * filters.limit;

    const listParams = [...params, filters.limit, offset];
    const limitParam = `$${params.length + 1}`;
    const offsetParam = `$${params.length + 2}`;

    const rowsRes = await query(
      `SELECT
         i.id,
         i.number,
         i.contact_id,
         c.name AS contact_name,
         c.email AS contact_email,
         i.direction,
         i.issue_date,
         i.due_date,
         i.subtotal,
         i.tax_total,
         i.total,
         i.paid_amount,
         i.balance,
         i.status,
         i.void_reason
       FROM invoices i
       JOIN contacts c ON c.id = i.contact_id
       ${whereClause}
       ORDER BY ${sortCol} ${sortDir}, i.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      listParams
    );

    const summaryRes = await query(
      `SELECT
         COALESCE(SUM(balance) FILTER (WHERE direction = 'vente' AND status IN ('sent', 'partially_paid', 'overdue')), 0)::text AS receivable_total,
         COALESCE(SUM(balance) FILTER (WHERE direction = 'achat' AND status IN ('sent', 'partially_paid', 'overdue')), 0)::text AS payable_total,
         COALESCE(SUM(balance) FILTER (WHERE status = 'overdue'), 0)::text AS overdue_total,
         COALESCE(SUM(total)   FILTER (WHERE status = 'paid' AND date_trunc('month', issue_date) = date_trunc('month', CURRENT_DATE)), 0)::text AS paid_this_month,
         COALESCE(SUM(total)   FILTER (WHERE status = 'partially_paid'), 0)::text AS partially_paid_total,
         COUNT(*) FILTER (WHERE status = 'draft')::text          AS draft_count,
         COUNT(*) FILTER (WHERE status = 'sent')::text           AS sent_count,
         COUNT(*) FILTER (WHERE status = 'partially_paid')::text AS partially_paid_count,
         COUNT(*) FILTER (WHERE status = 'paid')::text           AS paid_count,
         COUNT(*) FILTER (WHERE status = 'overdue')::text        AS overdue_count,
         COUNT(*) FILTER (WHERE status = 'void')::text           AS void_count
       FROM invoices`
    );

    const s = summaryRes.rows[0];

    return {
      data: rowsRes.rows.map(mapInvoiceRow),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / filters.limit)),
      },
      summary: {
        receivableTotal: Number(s?.receivable_total ?? 0),
        payableTotal: Number(s?.payable_total ?? 0),
        overdueTotal: Number(s?.overdue_total ?? 0),
        paidThisMonth: Number(s?.paid_this_month ?? 0),
        partiallyPaidTotal: Number(s?.partially_paid_total ?? 0),
        statusCounts: {
          draft: Number(s?.draft_count ?? 0),
          sent: Number(s?.sent_count ?? 0),
          partially_paid: Number(s?.partially_paid_count ?? 0),
          paid: Number(s?.paid_count ?? 0),
          overdue: Number(s?.overdue_count ?? 0),
          void: Number(s?.void_count ?? 0),
        },
      },
    };
  },

  async findByIdWithDetails(id) {
    const invRes = await query(
      `SELECT
         i.id, i.number, i.contact_id, c.name AS contact_name, c.email AS contact_email,
         i.direction, i.issue_date, i.due_date, i.subtotal, i.tax_total, i.total,
         i.paid_amount, i.balance, i.status, i.void_reason
       FROM invoices i
       JOIN contacts c ON c.id = i.contact_id
       WHERE i.id = $1`,
      [id]
    );
    if (!invRes.rows[0]) return null;

    const [itemsRes, paymentsRes] = await Promise.all([
      query(
        `SELECT id, description, quantity, unit_price, tax_rate, line_total, line_tax
         FROM invoice_items
         WHERE invoice_id = $1
         ORDER BY sort_order ASC`,
        [id]
      ),
      query(
        `SELECT id, amount, payment_date, method, reference, notes, created_at
         FROM payments
         WHERE invoice_id = $1
         ORDER BY payment_date DESC, created_at DESC`,
        [id]
      ),
    ]);

    return {
      ...mapInvoiceRow(invRes.rows[0]),
      items: itemsRes.rows.map((r) => ({
        id: r.id,
        description: r.description,
        quantity: Number(r.quantity),
        unitPrice: Number(r.unit_price),
        taxRate: Number(r.tax_rate),
        lineTotal: Number(r.line_total),
        lineTax: Number(r.line_tax),
      })),
      payments: paymentsRes.rows.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: toIsoDate(p.payment_date),
        method: p.method,
        reference: p.reference,
        notes: p.notes,
      })),
    };
  },
};
