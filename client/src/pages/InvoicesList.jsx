import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CheckCircle2,
  Download,
  Plus,
  Search,
  Send,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  exportInvoicesToCSV,
  formatDateFR,
  formatDZD,
  INVOICE_STATUS_LABELS,
} from '../utils/formatters';
import { AvatarInitial, InvoiceStatusBadge } from '../components/Badges';

const PAGE_SIZE = 8; // pagination only appears above this many invoices
const VAT_RATES = [0, 9, 19];
const DEFAULT_VAT_RATE = 19;
const DEFAULT_DUE_DAYS = 30;
const TOAST_DURATION_MS = 3500;
const HIDE_SCROLLBAR =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden';
const COUNTER_STORAGE_KEY = 'invoice-manager:number-counters';
const INVOICES_STORAGE_KEY = 'invoice-manager:local-invoices';

/* ------------------------------------------------------------------ */
/*  Pure helpers: calculations, numbering, validation                  */
/* ------------------------------------------------------------------ */

/** Round to exactly 2 decimals (avoids 1.005 -> 1 floating-point issues). */
const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const toNumber = (value) => {
  const n = parseFloat(String(value ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const isBlank = (value) => String(value ?? '').trim() === '';
const isValidNumber = (value) =>
  !isBlank(value) && Number.isFinite(parseFloat(String(value).replace(',', '.')));

const toISODate = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;

const addDaysISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return toISODate(d);
};

const isValidISODate = (value) =>
  /^\d{4}-\d{2}-\d{2}$/.test(value || '') && !Number.isNaN(new Date(value).getTime());

/**
 * Line + invoice calculations (all rounded to 2 decimals)
 *  line subtotal = quantity x unit price
 *  line tax      = line subtotal x tax rate / 100
 *  invoice total = subtotal + tax
 */
function computeLine(item) {
  const quantity = toNumber(item.quantity);
  const unitPrice = toNumber(item.unitPrice);
  const taxRate = toNumber(item.taxRate);
  const subtotal = round2(quantity * unitPrice);
  const tax = round2((subtotal * taxRate) / 100);
  return { subtotal, tax, total: round2(subtotal + tax) };
}

function computeTotals(items) {
  const lines = items.map(computeLine);
  const subtotal = round2(lines.reduce((acc, l) => acc + l.subtotal, 0));
  const tax = round2(lines.reduce((acc, l) => acc + l.tax, 0));
  return { subtotal, tax, total: round2(subtotal + tax) };
}

/** Invoice numbers: INV-YYYY-NNNN (sales) / PUR-YYYY-NNNN (purchases). */
const getPrefix = (type) => (type === 'purchase' ? 'PUR' : 'INV');

const getInvoiceType = (invoice) =>
  invoice.type ?? (invoice.category === 'achat' ? 'purchase' : 'sales');

/** "Annulée" and "Archivée" are the same thing: the invoice leaves the main list. */
const isArchived = (invoice) => Boolean(invoice.archived) || invoice.status === 'void';

function readCounters() {
  try {
    return JSON.parse(localStorage.getItem(COUNTER_STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function writeCounters(counters) {
  try {
    localStorage.setItem(COUNTER_STORAGE_KEY, JSON.stringify(counters));
  } catch {
    /* storage unavailable: numbering still works from existing invoices */
  }
}

/**
 * Next sequence = max(highest number already used, last number ever issued) + 1.
 * The "last issued" counter is stored separately so a number is never reused,
 * even if an invoice is later removed from the list.
 */
function getNextSequence(prefix, year, invoices) {
  const counters = readCounters();
  const re = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  const maxExisting = invoices.reduce((max, inv) => {
    const match = re.exec(inv.number || '');
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);
  return Math.max(counters[`${prefix}-${year}`] || 0, maxExisting) + 1;
}

const formatInvoiceNumber = (prefix, year, seq) =>
  `${prefix}-${year}-${String(seq).padStart(4, '0')}`;

function reserveInvoiceNumber(prefix, year, invoices) {
  const seq = getNextSequence(prefix, year, invoices);
  writeCounters({ ...readCounters(), [`${prefix}-${year}`]: seq });
  return formatInvoiceNumber(prefix, year, seq);
}

/** Validates the whole invoice before it can be saved. */
function validateInvoiceDraft({ type, contactId, issueDate, dueDate, items }) {
  const errors = { contactId: '', issueDate: '', dueDate: '', total: '', lines: {} };

  if (!contactId) {
    errors.contactId =
      type === 'purchase' ? 'Sélectionnez un fournisseur.' : 'Sélectionnez un client.';
  }

  if (!isValidISODate(issueDate)) {
    errors.issueDate = "La date d'émission est obligatoire.";
  }

  if (!isValidISODate(dueDate)) {
    errors.dueDate = "La date d'échéance est obligatoire.";
  } else if (isValidISODate(issueDate) && dueDate < issueDate) {
    errors.dueDate = "L'échéance ne peut pas précéder la date d'émission.";
  }

  items.forEach((item) => {
    const lineErrors = {};

    if (isBlank(item.description)) {
      lineErrors.description = 'La désignation est obligatoire.';
    } else if (item.description.trim().length > 200) {
      lineErrors.description = '200 caractères maximum.';
    }

    if (!isValidNumber(item.quantity)) {
      lineErrors.quantity = 'Quantité obligatoire.';
    } else if (toNumber(item.quantity) <= 0) {
      lineErrors.quantity = 'Doit être supérieure à 0.';
    }

    if (!isValidNumber(item.unitPrice)) {
      lineErrors.unitPrice = 'Prix obligatoire.';
    } else if (toNumber(item.unitPrice) < 0) {
      lineErrors.unitPrice = 'Ne peut pas être négatif.';
    }

    const rate = toNumber(item.taxRate);
    if (!isValidNumber(item.taxRate) || rate < 0 || rate > 100) {
      lineErrors.taxRate = 'TVA invalide.';
    }

    if (Object.keys(lineErrors).length > 0) errors.lines[item.id] = lineErrors;
  });

  if (Object.keys(errors.lines).length === 0 && computeTotals(items).total <= 0) {
    errors.total = 'Le total de la facture doit être supérieur à 0.';
  }

  const isValid =
    !errors.contactId &&
    !errors.issueDate &&
    !errors.dueDate &&
    !errors.total &&
    Object.keys(errors.lines).length === 0;

  return { errors, isValid };
}

let lineCounter = 0;
const nextLineId = () => `line-${++lineCounter}`;

const createEmptyLine = () => ({
  id: nextLineId(),
  description: '',
  quantity: '1',
  unitPrice: '',
  taxRate: String(DEFAULT_VAT_RATE),
});

/** Turns an existing invoice into editable form lines. */
function invoiceToFormLines(invoice) {
  if (invoice.items?.length) {
    return invoice.items.map((item) => ({
      id: nextLineId(),
      description: item.description || '',
      quantity: String(item.quantity ?? 1),
      unitPrice: String(item.unitPrice ?? ''),
      taxRate: String(item.taxRate ?? DEFAULT_VAT_RATE),
    }));
  }

  // Older invoices without line items: rebuild one line from the total (TTC -> HT).
  const total = toNumber(invoice.total);
  return [
    {
      id: nextLineId(),
      description: 'Prestation',
      quantity: '1',
      unitPrice: total > 0 ? String(round2(total / (1 + DEFAULT_VAT_RATE / 100))) : '',
      taxRate: String(DEFAULT_VAT_RATE),
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Local storage for invoices created / changed in this screen        */
/* ------------------------------------------------------------------ */

function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(INVOICES_STORAGE_KEY));
    return {
      localInvoices: Array.isArray(raw?.localInvoices) ? raw.localInvoices : [],
      patches: raw?.patches && typeof raw.patches === 'object' ? raw.patches : {},
    };
  } catch {
    return { localInvoices: [], patches: {} };
  }
}

/* ------------------------------------------------------------------ */
/*  Small UI pieces                                                    */
/* ------------------------------------------------------------------ */

const inputClass = (hasError) =>
  `w-full bg-white border rounded-xl px-3 py-2 text-[13px] text-[#1A1D26] placeholder:text-[#9AA1B2] focus:outline-none focus:ring-2 transition-colors ${
    hasError
      ? 'border-[#E5484D] focus:border-[#E5484D] focus:ring-[#E5484D]/15'
      : 'border-[#E6E8EE] focus:border-[#8B7EF8] focus:ring-[#8B7EF8]/15'
  }`;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <p className="mt-1 flex items-center gap-1 text-[11.5px] text-[#E5484D]" role="alert">
      <AlertCircle className="w-3 h-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

function Field({ label, required, error, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="block text-[12px] font-medium text-[#4B5563] mb-1.5">
        {label}
        {required && <span className="text-[#E5484D]"> *</span>}
      </span>
      {children}
      <FieldError message={error} />
    </label>
  );
}

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

/** Gray pill shown instead of the status for archived invoices. */
function ArchivedBadge() {
  return (
    <span className="inline-flex items-center rounded-md bg-[#F1F2F5] px-2.5 py-1 text-[12px] font-medium text-[#4B5563]">
      Archivée
    </span>
  );
}

/** Small green message shown in the top-right corner. */
function Toast({ message, onClose }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="fixed top-5 right-5 z-[60] flex items-center gap-2.5 max-w-sm rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] px-4 py-3 text-[13px] font-medium text-[#047857] shadow-lg"
    >
      <CheckCircle2 className="w-4 h-4 shrink-0" />
      <span>{message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer"
        className="ml-1 p-0.5 rounded-md hover:bg-[#D1FAE5]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Create / edit invoice screen                                       */
/* ------------------------------------------------------------------ */

function CreateInvoiceForm({ invoices, contacts, initialInvoice, onCancel, onSave }) {
  const isEditing = Boolean(initialInvoice);

  const [type, setType] = useState(() => (initialInvoice ? getInvoiceType(initialInvoice) : 'sales'));
  const [contactId, setContactId] = useState(() => {
    if (!initialInvoice) return '';
    const byId = contacts.find((c) => c.id === initialInvoice.contactId);
    if (byId) return byId.id;
    return contacts.find((c) => c.name === initialInvoice.contactName)?.id ?? '';
  });
  const [issueDate, setIssueDate] = useState(() => {
    const value = (initialInvoice?.issueDate || initialInvoice?.createdAt || '').slice(0, 10);
    return isValidISODate(value) ? value : toISODate(new Date());
  });
  const [dueDate, setDueDate] = useState(() => {
    const value = (initialInvoice?.dueDate || '').slice(0, 10);
    return isValidISODate(value) ? value : addDaysISO(DEFAULT_DUE_DAYS);
  });
  const [notes, setNotes] = useState(() => initialInvoice?.notes || '');
  const [items, setItems] = useState(() =>
    initialInvoice ? invoiceToFormLines(initialInvoice) : [createEmptyLine()]
  );
  const [showErrors, setShowErrors] = useState(false);

  const contactOptions = useMemo(() => {
    const wanted = type === 'purchase' ? 'supplier' : 'customer';
    return contacts.filter((c) => !c.archived && c.type === wanted);
  }, [contacts, type]);

  const totals = useMemo(() => computeTotals(items), [items]);

  const { errors, isValid } = useMemo(
    () => validateInvoiceDraft({ type, contactId, issueDate, dueDate, items }),
    [type, contactId, issueDate, dueDate, items]
  );

  const numberYear = isValidISODate(issueDate)
    ? issueDate.slice(0, 4)
    : String(new Date().getFullYear());

  const previewNumber = useMemo(
    () =>
      formatInvoiceNumber(
        getPrefix(type),
        numberYear,
        getNextSequence(getPrefix(type), numberYear, invoices)
      ),
    [type, numberYear, invoices]
  );

  const updateItem = (id, patch) =>
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  const addItem = () => setItems((prev) => [...prev, createEmptyLine()]);

  const removeItem = (id) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((it) => it.id !== id) : prev));

  const handleTypeChange = (nextType) => {
    setType(nextType);
    setContactId('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setShowErrors(true);

    // Same validation is re-run right before saving (never trust the UI state).
    const result = validateInvoiceDraft({ type, contactId, issueDate, dueDate, items });
    if (!result.isValid) return;

    const contact = contacts.find((c) => c.id === contactId);
    if (!contact) return;

    const prefix = getPrefix(type);
    const number = reserveInvoiceNumber(prefix, issueDate.slice(0, 4), invoices);

    const cleanItems = items.map((item, index) => ({
      id: `ITEM-${String(index + 1).padStart(3, '0')}`,
      description: item.description.trim(),
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice),
      taxRate: toNumber(item.taxRate),
    }));
    const finalTotals = computeTotals(cleanItems);

    onSave(
      {
        id: number,
        number,
        type,
        category: type === 'purchase' ? 'achat' : 'vente',
        contactId: contact.id,
        contactName: contact.name,
        contactEmail: contact.email || '',
        issueDate,
        createdAt: issueDate,
        dueDate,
        items: cleanItems,
        subtotal: finalTotals.subtotal,
        tax: finalTotals.tax,
        total: finalTotals.total,
        payments: [],
        paidAmount: 0,
        status: 'draft', // a new (or re-saved) invoice is always a draft
        notes: notes.trim(),
        voidReason: '',
        lastReminderAt: '',
        archived: false,
        replaces: initialInvoice ? initialInvoice.number : '',
      },
      initialInvoice || null
    );
  };

  const hasAnyError = showErrors && !isValid;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            aria-label="Retour à la liste"
            className="p-2 rounded-xl bg-white border border-[#E6E8EE] text-[#4B5563] hover:bg-[#F7F8FA] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <p className="text-[12px] text-[#8C93A4]">Factures</p>
            <h1 className="text-[22px] font-bold tracking-tight text-[#1A1D26]">
              {isEditing ? 'Modifier le brouillon' : 'Nouvelle facture'}
            </h1>
          </div>
        </div>
        <InvoiceStatusBadge status="draft" />
      </div>

      {isEditing && (
        <div className="flex items-start gap-2.5 rounded-xl border border-[#E4E0FE] bg-[#F5F3FF] px-4 py-3 text-[13px] text-[#5B4FD1]">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            En enregistrant, une nouvelle facture brouillon est créée et l'ancienne facture{' '}
            <strong>{initialInvoice.number}</strong> est archivée.
          </span>
        </div>
      )}

      {hasAnyError && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-[#F5C2C4] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B42318]"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Veuillez corriger les champs signalés avant d'enregistrer la facture.</span>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        <div className="xl:col-span-8 space-y-4">
          {/* General information */}
          <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.03)] p-5">
            <h2 className="text-[14px] font-semibold text-[#1A1D26] mb-4">
              Informations générales
            </h2>

            <div className="mb-4">
              <span className="block text-[12px] font-medium text-[#4B5563] mb-1.5">
                Type de facture
              </span>
              <div className="inline-flex items-center bg-[#EFF1F5] p-1 rounded-xl">
                {[
                  { id: 'sales', label: 'Facture de vente' },
                  { id: 'purchase', label: "Facture d'achat" },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handleTypeChange(option.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-[12.5px] font-medium whitespace-nowrap transition-all ${
                      type === option.id
                        ? 'bg-white text-[#1A1D26] shadow-xs'
                        : 'text-[#6B7280] hover:text-[#1A1D26]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field
                label={type === 'purchase' ? 'Fournisseur' : 'Client'}
                required
                error={showErrors ? errors.contactId : ''}
                className="md:col-span-3"
              >
                <div className="relative">
                  <select
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className={`${inputClass(showErrors && errors.contactId)} appearance-none pr-9 cursor-pointer`}
                  >
                    <option value="">
                      {contactOptions.length === 0
                        ? type === 'purchase'
                          ? 'Aucun fournisseur disponible'
                          : 'Aucun client disponible'
                        : type === 'purchase'
                        ? 'Sélectionner un fournisseur'
                        : 'Sélectionner un client'}
                    </option>
                    {contactOptions.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                        {c.email ? ` · ${c.email}` : ''}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </Field>

              <Field label="Date d'émission" required error={showErrors ? errors.issueDate : ''}>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className={inputClass(showErrors && errors.issueDate)}
                />
              </Field>

              <Field label="Date d'échéance" required error={showErrors ? errors.dueDate : ''}>
                <input
                  type="date"
                  value={dueDate}
                  min={issueDate || undefined}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputClass(showErrors && errors.dueDate)}
                />
              </Field>

              <Field label="N° de facture">
                <input
                  type="text"
                  value={previewNumber}
                  readOnly
                  tabIndex={-1}
                  className="w-full bg-[#F7F8FA] border border-[#E6E8EE] rounded-xl px-3 py-2 text-[13px] font-semibold text-[#6B5CE7] tabular-nums cursor-not-allowed"
                />
              </Field>
            </div>
          </div>

          {/* Line items */}
          <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.03)] overflow-hidden">
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h2 className="text-[14px] font-semibold text-[#1A1D26]">Lignes de facture</h2>
              <span className="text-[12px] text-[#8C93A4]">
                {items.length} ligne{items.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAFC] border-y border-[#F0F1F5] text-[12px] font-medium text-[#7A8194]">
                    <th className="py-3 px-5">Désignation</th>
                    <th className="py-3 px-3 w-[90px]">Quantité</th>
                    <th className="py-3 px-3 w-[130px]">Prix unitaire</th>
                    <th className="py-3 px-3 w-[96px]">TVA</th>
                    <th className="py-3 px-3 w-[130px] text-right">Total HT</th>
                    <th className="py-3 px-4 w-11">
                      <span className="sr-only">Supprimer</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2F3F7]">
                  {items.map((item, index) => {
                    const lineErrors = (showErrors && errors.lines[item.id]) || {};
                    const line = computeLine(item);
                    const currentRate = toNumber(item.taxRate);
                    const rateOptions = VAT_RATES.includes(currentRate)
                      ? VAT_RATES
                      : [...VAT_RATES, currentRate];
                    return (
                      <tr key={item.id} className="align-top">
                        <td className="py-3 px-5">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder={`Produit ou service ${index + 1}`}
                            aria-label={`Désignation ligne ${index + 1}`}
                            className={inputClass(lineErrors.description)}
                          />
                          <FieldError message={lineErrors.description} />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            inputMode="decimal"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: e.target.value })}
                            aria-label={`Quantité ligne ${index + 1}`}
                            className={`${inputClass(lineErrors.quantity)} tabular-nums`}
                          />
                          <FieldError message={lineErrors.quantity} />
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: e.target.value })}
                            placeholder="0,00"
                            aria-label={`Prix unitaire ligne ${index + 1}`}
                            className={`${inputClass(lineErrors.unitPrice)} tabular-nums`}
                          />
                          <FieldError message={lineErrors.unitPrice} />
                        </td>
                        <td className="py-3 px-3">
                          <div className="relative">
                            <select
                              value={item.taxRate}
                              onChange={(e) => updateItem(item.id, { taxRate: e.target.value })}
                              aria-label={`TVA ligne ${index + 1}`}
                              className={`${inputClass(lineErrors.taxRate)} appearance-none pr-8 cursor-pointer`}
                            >
                              {rateOptions.map((rate) => (
                                <option key={rate} value={rate}>
                                  {rate} %
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-[#6B7280] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          </div>
                          <FieldError message={lineErrors.taxRate} />
                        </td>
                        <td className="py-3 px-3 pt-[21px] text-right text-[13px] font-semibold text-[#1A1D26] whitespace-nowrap tabular-nums">
                          {formatDZD(line.subtotal)}
                        </td>
                        <td className="py-3 px-4 pt-4 text-right">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            disabled={items.length === 1}
                            title="Supprimer la ligne"
                            aria-label={`Supprimer la ligne ${index + 1}`}
                            className="p-1.5 rounded-lg text-[#8C93A4] hover:bg-[#FEF2F2] hover:text-[#E5484D] transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-[#8C93A4] disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-5 py-4 border-t border-[#F0F1F5] bg-[#FAFAFC]">
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-dashed border-[#C9CEDB] text-[13px] font-medium text-[#6B5CE7] hover:bg-[#FAF9FF] hover:border-[#8B7EF8] transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une ligne</span>
              </button>
              <FieldError message={showErrors ? errors.total : ''} />
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-[#ECEEF2] shadow-[0_1px_3px_rgba(16,24,40,0.03)] p-5">
            <Field label="Notes (optionnel)">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Conditions de paiement, remarques…"
                className={`${inputClass(false)} resize-none`}
              />
            </Field>
          </div>
        </div>

        {/* Live summary */}
        <div className="xl:col-span-4">
          <div className="xl:sticky xl:top-6 rounded-2xl bg-gradient-to-br from-[#7B6EF6] to-[#9C8DFC] p-5 text-white shadow-[0_8px_20px_rgba(123,110,246,0.22)]">
            <p className="text-[12.5px] font-medium text-white/85">Récapitulatif</p>
            <p className="mt-1 text-[13px] font-semibold tabular-nums">{previewNumber}</p>

            <dl className="mt-5 space-y-2.5 text-[13px]">
              <div className="flex justify-between">
                <dt className="text-white/80">Sous-total</dt>
                <dd className="font-semibold tabular-nums">{formatDZD(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-white/80">TVA</dt>
                <dd className="font-semibold tabular-nums">{formatDZD(totals.tax)}</dd>
              </div>
            </dl>

            <div className="mt-4 pt-4 border-t border-white/25">
              <p className="text-[12.5px] font-medium text-white/85">Total TTC</p>
              <p className="mt-1 text-[26px] font-bold tracking-tight tabular-nums">
                {formatDZD(totals.total)}
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#6B5CE7] text-[13px] font-semibold hover:bg-white/95 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isEditing ? 'Enregistrer les modifications' : 'Enregistrer en brouillon'}</span>
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full px-4 py-2.5 rounded-xl border border-white/40 text-white text-[13px] font-medium hover:bg-white/10 transition-colors"
              >
                Annuler
              </button>
            </div>

            <p className="mt-4 text-[11.5px] leading-snug text-white/75">
              La facture est enregistrée au statut « Brouillon ». Son numéro définitif est attribué à
              l'enregistrement et n'est jamais réutilisé.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Invoices list                                                      */
/* ------------------------------------------------------------------ */

/**
 * Props (all optional except `invoices`):
 *  - invoices, contacts, readOnly
 *  - onInvoiceCreated(invoice)              -> a new draft was saved
 *  - onInvoiceReplaced(oldInvoice, newInvoice) -> a draft was edited (old one is archived)
 *  - onInvoiceArchived(invoice, archived)   -> archive / restore
 *  - onInvoiceSent(invoice)                 -> a draft was marked as sent
 * Everything is also stored in localStorage by this component, so it works on its own.
 */
export function InvoicesList({
  invoices = [],
  contacts = [],
  readOnly = false,
  onInvoiceCreated,
  onInvoiceReplaced,
  onInvoiceArchived,
  onInvoiceSent,
}) {
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [localInvoices, setLocalInvoices] = useState(() => loadStore().localInvoices);
  const [patches, setPatches] = useState(() => loadStore().patches);
  const [toast, setToast] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null); // { invoice, archive }

  // Invoices from the parent + invoices created here, with local changes (void / archive) applied.
  const allInvoices = useMemo(() => {
    const known = new Set(invoices.map((i) => i.id));
    return [...localInvoices.filter((i) => !known.has(i.id)), ...invoices].map((inv) =>
      patches[inv.id] ? { ...inv, ...patches[inv.id] } : inv
    );
  }, [invoices, localInvoices, patches]);

  const activeInvoices = useMemo(() => allInvoices.filter((i) => !isArchived(i)), [allInvoices]);

  // Contacts for the form: use the `contacts` prop, otherwise derive them from existing invoices.
  const availableContacts = useMemo(() => {
    if (contacts.length > 0) return contacts;
    const map = new Map();
    invoices.forEach((inv) => {
      const key = `${inv.category}:${inv.contactName}`;
      if (!map.has(key)) {
        map.set(key, {
          id: inv.contactId ?? `auto-${key}`,
          name: inv.contactName,
          email: inv.contactEmail,
          type: inv.category === 'achat' ? 'supplier' : 'customer',
          archived: false,
        });
      }
    });
    return [...map.values()];
  }, [contacts, invoices]);

  // Keep local changes after a page refresh.
  useEffect(() => {
    try {
      localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify({ localInvoices, patches }));
    } catch {
      /* storage unavailable: changes simply last for this session */
    }
  }, [localInvoices, patches]);

  // Auto-hide the green message.
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const kpis = useMemo(() => {
    const overdueTotal = activeInvoices
      .filter((i) => i.status === 'overdue')
      .reduce((acc, i) => acc + i.total, 0);

    const paidTotal = activeInvoices
      .filter((i) => i.status === 'paid')
      .reduce((acc, i) => acc + i.total, 0);

    const partialTotal = activeInvoices
      .filter((i) => i.status === 'partially_paid')
      .reduce((acc, i) => acc + i.total, 0);

    const receivableTotal = activeInvoices
      .filter((i) => ['sent', 'partially_paid', 'overdue'].includes(i.status))
      .reduce((acc, i) => acc + (i.total - (i.paidAmount || 0)), 0);

    const billedTotal = activeInvoices
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
  }, [activeInvoices]);

  const filteredInvoices = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();

    return allInvoices.filter((inv) => {
      // Archived invoices only appear in the "Archivées" tab or with the "Archivée" status filter.
      const archivedView = activeTab === 'archived' || statusFilter === 'archived';
      if (archivedView) {
        if (!isArchived(inv)) return false;
      } else if (isArchived(inv)) {
        return false;
      }

      if (activeTab === 'vente' && inv.category !== 'vente') return false;
      if (activeTab === 'achat' && inv.category !== 'achat') return false;

      if (statusFilter !== 'all' && statusFilter !== 'archived' && inv.status !== statusFilter) {
        return false;
      }

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
          (inv.number || '').toLowerCase().includes(q) ||
          (inv.contactName || '').toLowerCase().includes(q) ||
          (inv.contactEmail || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [allInvoices, activeTab, searchQuery, statusFilter, periodFilter]);

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

  const patchInvoice = (id, patch) =>
    setPatches((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));

  const handleOpenCreate = () => {
    if (readOnly) return;
    setEditingInvoice(null);
    setView('form');
  };

  // Only a non-archived draft can be edited or sent.
  const canEditOrSend = (invoice) =>
    !readOnly && invoice.status === 'draft' && !isArchived(invoice);

  const handleOpenEdit = (invoice) => {
    if (!canEditOrSend(invoice)) return;
    setPreviewInvoice(null);
    setEditingInvoice(invoice);
    setView('form');
  };

  const handleSendInvoice = (invoice) => {
    if (!canEditOrSend(invoice)) return;
    const changes = { status: 'sent', sentAt: toISODate(new Date()) };
    patchInvoice(invoice.id, changes);
    onInvoiceSent?.({ ...invoice, ...changes });
    setPreviewInvoice(null);
    setToast(`Facture ${invoice.number} envoyée.`);
  };

  const handleCloseForm = () => {
    setEditingInvoice(null);
    setView('list');
  };

  const handleSaveInvoice = (newInvoice, replacedInvoice) => {
    setLocalInvoices((prev) => [newInvoice, ...prev]);

    if (replacedInvoice) {
      // The edited draft is kept, but archived and linked to its replacement.
      patchInvoice(replacedInvoice.id, {
        archived: true,
        voidReason: `Remplacée par ${newInvoice.number}`,
        replacedBy: newInvoice.number,
      });
      onInvoiceReplaced?.(replacedInvoice, newInvoice);
      setToast(
        `Facture ${newInvoice.number} enregistrée. L'ancienne ${replacedInvoice.number} est archivée.`
      );
    } else {
      onInvoiceCreated?.(newInvoice);
      setToast(`Facture ${newInvoice.number} créée en brouillon.`);
    }

    setEditingInvoice(null);
    setView('list');
    setActiveTab('all');
    setSearchQuery('');
    setStatusFilter('all');
    setPeriodFilter('all');
    setCurrentPage(1);
  };

  // Step 1: ask for confirmation.
  const handleAskArchive = (invoice) => {
    if (readOnly) return;
    setConfirmAction({ invoice, archive: !isArchived(invoice) });
  };

  // Step 2: apply once the user confirms.
  const handleConfirmArchive = () => {
    if (!confirmAction) return;
    const { invoice, archive } = confirmAction;

    if (archive) {
      patchInvoice(invoice.id, { archived: true });
      setToast(`Facture ${invoice.number} archivée.`);
    } else {
      patchInvoice(invoice.id, {
        archived: false,
        // an old "Annulée" invoice comes back as a draft
        status: invoice.status === 'void' ? 'draft' : invoice.status,
      });
      setToast(`Facture ${invoice.number} restaurée.`);
    }

    onInvoiceArchived?.(invoice, archive);
    setConfirmAction(null);
  };

  const tabs = [
    { id: 'all', label: 'Toutes' },
    { id: 'vente', label: 'Ventes' },
    { id: 'achat', label: 'Achats' },
    { id: 'archived', label: 'Archivées' },
  ];

  if (view === 'form') {
    return (
      <>
        <CreateInvoiceForm
          key={editingInvoice ? editingInvoice.id : 'new'}
          invoices={allInvoices}
          contacts={availableContacts}
          initialInvoice={editingInvoice}
          onCancel={handleCloseForm}
          onSave={handleSaveInvoice}
        />
        <Toast message={toast} onClose={() => setToast('')} />
      </>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={toast} onClose={() => setToast('')} />

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

          {!readOnly && (
            <button
              type="button"
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium shadow-[0_4px_12px_rgba(123,110,246,0.28)] hover:opacity-95 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvelle facture</span>
            </button>
          )}
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
              {Object.keys(INVOICE_STATUS_LABELS)
                .filter((statusKey) => statusKey !== 'void')
                .map((statusKey) => (
                  <option key={statusKey} value={statusKey}>
                    {INVOICE_STATUS_LABELS[statusKey]}
                  </option>
                ))}
              <option value="archived">Archivée</option>
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
        <div className="overflow-x-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAFAFC] border-b border-[#F0F1F5] text-[12px] font-medium text-[#7A8194]">
                <th className="py-3.5 px-5">N° facture</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4 hidden xl:table-cell">Date de création</th>
                <th className="py-3.5 px-4 hidden md:table-cell">Échéance</th>
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
                    {activeTab === 'archived'
                      ? 'Aucune facture archivée.'
                      : 'Aucune facture ne correspond à vos filtres.'}
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
                          <p className="font-semibold text-[#1A1D26] break-words">
                            {invoice.contactName}
                          </p>
                          <p className="text-[11.5px] text-[#8C93A4] break-all">
                            {invoice.contactEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap tabular-nums hidden xl:table-cell">
                      {formatDateFR(invoice.createdAt)}
                    </td>
                    <td className="py-4 px-4 text-[#374151] whitespace-nowrap tabular-nums hidden md:table-cell">
                      {formatDateFR(invoice.dueDate)}
                    </td>
                    <td className="py-4 px-4 text-right font-semibold text-[#1A1D26] whitespace-nowrap tabular-nums">
                      {formatDZD(invoice.total)}
                    </td>
                    <td className="py-4 px-5">
                      {isArchived(invoice) ? (
                        <ArchivedBadge />
                      ) : (
                        <InvoiceStatusBadge status={invoice.status} />
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center justify-end gap-2 text-[#8C93A4]">
                        <button
                          type="button"
                          onClick={() => setPreviewInvoice(invoice)}
                          title="Voir la facture"
                          aria-label="Voir la facture"
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
                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() => handleAskArchive(invoice)}
                            title={isArchived(invoice) ? 'Restaurer la facture' : 'Archiver la facture'}
                            aria-label={isArchived(invoice) ? 'Restaurer la facture' : 'Archiver la facture'}
                            className="p-1.5 rounded-lg hover:bg-[#F3F4F8] hover:text-[#6B5CE7] transition-colors"
                          >
                            {isArchived(invoice) ? (
                              <ArchiveRestore className="w-4 h-4" />
                            ) : (
                              <Archive className="w-4 h-4" />
                            )}
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
            {totalPages > 1
              ? `Page ${safePage} sur ${totalPages}`
              : `${filteredInvoices.length} facture${filteredInvoices.length > 1 ? 's' : ''}`}
          </span>

          {totalPages > 1 && (
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
          )}
        </div>
      </div>

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]">
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl border border-[#ECEEF2] shadow-xl w-full max-w-sm p-6"
          >
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full bg-[#F3F1FF] text-[#6B5CE7] flex items-center justify-center shrink-0">
                {confirmAction.archive ? (
                  <Archive className="w-5 h-5" />
                ) : (
                  <ArchiveRestore className="w-5 h-5" />
                )}
              </span>
              <div>
                <h2 className="text-[16px] font-bold text-[#1A1D26]">
                  {confirmAction.archive ? 'Archiver cette facture ?' : 'Restaurer cette facture ?'}
                </h2>
                <p className="mt-1 text-[13px] leading-snug text-[#6B7280]">
                  {confirmAction.archive
                    ? `La facture ${confirmAction.invoice.number} sera retirée de la liste et placée dans « Archivées ». Vous pourrez la restaurer à tout moment.`
                    : `La facture ${confirmAction.invoice.number} sera remise dans la liste principale.`}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EE] text-[13px] font-medium text-[#374151] hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmArchive}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium shadow-[0_4px_12px_rgba(123,110,246,0.28)] hover:opacity-95 transition-opacity"
              >
                {confirmAction.archive ? 'Archiver' : 'Restaurer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[1px]">
          <div className={`bg-white rounded-2xl border border-[#ECEEF2] shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto ${HIDE_SCROLLBAR}`}>
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

            <div className="mb-4 flex items-center gap-2">
              <InvoiceStatusBadge status={previewInvoice.status} />
              {isArchived(previewInvoice) && <ArchivedBadge />}
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

              {previewInvoice.replaces && (
                <div className="flex justify-between">
                  <dt className="text-[#8C93A4]">Remplace</dt>
                  <dd className="text-[#1A1D26]">{previewInvoice.replaces}</dd>
                </div>
              )}
              {previewInvoice.voidReason && (
                <div className="flex justify-between">
                  <dt className="text-[#8C93A4]">Motif</dt>
                  <dd className="text-[#1A1D26]">{previewInvoice.voidReason}</dd>
                </div>
              )}

              {previewInvoice.items?.length > 0 && (
                <div className="pt-2 border-t border-[#F0F1F5] space-y-2">
                  {previewInvoice.items.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3">
                      <dt className="text-[#4B5563]">
                        {item.description}
                        <span className="text-[#8C93A4] tabular-nums">
                          {' '}
                          · {item.quantity} × {formatDZD(item.unitPrice)} · TVA {item.taxRate} %
                        </span>
                      </dt>
                      <dd className="text-[#1A1D26] whitespace-nowrap tabular-nums">
                        {formatDZD(round2(item.quantity * item.unitPrice))}
                      </dd>
                    </div>
                  ))}
                </div>
              )}

              {previewInvoice.subtotal != null && previewInvoice.tax != null && (
                <>
                  <div className="flex justify-between pt-2 border-t border-[#F0F1F5]">
                    <dt className="text-[#8C93A4]">Sous-total</dt>
                    <dd className="text-[#1A1D26] tabular-nums">
                      {formatDZD(previewInvoice.subtotal)}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[#8C93A4]">TVA</dt>
                    <dd className="text-[#1A1D26] tabular-nums">
                      {formatDZD(previewInvoice.tax)}
                    </dd>
                  </div>
                </>
              )}

              <div className="flex justify-between pt-2 border-t border-[#F0F1F5]">
                <dt className="font-semibold text-[#1A1D26]">Total TTC</dt>
                <dd className="font-bold text-[#6B5CE7] tabular-nums">
                  {formatDZD(previewInvoice.total)}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setPreviewInvoice(null)}
                className="px-4 py-2 rounded-xl border border-[#E6E8EE] text-[13px] font-medium text-[#374151] hover:bg-gray-50"
              >
                Fermer
              </button>

              {canEditOrSend(previewInvoice) && (
                <>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(previewInvoice)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#DDD8FD] text-[13px] font-medium text-[#6B5CE7] hover:bg-[#F5F3FF]"
                  >
                    <Pencil className="w-4 h-4" />
                    <span>Modifier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendInvoice(previewInvoice)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B6EF6] to-[#9889FB] text-white text-[13px] font-medium shadow-[0_4px_12px_rgba(123,110,246,0.28)] hover:opacity-95 transition-opacity"
                  >
                    <Send className="w-4 h-4" />
                    <span>Envoyer</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}