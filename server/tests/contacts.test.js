import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

process.env.NODE_ENV = 'test';
process.env.DEV_BYPASS_AUTH = 'true';

vi.mock('../src/modules/activity-logs/activityLog.js', () => ({
  logActivity: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../src/modules/contacts/contacts.repository.js', () => ({
  contactsRepository: {
    list: vi.fn(),
    findById: vi.fn(),
    findActiveByEmail: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    setArchived: vi.fn(),
  },
}));

import app from '../src/app.js';
import { contactsRepository } from '../src/modules/contacts/contacts.repository.js';

const SAMPLE_UUID = '11111111-1111-4111-8111-111111111101';

const sampleContact = {
  id: SAMPLE_UUID,
  type: 'client',
  name: 'Boulangerie El Amel',
  email: 'client1@example.dz',
  phone: '0555 12 34 56',
  nif: '001216098765432',
  address: '14 Rue Didouche Mourad',
  city: 'Alger',
  postalCode: '16000',
  invoiceCount: 3,
  archived: false,
  archivedAt: null,
  createdAt: '2026-11-01T10:00:00.000Z',
  updatedAt: '2026-11-01T10:00:00.000Z',
};

describe('Contacts API (/api/contacts)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a contact when payload is valid (POST /api/contacts)', async () => {
    vi.mocked(contactsRepository.findActiveByEmail).mockResolvedValue(null);
    vi.mocked(contactsRepository.create).mockResolvedValue(sampleContact);

    const res = await request(app)
      .post('/api/contacts')
      .set('x-dev-role', 'accountant')
      .send({
        type: 'client',
        name: 'Boulangerie El Amel',
        email: 'client1@example.dz',
        phone: '0555 12 34 56',
        city: 'Alger',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Boulangerie El Amel');
    expect(contactsRepository.create).toHaveBeenCalledTimes(1);
  });

  it('rejects contact creation when required name is missing', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('x-dev-role', 'admin')
      .send({
        type: 'client',
        name: '',
        email: 'client1@example.dz',
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details.name).toBe('Le nom est obligatoire.');
  });

  it('forbids viewer role from creating a contact (FR-02)', async () => {
    const res = await request(app)
      .post('/api/contacts')
      .set('x-dev-role', 'viewer')
      .send({
        type: 'client',
        name: 'Test SARL',
        email: 'test@example.dz',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('edits an existing contact (PATCH /api/contacts/:id)', async () => {
    vi.mocked(contactsRepository.findById).mockResolvedValue(sampleContact);
    vi.mocked(contactsRepository.update).mockResolvedValue({
      ...sampleContact,
      city: 'Oran',
    });

    const res = await request(app)
      .patch(`/api/contacts/${SAMPLE_UUID}`)
      .set('x-dev-role', 'accountant')
      .send({ city: 'Oran' });

    expect(res.status).toBe(200);
    expect(res.body.data.city).toBe('Oran');
  });

  it('returns 409 when creating a duplicate active email', async () => {
    vi.mocked(contactsRepository.findActiveByEmail).mockResolvedValue({
      id: SAMPLE_UUID,
    });

    const res = await request(app)
      .post('/api/contacts')
      .set('x-dev-role', 'admin')
      .send({
        type: 'client',
        name: 'Duplicate',
        email: 'client1@example.dz',
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DUPLICATE_EMAIL');
  });
});
