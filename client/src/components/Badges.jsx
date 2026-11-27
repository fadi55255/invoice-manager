import { INVOICE_STATUS_LABELS } from '../utils/formatters';

const INVOICE_STATUS_STYLES = {
  draft: 'bg-[#F1F3F6] text-[#4B5563]',
  sent: 'bg-[#ECE9FE] text-[#6050E6]',
  partially_paid: 'bg-[#E1F5F8] text-[#0E7490]',
  paid: 'bg-[#E3F8EC] text-[#15803D]',
  overdue: 'bg-[#FDECEC] text-[#DC2626]',
  void: 'bg-[#F3F4F6] text-[#6B7280]',
};

export function InvoiceStatusBadge({ status }) {
  const style = INVOICE_STATUS_STYLES[status] || INVOICE_STATUS_STYLES.draft;
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${style}`}
    >
      {INVOICE_STATUS_LABELS[status] || status}
    </span>
  );
}

export function ContactTypeBadge({ type }) {
  const styles =
    type === 'client'
      ? 'bg-[#E1F5F8] text-[#0E7490]'
      : 'bg-[#EFEBFF] text-[#6B5CE7]';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${styles}`}
    >
      {type === 'client' ? 'Client' : 'Fournisseur'}
    </span>
  );
}

export function AvatarInitial({ name = '', size = 'sm' }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';

  return (
    <span
      className={`${sizeClass} rounded-full bg-[#EFEBFF] text-[#6B5CE7] font-semibold inline-flex items-center justify-center shrink-0`}
    >
      {initial}
    </span>
  );
}
