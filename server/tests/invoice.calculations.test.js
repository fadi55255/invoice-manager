import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeInvoice } from '../src/modules/invoices/invoice.calculations.js';

test('computes line and invoice totals with 2-decimal rounding', () => {
  const result = computeInvoice([
    { quantity: 3, unitPrice: 33.35, taxRate: 19 },
    { quantity: 1.5, unitPrice: 0.67, taxRate: 0 },
  ]);

  assert.equal(result.lines[0].lineSubtotal, 100.05);
  assert.equal(result.lines[0].lineTax, 19.01);
  assert.equal(result.lines[0].lineTotal, 119.06);
  assert.equal(result.lines[1].lineSubtotal, 1.01);

  assert.equal(result.subtotal, 101.06);
  assert.equal(result.tax, 19.01);
  assert.equal(result.total, 120.07);
});