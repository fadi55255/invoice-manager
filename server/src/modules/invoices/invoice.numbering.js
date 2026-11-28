// Must be called with the same client (transaction) that inserts the invoice.
export async function nextInvoiceNumber(client, direction, issueDate) {
  const prefix = direction === 'achat' ? 'PUR' : 'INV';
  const year = Number(issueDate.slice(0, 4));

  // One atomic statement: it locks the counter row until COMMIT,
  // so two simultaneous requests can never get the same number.
  const { rows } = await client.query(
    `INSERT INTO invoice_counters (prefix, year, last_number)
     VALUES ($1, $2, 1)
     ON CONFLICT (prefix, year)
     DO UPDATE SET last_number = invoice_counters.last_number + 1
     RETURNING last_number`,
    [prefix, year]
  );

  return `${prefix}-${year}-${String(rows[0].last_number).padStart(4, '0')}`;
}