import Big from 'big.js';

export const formatFiat = (fiat: number) => `$${fiat.toFixed(2)}`;

export const cryptoToUsd = (
  balance: string,
  precision: number,
  ticker: string,
  fiat_to_btc: string | undefined | null
): string => {
  try {
    if (!fiat_to_btc) return '-';

    if (ticker === 'BTC') {
      const value = new Big(fiat_to_btc)
        .div(100_000_000)
        .times(balance)
        .toNumber();

      return formatFiat(value);
    }

    if (ticker === 'USDT') {
      const value = new Big(balance).div(10 ** precision).toNumber();

      return formatFiat(value);
    }

    return balance;
  } catch (error) {
    return '-';
  }
};
