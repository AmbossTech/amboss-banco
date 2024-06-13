export const numberWithPrecision = (
  num: number | string,
  precision: number,
  ticker?: string
): string => {
  const parsed = Number(num);

  if (isNaN(parsed)) return '-';

  const precise = parsed / Math.pow(10, precision);

  const minimumFractionDigits = ticker === 'USDt' ? 2 : 0;

  return precise.toLocaleString(undefined, { minimumFractionDigits });
};

export const numberWithoutPrecision = (
  num: number | string,
  precision: number
): string => {
  const parsed = Number(num);

  if (isNaN(parsed)) return '-';

  const precise = parsed * Math.pow(10, precision);

  return precise.toString();
};
