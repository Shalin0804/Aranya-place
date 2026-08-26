export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', ...opts,
  });
}

export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function addDaysISO(isoDate, days) {
  const d = new Date(`${isoDate}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

export function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const ms = new Date(`${checkOut}T00:00:00`) - new Date(`${checkIn}T00:00:00`);
  return Math.max(0, Math.round(ms / 86400000));
}

export function todayISO() {
  return toISODate(new Date());
}
