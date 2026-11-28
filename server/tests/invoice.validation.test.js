import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateInvoice } from '../src/modules/invoices/invoice.validation.js';

const valid = {
  direction: 'vente',
  contactId: '11111111-1111-4111-8111-111111111111',
  issueDate: '2026-11-28',
  dueDate: '2026-12-28',
  items: [{ description: 'Service', quantity: 3, unitPrice: 33.35, taxRate: 19 }],
};

test('accepts a valid invoice', () => {
  assert.equal(validateInvoice(valid).isValid, true);
});

test('rejects bad data with an error for each field', () => {
  const { isValid, errors } = validateInvoice({
    ...valid,
    contactId: '',
    issueDate: '2026-02-30',
    items: [{ description: ' ', quantity: 0, unitPrice: -1, taxRate: 120 }],
  });

  assert.equal(isValid, false);
  for (const field of ['contactId', 'issueDate', 'items.0.description',
    'items.0.quantity', 'items.0.unitPrice', 'items.0.taxRate']) {
    assert.ok(errors[field], `missing error for ${field}`);
  }
});

test('rejects a due date before the issue date', () => {
  assert.ok(validateInvoice({ ...valid, dueDate: '2026-11-01' }).errors.dueDate);
});

test('rejects an empty request', () => {
  assert.equal(validateInvoice(undefined).isValid, false);
});