// Money is computed with integers (hundredths) so there are no floating-point errors.

const toHundredths = (value) => BigInt(Math.round(Number(value) * 100));

// Integer division rounded half-up (all our values are positive or zero).
const divRound = (a, b) => (a + b / 2n) / b;

const toAmount = (hundredths) => Number(hundredths) / 100;

function computeLineHundredths({ quantity, unitPrice, taxRate }) {
  const subtotal = divRound(toHundredths(quantity) * toHundredths(unitPrice), 100n);
  const tax = divRound(subtotal * toHundredths(taxRate), 10000n);
  return { subtotal, tax, total: subtotal + tax };
}

export function computeInvoice(items) {
  let subtotal = 0n;
  let tax = 0n;

  const lines = items.map((item) => {
    const line = computeLineHundredths(item);
    subtotal += line.subtotal;
    tax += line.tax;
    return {
      ...item,
      lineSubtotal: toAmount(line.subtotal),
      lineTax: toAmount(line.tax),
      lineTotal: toAmount(line.total),
    };
  });

  return {
    lines,
    subtotal: toAmount(subtotal),
    tax: toAmount(tax),
    total: toAmount(subtotal + tax),
  };
}