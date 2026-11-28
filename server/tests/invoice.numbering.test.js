import 'dotenv/config';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import pg from 'pg';
import { nextInvoiceNumber } from '../src/modules/invoices/invoice.numbering.js';

test('generates sequential numbers per prefix and year', async () => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query('BEGIN');
    assert.equal(await nextInvoiceNumber(client, 'vente', '2099-01-15'), 'INV-2099-0001');
    assert.equal(await nextInvoiceNumber(client, 'vente', '2099-03-20'), 'INV-2099-0002');
    assert.equal(await nextInvoiceNumber(client, 'achat', '2099-01-15'), 'PUR-2099-0001');
  } finally {
    await client.query('ROLLBACK'); // the test leaves nothing in the database
    await client.end();
  }
});