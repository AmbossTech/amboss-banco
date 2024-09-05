export const numberWithPrecision = (
  num: number | string,
  precision: number
): number | undefined => {
  const parsed = Number(num);

  if (isNaN(parsed)) return undefined;

  const precise = parsed / Math.pow(10, precision);

  return precise;
};

export const numberWithPrecisionAndDecimals = (
  num: number | string,
  precision: number,
  ticker?: string
): string => {
  const precise = numberWithPrecision(num, precision);

  if (precise === undefined) return '-';

  const minimumFractionDigits = ticker === 'USDT' ? 2 : 0;

  return precise.toLocaleString('en-US', { minimumFractionDigits });
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
