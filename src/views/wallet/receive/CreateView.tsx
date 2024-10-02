import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpDown,
  ChevronsUpDown,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, ReactNode, useState } from 'react';

import { QrCode } from '@/components/QrCode';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button-v2';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetPriceCurrentQuery } from '@/graphql/queries/__generated__/prices.generated';
import { cn } from '@/utils/cn';
import { handleApolloError } from '@/utils/error';
import { formatFiat } from '@/utils/fiat';
import { ROUTES } from '@/utils/routes';

import { ReceiveAction, ReceiveOptions, ReceiveState } from './Receive';

const options: ReceiveOptions[] = [
  'Any Currency',
  'Lightning',
  'Liquid Bitcoin',
  'Tether USD',
  'Bitcoin',
];

export const CreateView: FC<{
  state: ReceiveState;
  dispatch: Dispatch<ReceiveAction>;
  receiveText: string;
  dataLoading: boolean;
  dataError: boolean;
  createFunction?: () => void;
  Description?: ReactNode;
}> = ({
  state,
  dispatch,
  receiveText,
  dataLoading,
  dataError,
  createFunction,
  Description,
}) => {
  const t = useTranslations('App');
  const c = useTranslations('Common');
  const { toast } = useToast();

  const [optionsOpen, setOptionsOpen] = useState(false);
  const [amountOpen, setAmountOpen] = useState(
    state.receive === 'Lightning' || state.receive === 'Bitcoin'
  );
  const [satsFirst, setSatsFirst] = useState(false);

  const {
    data: priceData,
    loading: priceLoading,
    error: priceError,
  } = useGetPriceCurrentQuery({
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

  const loading = dataLoading || priceLoading;
  const error = dataError || Boolean(priceError);

  if (error)
    return (
      <p className="mx-auto w-full max-w-lg py-4 text-center lg:py-10">
        {c.rich('refresh', {
          refresh: chunks => (
            <button
              className="font-semibold text-primary transition-colors hover:text-primary-hover"
              onClick={() => window.location.reload()}
            >
              {chunks}
            </button>
          ),
        })}
      </p>
    );

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 py-4 lg:py-10">
      <div className="relative">
        <Link
          href={ROUTES.dashboard}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <p className="text-center text-2xl font-semibold">
          {t('Wallet.receive')}
        </p>
      </div>

      <Drawer open={optionsOpen} onOpenChange={setOptionsOpen}>
        <DrawerTrigger asChild disabled={loading}>
          <button className="mx-auto flex h-10 items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
            <p>{state.receive}</p> <ChevronsUpDown size={16} />
          </button>
        </DrawerTrigger>

        <DrawerContent>
          <div className="mb-4">
            {options.map(o => (
              <DrawerClose key={o} asChild>
                <button
                  onClick={() => {
                    dispatch({ type: 'receive', nextReceive: o });
                    dispatch({ type: 'receiveString', nextString: '' });
                    dispatch({ type: 'amountUSDInput', nextString: '' });
                    dispatch({ type: 'amountSatsInput', nextString: '' });
                    dispatch({ type: 'amountUSDSaved', nextString: '' });
                    dispatch({ type: 'amountSatsSaved', nextString: '' });
                    setSatsFirst(false);
                  }}
                  className="flex w-full items-center justify-between border-b border-slate-200 py-3 dark:border-neutral-800"
                >
                  <p>{o}</p>

                  <div
                    className={cn(
                      'flex h-6 w-6 items-center justify-center rounded-full border-2',
                      state.receive === o
                        ? 'border-foreground'
                        : 'border-slate-300 dark:border-neutral-500'
                    )}
                  >
                    <div
                      className={cn(
                        'h-2.5 w-2.5 rounded-full bg-foreground',
                        state.receive === o ? 'block' : 'hidden'
                      )}
                    />
                  </div>
                </button>
              </DrawerClose>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {state.receive === 'Bitcoin' && state.receiveString ? (
        <Alert>
          <AlertTriangle size={16} />
          <AlertTitle>{c('important')}</AlertTitle>
          <AlertDescription>{t('Wallet.receive-warn')}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <Skeleton className="mx-auto h-[250px] w-[250px] rounded-3xl" />
      ) : (
        <QrCode
          text={state.receiveString || 'BancoLibre'}
          className={cn(
            'mx-auto w-fit drop-shadow-2xl dark:drop-shadow-none',
            !state.receiveString && 'blur'
          )}
        />
      )}

      {loading ? (
        <Skeleton className="mx-auto h-6 w-56" />
      ) : (
        <p className="text-center font-semibold text-slate-600 dark:text-neutral-400">
          {receiveText}
        </p>
      )}

      {state.receive !== 'Any Currency' ? (
        <Drawer
          open={amountOpen}
          onOpenChange={setAmountOpen}
          onClose={() => {
            setTimeout(() => {
              dispatch({
                type: 'amountUSDInput',
                nextString: state.amountUSDSaved,
              });
              dispatch({
                type: 'amountSatsInput',
                nextString: state.amountSatsSaved,
              });
            }, 1000);
          }}
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <DrawerTrigger asChild disabled={loading}>
              {state.amountUSDSaved ? (
                <button className="text-primary transition-colors hover:text-primary-hover">
                  {formatFiat(Number(state.amountUSDSaved))} USD
                </button>
              ) : (
                <button className="w-full text-center text-primary transition-colors hover:text-primary-hover">
                  + {t('Wallet.amount-custom')}
                </button>
              )}
            </DrawerTrigger>

            {state.receive !== 'Tether USD' && state.amountSatsSaved ? (
              <p className="text-slate-600 dark:text-neutral-400">
                {Number(state.amountSatsSaved).toLocaleString('en-US')} sats
              </p>
            ) : null}

            {state.receive === 'Tether USD' && state.amountUSDSaved ? (
              <p className="text-slate-600 dark:text-neutral-400">
                {formatFiat(Number(state.amountUSDSaved)).slice(1)} USDT
              </p>
            ) : null}
          </div>

          <DrawerContent>
            <div className="relative mb-4 mt-16 border-b border-primary pb-px">
              <input
                autoFocus
                id="amount"
                type="number"
                min="0"
                placeholder="0"
                value={satsFirst ? state.amountSatsInput : state.amountUSDInput}
                onChange={e => {
                  if (!latestPrice) return;

                  const numberValue = Number(e.target.value);
                  const decimals = e.target.value.split('.')[1];
                  const latestPricePerSat = latestPrice / 100_000_000;

                  if (!e.target.value) {
                    dispatch({ type: 'amountUSDInput', nextString: '' });
                    dispatch({ type: 'amountSatsInput', nextString: '' });
                    return;
                  }

                  if (numberValue < 0) return;
                  if (satsFirst && numberValue < 1) return;
                  if (satsFirst && e.target.value.includes('.')) return;
                  if (!satsFirst && decimals?.length > 2) return;

                  if (satsFirst) {
                    dispatch({
                      type: 'amountSatsInput',
                      nextString: numberValue.toFixed(0),
                    });
                    dispatch({
                      type: 'amountUSDInput',
                      nextString: (latestPricePerSat * numberValue).toFixed(2),
                    });
                  } else {
                    dispatch({
                      type: 'amountUSDInput',
                      nextString: e.target.value,
                    });
                    dispatch({
                      type: 'amountSatsInput',
                      nextString: (numberValue / latestPricePerSat).toFixed(0),
                    });
                  }
                }}
                className="w-full bg-transparent text-center text-5xl font-medium focus:outline-none"
              />

              <label
                htmlFor="amount"
                className="absolute right-0 top-0 flex h-[62px] items-center justify-center bg-slate-100 pl-2 text-sm dark:bg-neutral-900"
              >
                {satsFirst ? 'SATS' : 'USD'}
              </label>
            </div>

            <div className="flex items-center justify-center space-x-2 text-slate-600 dark:text-neutral-400">
              <p className="overflow-x-auto whitespace-nowrap">
                {state.receive !== 'Tether USD'
                  ? satsFirst
                    ? formatFiat(Number(state.amountUSDInput)) + ' USD'
                    : Number(state.amountSatsInput).toLocaleString('en-US') +
                      ' sats'
                  : formatFiat(Number(state.amountUSDInput)).slice(1) + ' USDT'}
              </p>

              {state.receive !== 'Tether USD' ? (
                <button
                  onClick={() => {
                    setSatsFirst(s => !s);

                    if (state.amountUSDInput) {
                      dispatch({
                        type: 'amountUSDInput',
                        nextString: Number(state.amountUSDInput).toFixed(2),
                      });
                    }
                  }}
                >
                  <ArrowUpDown size={16} className="shrink-0" />
                </button>
              ) : null}
            </div>

            <p className="mb-16 mt-6 text-center text-sm">
              {t('Wallet.amount')}
            </p>

            <Button
              onClick={() => {
                if (!createFunction) return;

                dispatch({
                  type: 'amountUSDSaved',
                  nextString: Number(state.amountUSDInput).toFixed(2),
                });
                dispatch({
                  type: 'amountSatsSaved',
                  nextString: state.amountSatsInput,
                });

                createFunction();

                setAmountOpen(false);
              }}
              disabled={!Number(state.amountSatsInput)}
              className="mb-4 w-full"
            >
              {t('save')}
            </Button>
          </DrawerContent>
        </Drawer>
      ) : null}

      {Description || null}

      <Button
        onClick={() => {
          navigator.clipboard.writeText(state.receiveString);
          toast({ title: 'Copied!' });
        }}
        disabled={loading || !state.receiveString}
        className="mx-auto w-40"
      >
        {t('copy')}
      </Button>
    </div>
  );
};
