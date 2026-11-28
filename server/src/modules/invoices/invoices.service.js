import { INVOICE_STATUS_METADATA } from '../../shared/invoiceStatuses.js';
import { AppError } from '../../shared/errors.js';
import { invoicesRepository } from './invoices.repository.js';
import { validateInvoice } from './invoice.validation.js';
import { computeInvoice } from './invoice.calculations.js';
import { logActivity } from '../activity-logs/activityLog.js';

export const invoicesService = {
  async createInvoice(body, user) {
    const { errors, isValid } = validateInvoice(body);
    if (!isValid) {
      throw new AppError(400, 'Certains champs sont invalides.', 'VALIDATION_ERROR', errors);
    }

    // Totals are always recalculated here; totals sent by the browser are ignored.
    const { subtotal, tax, total } = computeInvoice(body.items);

    const created = await invoicesRepository.createDraft(
      { ...body, notes: (body.notes || '').trim(), subtotal, tax, total },
      user.id
    );
    if (!created) {
      throw new AppError(400, 'Certains champs sont invalides.', 'VALIDATION_ERROR', {
        contactId: 'Contact introuvable ou inadapté.',
      });
    }

    await logActivity({
      entityType: 'invoice',
      entityId: created.id,
      action: 'created',
      actor: user,
      metadata: { number: created.number, total },
    });

    return invoicesRepository.findByIdWithDetails(created.id);
  },

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