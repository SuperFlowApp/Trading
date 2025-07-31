export function formatPrice(value) {
  if (value == null || isNaN(value)) return '';
  const num = Number(value);
  if (num === 0) return '0.0';
  let decimals = 0;
  if (num < 1) decimals = 4;
  else if (num < 10) decimals = 3;
  else if (num < 100) decimals = 2;
  else if (num < 1000) decimals = 1;
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}