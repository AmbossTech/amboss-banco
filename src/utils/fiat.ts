import Big from 'big.js';

export const cryptoToUsd = (
  balance: string,
  precision: number,
  ticker: string,
  fiat_to_btc: string | undefined | null
): string => {
  const usdOptions = { maximumFractionDigits: 2, minimumFractionDigits: 2 };

  try {
    if (!fiat_to_btc) return '-';

    if (ticker === 'BTC') {
      const value = new Big(fiat_to_btc)
        .div(100_000_000)
        .times(balance)
        .toNumber();

      return `$${value.toLocaleString(undefined, usdOptions)}`;
    }

    if (ticker === 'USDT') {
      const value = new Big(balance).div(10 ** precision).toNumber();

      return `$${value.toLocaleString(undefined, usdOptions)}`;
    }

    return balance;
  } catch (error) {
    return '-';
  }
};
