/**
 * Formats numbers to Algerian Dinar style: "428 450,00 DA"
 */
export function formatDZD(amount) {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${formatted.replace(/\u202f/g, ' ')} DA`;
}

/**
 * Formats ISO date "2026-11-24" to "24/11/2026"
 */
export function formatDateFR(isoDate) {
  if (!isoDate) return '—';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

export const INVOICE_STATUS_LABELS = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  partially_paid: 'Partiellement payée',
  paid: 'Payée',
  overdue: 'En retard',
  void: 'Annulée',
};

/**
 * Exports filtered invoices to a downloadable UTF-8 CSV file
 */
export function exportInvoicesToCSV(invoices) {
  const headers = [
    'N° facture',
    'Contact',
    'E-mail',
    'Catégorie',
    'Date de création',
    'Échéance',
    'Total (DA)',
    'Statut',
  ];

  const rows = invoices.map((inv) => [
    inv.number,
    inv.contactName,
    inv.contactEmail,
    inv.category === 'vente' ? 'Vente' : 'Achat',
    formatDateFR(inv.createdAt),
    formatDateFR(inv.dueDate),
    inv.total.toFixed(2).replace('.', ','),
    INVOICE_STATUS_LABELS[inv.status] || inv.status,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
      )
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `factures-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
