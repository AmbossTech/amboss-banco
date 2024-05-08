export const numberWithPrecision = (
  num: number | string,
  precision: number
): string => {
  const parsed = Number(num);

  if (isNaN(parsed)) return '-';

  const precise = parsed / Math.pow(10, precision);

  return precise.toLocaleString();
};
