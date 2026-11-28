import { computeInvoice } from './invoice.calculations.js';

const MAX_AMOUNT = 9999999999.99; // limit of NUMERIC(12,2)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isDate = (value) => {
  if (typeof value !== 'string' || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  // Rejects impossible dates such as 2026-02-30.
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
};

// A real JSON number, within range, with at most 2 decimals.
const isAmount = (value, max = MAX_AMOUNT) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0 &&
  value <= max &&
  Math.abs(value * 100 - Math.round(value * 100)) < 1e-4;

export function validateInvoice(body) {
  const errors = {};
  const data = body && typeof body === 'object' ? body : {};
  const { direction, contactId, issueDate, dueDate, items, notes } = data;

  if (!['vente', 'achat'].includes(direction)) errors.direction = 'Type de facture invalide.';
  if (typeof contactId !== 'string' || !UUID.test(contactId)) {
    errors.contactId = 'Contact obligatoire.';
  }
  if (!isDate(issueDate)) errors.issueDate = "Date d'émission invalide.";
  if (!isDate(dueDate)) errors.dueDate = "Date d'échéance invalide.";
  else if (isDate(issueDate) && dueDate < issueDate) {
    errors.dueDate = "L'échéance ne peut pas précéder la date d'émission.";
  }
  if (notes != null && (typeof notes !== 'string' || notes.length > 500)) {
    errors.notes = '500 caractères maximum.';
  }

  let itemsValid = false;
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) {
    errors.items = 'Ajoutez entre 1 et 100 lignes.';
  } else {
    itemsValid = true;
    items.forEach((item, i) => {
      const fail = (field, message) => {
        errors[`items.${i}.${field}`] = message;
        itemsValid = false;
      };
      const description = typeof item?.description === 'string' ? item.description.trim() : '';
      if (!description || description.length > 200) {
        fail('description', 'Désignation obligatoire (200 caractères maximum).');
      }
      if (!isAmount(item?.quantity) || item.quantity <= 0) {
        fail('quantity', 'Quantité supérieure à 0, 2 décimales maximum.');
      }
      if (!isAmount(item?.unitPrice)) {
        fail('unitPrice', 'Prix positif ou nul, 2 décimales maximum.');
      }
      if (!isAmount(item?.taxRate, 100)) fail('taxRate', 'TVA entre 0 et 100.');
    });
  }

  if (itemsValid) {
    const { total } = computeInvoice(items);
    if (total <= 0) errors.total = 'Le total doit être supérieur à 0.';
    else if (total > MAX_AMOUNT) errors.total = 'Le total est trop grand.';
  }

  return { errors, isValid: Object.keys(errors).length === 0 };
}