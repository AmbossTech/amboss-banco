import { ArrowLeft, ArrowUpDown, Loader2, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useMemo,
  useState,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button-v2';
import { useToast } from '@/components/ui/use-toast';
import { useGetPriceCurrentQuery } from '@/graphql/queries/__generated__/prices.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd, formatFiat } from '@/utils/fiat';

import { Assets } from './Send';

export const PayView: FC<{
  reset: () => void;
  loading: boolean;
  UpperBadge: ReactNode;
  asset: Assets;
  amountSatsInput: string;
  amountUSDInput: string;
  setAmountSatsInput: Dispatch<SetStateAction<string>>;
  setAmountUSDInput: Dispatch<SetStateAction<string>>;
  disableInput?: boolean;
  recipient: string | ReactNode;
  InvoiceDescription?: ReactNode;
  payFunction: () => Promise<void>;
}> = ({
  reset,
  loading,
  UpperBadge,
  asset,
  amountSatsInput,
  amountUSDInput,
  setAmountSatsInput,
  setAmountUSDInput,
  disableInput,
  recipient,
  InvoiceDescription,
  payFunction,
}) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [satsFirst, setSatsFirst] = useState(false);

  const keys = useKeyStore(s => s.keys);
  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const { data: walletData } = useGetWalletQuery({
    variables: { id: value },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet.',
        description: messages.join(', '),
      });
    },
  });

  const balance = useMemo(() => {
    const liquidAsset = walletData?.wallets.find_one.accounts
      .find(a => a.liquid)
      ?.liquid?.assets.find(a => a.asset_info.name === asset);

    if (!liquidAsset) return '-';

    const fiatBalance = cryptoToUsd(
      liquidAsset.balance,
      liquidAsset.asset_info.precision,
      liquidAsset.asset_info.ticker,
      liquidAsset.fiat_info.fiat_to_btc
    );

    return fiatBalance;
  }, [walletData, asset]);

  const { data: priceData } = useGetPriceCurrentQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting asset prices.',
        description: messages.join(', '),
      });
    },
  });

  const latestPrice = priceData?.prices.current.value;

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-4 lg:py-10">
      <div className="relative">
        <button
          onClick={() => reset()}
          disabled={loading}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </button>

        <p className="text-center text-2xl font-semibold">
          {t('App.Wallet.confirm-pay')}
        </p>
      </div>

      {UpperBadge}

      <p className="text-center font-medium">
        {t('App.Wallet.available')}: {balance}
      </p>

      <div>
        <div className="my-20">
          <div className="relative mb-4 border-b border-primary pb-px">
            <input
              autoFocus={!amountSatsInput}
              id="amount"
              type="number"
              min="0"
              placeholder="0"
              value={satsFirst ? amountSatsInput : amountUSDInput}
              onChange={e => {
                if (!latestPrice) return;

                const numberValue = Number(e.target.value);
                const decimals = e.target.value.split('.')[1];
                const latestPricePerSat = latestPrice / 100_000_000;

                if (!e.target.value) {
                  setAmountUSDInput('');
                  setAmountSatsInput('');
                  return;
                }

                if (numberValue < 0) return;
                if (satsFirst && numberValue < 1) return;
                if (satsFirst && e.target.value.includes('.')) return;
                if (!satsFirst && decimals?.length > 2) return;

                if (satsFirst) {
                  setAmountSatsInput(numberValue.toFixed(0));
                  setAmountUSDInput(
                    (latestPricePerSat * numberValue).toFixed(2)
                  );
                } else {
                  setAmountUSDInput(e.target.value);
                  setAmountSatsInput(
                    (numberValue / latestPricePerSat).toFixed(0)
                  );
                }
              }}
              disabled={!latestPrice || loading || disableInput}
              readOnly={disableInput}
              className="w-full bg-transparent text-center text-5xl font-medium focus:outline-none"
            />

            <label
              htmlFor="amount"
              className="absolute right-0 top-0 flex h-[62px] items-center justify-center bg-background pl-2 text-sm"
            >
              {satsFirst ? 'SATS' : 'USD'}
            </label>
          </div>

          <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-neutral-400">
            <p className="overflow-x-auto whitespace-nowrap">
              {satsFirst
                ? formatFiat(Number(amountUSDInput)) + ' USD'
                : Number(amountSatsInput).toLocaleString('en-US') + ' sats'}
            </p>

            <button
              onClick={() => {
                setSatsFirst(s => !s);

                if (amountUSDInput) {
                  setAmountUSDInput(a => Number(a).toFixed(2));
                }
              }}
            >
              <ArrowUpDown size={16} className="shrink-0" />
            </button>
          </div>

          <p className="mt-4 text-center font-medium">
            {t('App.Wallet.to')}: {recipient}
          </p>

          {InvoiceDescription || null}
        </div>

        <p className="mb-3 text-center text-sm text-slate-600 dark:text-neutral-400">
          {t('App.Wallet.fee')}: {t('App.Wallet.unknown')}
        </p>

        <div className="flex justify-center space-x-4">
          <Button
            variant="neutral"
            onClick={() => {
              reset();
            }}
            disabled={loading}
            className="w-full lg:w-36"
          >
            {t('Common.cancel')}
          </Button>

          <Button
            onClick={() => {
              payFunction();
            }}
            disabled={!keys || !Number(amountSatsInput) || loading}
            className="flex w-full items-center justify-center lg:w-36"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
            ) : null}
            {t('App.Wallet.send')}
          </Button>
        </div>

        {keys ? null : (
          <div className="mt-3 flex items-center justify-center space-x-1 text-sm font-medium text-destructive">
            <Lock size={14} /> <p>{t('App.Wallet.locked')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
