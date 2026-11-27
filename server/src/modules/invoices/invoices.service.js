import { INVOICE_STATUS_METADATA } from '../../shared/invoiceStatuses.js';
import { AppError } from '../../shared/errors.js';
import { invoicesRepository } from './invoices.repository.js';

export const invoicesService = {
  async listInvoices(filters) {
    await invoicesRepository.syncOverdueStatuses();
    return invoicesRepository.list(filters);
  },

  async getInvoiceById(id) {
    await invoicesRepository.syncOverdueStatuses();
    const invoice = await invoicesRepository.findByIdWithDetails(id);
    if (!invoice) {
      throw new AppError(404, 'Facture introuvable.', 'INVOICE_NOT_FOUND');
    }
    return invoice;
  },

  getStatusesMetadata() {
    return Object.values(INVOICE_STATUS_METADATA);
  },

  buildCsvExport(invoices) {
    const headers = [
      'N° facture',
      'Contact',
      'E-mail',
      'Catégorie',
      'Date de création',
      'Échéance',
      'Total (DA)',
      'Payé (DA)',
      'Solde (DA)',
      'Statut',
    ];

    const rows = invoices.map((inv) => [
      inv.number,
      inv.contactName,
      inv.contactEmail,
      inv.category === 'vente' ? 'Vente' : 'Achat',
      inv.createdAt,
      inv.dueDate,
      inv.total.toFixed(2).replace('.', ','),
      inv.paidAmount.toFixed(2).replace('.', ','),
      inv.balance.toFixed(2).replace('.', ','),
      inv.statusLabel,
    ]);

    return (
      '\uFEFF' +
      [headers, ...rows]
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(';')
        )
        .join('\n')
    );
  },
};
