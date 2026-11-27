import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DEV_BYPASS_AUTH = 'true';

vi.mock('../src/modules/invoices/invoices.repository.js', () => ({
  invoicesRepository: {
    syncOverdueStatuses: vi.fn().mockResolvedValue(0),
    list: vi.fn(),
    findByIdWithDetails: vi.fn(),
  },
}));

import app from '../src/app.js';
import { invoicesRepository } from '../src/modules/invoices/invoices.repository.js';

describe('Invoices List API with Six Statuses (/api/invoices)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns metadata for all 6 canonical statuses (GET /api/invoices/statuses)', async () => {
    const res = await request(app)
      .get('/api/invoices/statuses')
      .set('x-dev-role', 'viewer');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(6);
    expect(res.body.data.map((s) => s.code)).toEqual([
      'draft',
      'sent',
      'partially_paid',
      'paid',
      'overdue',
      'void',
    ]);
  });

  it('lists invoices, syncs overdue, and maps cancelled alias to void', async () => {
    vi.mocked(invoicesRepository.list).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
      summary: {
        receivableTotal: 428450,
        payableTotal: 0,
        overdueTotal: 124750,
        paidThisMonth: 38400,
        partiallyPaidTotal: 96000,
        statusCounts: {
          draft: 1,
          sent: 1,
          partially_paid: 1,
          paid: 1,
          overdue: 1,
          void: 1,
        },
      },
    });

    const res = await request(app)
      .get('/api/invoices?status=overdue,cancelled&direction=sales')
      .set('x-dev-role', 'viewer');

    expect(res.status).toBe(200);
    expect(invoicesRepository.syncOverdueStatuses).toHaveBeenCalledTimes(1);
    expect(invoicesRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({
        statuses: ['overdue', 'void'],
        direction: 'vente',
      })
    );
    expect(res.body.summary.statusCounts).toHaveProperty('void', 1);
  });

  it('rejects unknown status values with 400', async () => {
    const res = await request(app)
      .get('/api/invoices?status=unknown_state')
      .set('x-dev-role', 'admin');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
