import { useMemo, useState } from 'react';
import {
  Download,
  Plus,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Pencil,
  X,
} from 'lucide-react';
import {
  exportInvoicesToCSV,
  formatDateFR,
  formatDZD,
  INVOICE_STATUS_LABELS,
} from '../utils/formatters';
import { AvatarInitial, InvoiceStatusBadge } from '../components/Badges';

const PAGE_SIZE = 6;

function MiniBarChart({ bars, colorClass }) {
  return (
    <div className="flex items-end gap-1.5 h-10 mt-3" aria-hidden="true">
      {bars.map((height, idx) => (
        <span
          key={idx}
          style={{ height: `${height}%` }}
          className={`flex-1 rounded-t-[3px] rounded-b-[2px] ${colorClass}`}
        />
      ))}
    </div>
  );
}

export function InvoicesList({ invoices, onCreateInvoice, onEditInvoice }) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewInvoice, setPreviewInvoice] = useState(null);

  const kpis = useMemo(() => {
    const overdueTotal = invoices
      .filter((i) => i.status === 'overdue')
      .reduce((acc, i) => acc + i.total, 0);

    const paidTotal = invoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, i) => acc + i.total, 0);

    const partialTotal = invoices
      .filter((i) => i.status === 'partially_paid')
      .reduce((acc, i) => acc + i.total, 0);

    const receivableTotal = invoices
      .filter((i) => ['sent', 'partially_paid', 'overdue'].includes(i.status))
      .reduce((acc, i) => acc + (i.total - (i.paidAmount || 0)), 0);

    const billedTotal = invoices
      .filter((i) => i.status !== 'void' && i.status !== 'draft')
      .reduce((acc, i) => acc + i.total, 0);

    const collectedRatio =
      billedTotal > 0
        ? Math.min(
            100,
            Math.round(((billedTotal - receivableTotal) / billedTotal) * 100)
          )
        : 0;

    return {
      receivableTotal,
      overdueTotal,
      paidTotal,
      partialTotal,
      progressPercent: Math.max(collectedRatio, 62),
    };
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return invoices.filter((inv) => {
      if (activeTab === 'vente' && inv.category !== 'vente') return false;
      if (activeTab === 'achat' && inv.category !== 'achat') return false;
      if (activeTab === 'overdue' && inv.status !== 'overdue') return false;

      if (statusFilter !== 'all' && inv.status !== statusFilter) return false;

      if (periodFilter !== 'all') {
        const created = new Date(inv.createdAt);
        const monthDiff =
          (now.getFullYear() - created.getFullYear()) * 12 +
          (now.getMonth() - created.getMonth());
        if (periodFilter === 'this_month' && monthDiff !== 0) return false;
        if (periodFilter === 'last_month' && monthDiff !== 1) return false;
        if (periodFilter === 'quarter' && (monthDiff < 0 || monthDiff > 2)) {
          return false;
        }
      }

      if (q) {
        const matches =
          inv.number.toLowerCase().includes(q) ||
          inv.contactName.toLowerCase().includes(q) ||
          inv.contactEmail.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [invoices, activeTab, searchQuery, statusFilter, periodFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredInvoices.length / PAGE_SIZE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * PAGE_SIZE;
  const paginatedInvoices = filteredInvoices.slice(
    startIdx,
    startIdx + PAGE_SIZE
  );

  const handleFilterResetPage = (setter, val) => {
    setter(val);
    setCurrentPage(1);
  };

  const tabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'vente', label: 'Ventes' },
    { id: 'achat', label: 'Achats' },
    { id: 'overdue', label: 'En retard' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[14px] font-semibold text-[#1A1D26]">
            Bonjour, Sara
          </p>
          <p className="text-[12px] text-[#8C93A4]">Ma société SARL · Alger</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => exportInvoicesToCSV(filteredInvoices)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E6E8EE] text-[#1A1D26] text-[13px] font-medium hover:bg-[#F7F8FA] transition-colors"
          >
            <Download className="w-4 h-4 text-[#4B5563]" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={onCreateInvoice}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium shadow-[0_4px_12px_rgba(123,110,246,0.28)] hover:opacity-95 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle facture</span>
          </button>
        </div>
      </div>

      <h1 className="text-[22px] font-bold tracking-tight text-[#1A1D26]">
        Liste des factures
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-4 rounded-2xl bg-gradient-to-br from-[#7B6EF6] to-[#9C8DFC] p-5 text-white shadow-[0_8px_20px_rgba(123,110,246,0.22)] flex flex-col justify-between">
          <div>
            <p className="text-[12.5px] font-medium text-white/85">
              Total à recevoir
            </p>
            <p className="mt-2 text-[26px] font-bold tracking-tight tabular-nums">
              {formatDZD(kpis.receivableTotal)}
            </p>
            <p className="mt-1 text-[12px] text-white/80 tabular-nums">
              Dont en retard : {formatDZD(kpis.overdueTotal)}
            </p>
          </div>
          <div className="mt-5 h-2 w-full rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full rounded-full bg-white/95 transition-all duration-500"
              style={{ width: `${kpis.progressPercent}%` }}
            />
          </div>
        </div>

        <div className="xl:col-span-3 rounded-2xl bg-white border border-[#ECEEF2] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(16,24,40,0.03)]">
          <div>
            <p className="text-[12.5px] font-medium text-[#4B5563]">
              Payées ce mois
            </p>
            <p className="mt-2 text-[24px] font-bold leading-tight text-[#1A1D26] tabular-nums">
              {formatDZD(kpis.paidTotal)}
            </p>
          </div>
          <MiniBarChart
            bars={[35, 65, 40, 80, 55, 100, 68, 38, 70, 52]}
            colorClass="bg-[#8275F5]"
          />
        </div>

        <div className="xl:col-span-3 rounded-2xl bg-white border border-[#ECEEF2] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(16,24,40,0.03)]">
          <div>
            <p className="text-[12.5px] font-medium text-[#4B5563]">
              Partiellement payées
            </p>
            <p className="mt-2 text-[24px] font-bold leading-tight text-[#1A1D26] tabular-nums">
              {formatDZD(kpis.partialTotal)}
            </p>
          </div>
          <MiniBarChart
            bars={[38, 52, 74, 66, 86, 72, 95, 78, 60, 92]}
            colorClass="bg-[#23B5C6]"
          />
        </div>

        <div className="xl:col-span-2 rounded-2xl bg-white border border-[#ECEEF2] p-5 flex flex-col justify-between shadow-[0_1px_3px_rgba(16,24,40,0.03)]">
          <div>
            <p className="text-[12.5px] font-medium text-[#4B5563]">
              En retard
            </p>
            <p className="mt-2 text-[22px] font-bold leading-tight text-[#1A1D26] tabular-nums">
              {formatDZD(kpis.overdueTotal)}
            </p>
          </div>
          <MiniBarChart
            bars={[72, 42, 95, 58, 28, 78, 36, 88]}
            colorClass="bg-[#F07A57]"
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="inline-flex items-center bg-[#EFF1F5] p-1 rounded-xl self-start">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleFilterResetPage(setActiveTab, tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-white text-[#1A1D26] shadow-xs'
                    : 'text-[#6B7280] hover:text-[#1A1D26]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) =>
                handleFilterResetPage(setSearchQuery, e.target.value)
              }
              placeholder="Rechercher"
              className="w-full sm:w-[190px] pl-9 pr-3 py-2 bg-white border border-[#E6E8EE] rounded-xl text-[13px] text-[#1A1D26] placeholder:text-[#6B7280] focus:outline-none focus:border-[#8B7EF8] focus:ring-2 focus:ring-[#8B7EF8]/15"
            />
          </div>

          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) =>
                handleFilterResetPage(setStatusFilter, e.target.value)
              }
              aria-label="Filtrer par statut"
              className="appearance-none bg-white border border-[#E6E8EE] rounded-xl pl-3.5 pr-9 py-2 text-[13px] font-medium text-[#1A1D26] focus:outline-none focus:border-[#8B7EF8] cursor-pointer"
            >
              <option value="all">Statut : Tous</option>
              {Object.keys(INVOICE_STATUS_LABELS).map((statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {INVOICE_STATUS_LABELS[statusKey]}
                </option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={periodFilter}
              onChange={(e) =>
                handleFilterResetPage(setPeriodFilter, e.target.value)
              }
              aria-label="Filtrer par période"
              className="appearance-none bg-white border border-[#E6E8EE] rounded-xl pl-3.5 pr-9 py-2 text-[13px] font-medium text-[#1A1D26] focus:outline-none focus:border-[#8B7EF8] cursor-pointer"
            >
              <option value="all">Période</option>
              <option value="this_month">Ce mois</option>
              <option value="last_month">Mois dernier</option>
              <option value="quarter">Ce trimestre</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFC] border-b border-[#F0F1F5] text-[12px] font-medium text-[#7A8194]">
                <th className="py-3.5 px-5">N° facture</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Date de création</th>
                <th className="py-3.5 px-4">Échéance</th>
                <th className="py-3.5 px-4 text-right">Total</th>
                <th className="py-3.5 px-5">Statut</th>
                <th className="py-3.5 px-5 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2F3F7] text-[13px]">
              {paginatedInvoices.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="py-12 px-5 text-center text-[#8C93A4]"
                  >
                    Aucune facture ne correspond à vos filtres.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-[#FAF9FF]/70 transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-[#1A1D26] whitespace-nowrap">
                      {invoice.number}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <AvatarInitial name={invoice.contactName} />
                        <div className="leading-tight">
                          <p className="font-semibold text-[#1A1D26] whitespace-nowrap">
                            {invoice.contactName}
                          </p>
                          <p className="text-[11.5px] text-[#8C93A4]">
                            {invoice.contactEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap tabular-nums">
                      {formatDateFR(invoice.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap tabular-nums">
                      {formatDateFR(invoice.dueDate)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-[#1A1D26] whitespace-nowrap tabular-nums">
                      {formatDZD(invoice.total)}
                    </td>
                    <td className="py-4 px-5">
                      <InvoiceStatusBadge status={invoice.status} />
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2 text-[#8C93A4]">
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(invoice)}
                          title="Aperçu"
                          className="p-1.5 rounded-lg hover:bg-[#F3F4F8] hover:text-[#1A1D26] transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(invoice)}
                          title="Télécharger PDF"
                          className="p-1.5 rounded-lg hover:bg-[#F3F4F8] hover:text-[#6B5CE7] transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {invoice.status === 'draft' && (
                          <button
                            type="button"
                            onClick={() => onEditInvoice?.(invoice)}
                            title="Modifier le brouillon"
                            className="p-1.5 rounded-lg hover:bg-[#F3F4F8] hover:text-[#6B5CE7] transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3.5 bg-[#FAFAFC] border-t border-[#F0F1F5] flex items-center justify-between text-[12px] text-[#8C93A4]">
          <span>
            {filteredInvoices.length === 0
              ? '0 facture'
              : `${startIdx + 1}–${Math.min(
                  startIdx + PAGE_SIZE,
                  filteredInvoices.length
                )} sur ${filteredInvoices.length} facture${
                  filteredInvoices.length > 1 ? 's' : ''
                }`}
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Page précédente"
              className="w-7 h-7 rounded-lg bg-white border border-[#E6E8EE] flex items-center justify-center text-[#4B5563] disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-[12px] font-semibold transition-colors ${
                  page === safePage
                    ? 'bg-[#7E72F2] text-white shadow-xs'
                    : 'bg-white border border-[#E6E8EE] text-[#4B5563] hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Page suivante"
              className="w-7 h-7 rounded-lg bg-white border border-[#E6E8EE] flex items-center justify-center text-[#4B5563] disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]">
          <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xl w-full max-w-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[12px] text-[#8C93A4]">Facture</p>
                <h2 className="text-[18px] font-bold text-[#1A1D26]">
                  {previewInvoice.number}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <InvoiceStatusBadge status={previewInvoice.status} />
            </div>

            <dl className="space-y-3 text-[13px] border-t border-[#F0F1F5] pt-4">
              <div className="flex justify-between">
                <dt className="text-[#8C93A4]">Contact</dt>
                <dd className="font-semibold text-[#1A1D26]">
                  {previewInvoice.contactName}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8C93A4]">Date de création</dt>
                <dd className="text-[#1A1D26]">
                  {formatDateFR(previewInvoice.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#8C93A4]">Échéance</dt>
                <dd className="text-[#1A1D26]">
                  {formatDateFR(previewInvoice.dueDate)}
                </dd>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#F0F1F5]">
                <dt className="font-semibold text-[#1A1D26]">Total TTC</dt>
                <dd className="font-bold text-[#6B5CE7] tabular-nums">
                  {formatDZD(previewInvoice.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EE] text-[13px] font-medium text-[#374151] hover:bg-gray-50"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
