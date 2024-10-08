'use client';

import { sub } from 'date-fns';
import {
  ArrowDown,
  ArrowDownUp,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  Info,
  Settings2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';
import { Line, LineChart } from 'recharts';

import smallCircular from '/public/icons/small-circular.svg';
import smallCircularLight from '/public/icons/small-circular-light.svg';
import liquid from '/public/images/liquid.jpg';
import tether from '/public/images/tether.png';
import { RefreshButton } from '@/components/button/RefreshButton';
import { Button, IconButton } from '@/components/ui/button-v2';
import { Card } from '@/components/ui/card';
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetPricesHistoricalQuery } from '@/graphql/queries/__generated__/prices.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { cn } from '@/utils/cn';
import { handleApolloError } from '@/utils/error';
import { cryptoToUsd, formatFiat } from '@/utils/fiat';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';
import { ROUTES } from '@/utils/routes';

import { DashboardView } from '../dashboard/Dashboard';

const chartConfig = {
  price: {
    label: 'USD',
    color: '#9AB2F9',
  },
} satisfies ChartConfig;

type ChartPeriods = '1D' | '1W' | '1M' | '1Y' | 'ALL';

const chartPeriods: ChartPeriods[] = ['1D', '1W', '1M', '1Y', 'ALL'];

type AssetBalance = {
  accountId: string;
  name: string;
  ticker: string;
  balance: string;
  formatted_balance: string;
  precision: number;
  assetId: string;
};

const AssetLogo: FC<{ ticker: string }> = ({ ticker }) => {
  const classname = 'h-10 w-10 rounded-full object-cover';

  switch (ticker) {
    case 'USDT':
      return <Image src={tether} alt="tether" className={classname} />;
    case 'BTC':
      return <Image src={liquid} alt="liquid" className={classname} />;
    default:
      return <div className="h-10 w-10 rounded-full bg-primary" />;
  }
};

export const WalletInfo: FC<{
  id: string;
  view: DashboardView;
  setView: Dispatch<SetStateAction<DashboardView>>;
}> = ({ id, view, setView }) => {
  const t = useTranslations('App.Wallet');
  const d = useTranslations('App.Dashboard');
  const c = useTranslations('Common');

  const { toast } = useToast();

  const [hideBalance, setHideBalance] = useState(false);
  const [assetHover, setAssetHover] = useState('');
  const [selectedAsset, setSelectedAsset] = useState('');
  const [satsFirst, setSatsFirst] = useState(false);
  const [showAssetInfo, setShowAssetInfo] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriods>('1M');

  const assetDescription = useMemo(() => {
    switch (selectedAsset) {
      case 'BTC':
        return d('liquid-explainer');
      case 'USDT':
        return d('tether-explainer');
      default:
        return d('asset');
    }
  }, [d, selectedAsset]);

  const { data, loading, error } = useGetWalletQuery({
    variables: { id },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet.',
        description: messages.join(', '),
      });
    },
  });

  const from_date = useMemo(() => {
    const today = new Date();

    switch (chartPeriod) {
      case '1D':
        return sub(today, { days: 1 }).toISOString();
      case '1W':
        return sub(today, { weeks: 1 }).toISOString();
      case '1M':
        return sub(today, { months: 1 }).toISOString();
      case '1Y':
        return sub(today, { years: 1 }).toISOString();
      case 'ALL':
        return new Date('January 3, 2009 00:00:00').toISOString();
    }
  }, [chartPeriod]);

  const { data: priceData, loading: priceLoading } =
    useGetPricesHistoricalQuery({
      variables: { input: { from_date } },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error getting asset prices.',
          description: messages.join(', '),
        });
      },
    });

  const prices = useMemo(
    () =>
      priceData?.prices.historical.points
        .filter(p => p.value !== null)
        .map(p => ({ date: p.date, price: p.value }))
        .toSorted((a, b) => Date.parse(b.date) - Date.parse(a.date)),
    [priceData]
  );

  const balances = useMemo(() => {
    if (loading || error) return [];
    if (!data?.wallets.find_one.accounts.length) return [];

    const { accounts } = data.wallets.find_one;

    const mapped: AssetBalance[] = [];

    accounts.forEach(a => {
      if (!a.liquid) return;

      a.liquid.assets.forEach(l => {
        mapped.push({
          accountId: a.id,
          assetId: l.asset_id,
          name: l.asset_info.name,
          ticker: l.asset_info.ticker,
          balance: l.balance,
          formatted_balance: cryptoToUsd(
            l.balance,
            l.asset_info.precision,
            l.asset_info.ticker,
            l.fiat_info.fiat_to_btc
          ),
          precision: l.asset_info.precision,
        });
      });
    });

    return mapped;
  }, [data, loading, error]);

  const totalBalance = useMemo(() => {
    const total = balances.reduce((a, c) => {
      if (c.formatted_balance === '-') return a;

      const numberBalance = Number(
        c.formatted_balance.slice(1, c.formatted_balance.length)
      );

      return a + numberBalance;
    }, 0);

    return formatFiat(total);
  }, [balances]);

  const balancePercentages = useMemo(
    () =>
      balances
        .map(b => {
          if (b.formatted_balance === '-') return { ...b, percent: 0 };

          const numberBalance = Number(
            b.formatted_balance.slice(1, b.formatted_balance.length)
          );

          const numberTotalBalance = Number(
            totalBalance.slice(1, totalBalance.length)
          );

          const percent =
            numberTotalBalance > 0
              ? Number(((numberBalance / numberTotalBalance) * 100).toFixed(0))
              : 0;

          return { ...b, percent };
        })
        .sort((a, b) => b.percent - a.percent),
    [balances, totalBalance]
  );

  const selectedBalance = useMemo(
    () => balances.find(b => b.ticker === selectedAsset),
    [balances, selectedAsset]
  );

  if (loading)
    return (
      <div className="h-52 w-full animate-pulse rounded-2xl bg-slate-100 dark:bg-neutral-900" />
    );

  if (error) return null;

  if (view === 'asset' && selectedBalance)
    return (
      <div className="relative">
        <button
          onClick={() => {
            setView('assets');
            setSelectedAsset('');
            setSatsFirst(false);
            setChartPeriod('1M');
          }}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75 lg:-left-16"
        >
          <ArrowLeft size={24} />
        </button>

        <Drawer open={showAssetInfo} onOpenChange={setShowAssetInfo}>
          <DrawerTrigger
            asChild
            className="absolute right-0 top-0 transition-opacity hover:opacity-75 lg:-right-16"
          >
            <button>
              <Info size={24} />
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <DrawerHeader className="gap-4 pb-0 !text-left">
              <DrawerTitle className="text-2xl">
                {d('what-asset', { asset: selectedBalance.name })}
              </DrawerTitle>

              <DrawerDescription className="font-medium">
                {assetDescription}
              </DrawerDescription>
            </DrawerHeader>

            <DrawerFooter className="pt-6">
              <DrawerClose asChild>
                <Button className="w-full">{c('close')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>

        <p className="mx-auto mb-4 max-w-[232px] text-center text-2xl font-semibold sm:max-w-none">
          {selectedBalance.name}
        </p>

        <p className="text-center text-4xl font-semibold lg:text-5xl">
          {satsFirst
            ? numberWithPrecisionAndDecimals(
                parseFloat(selectedBalance.balance),
                selectedBalance.precision
              ) + ' sats'
            : selectedBalance.formatted_balance}
        </p>

        {selectedAsset === 'BTC' ? (
          <div>
            <div className="mt-1 flex items-center justify-center space-x-2 text-slate-600 dark:text-neutral-400">
              <p className="text-xs font-medium">
                {satsFirst
                  ? selectedBalance.formatted_balance
                  : numberWithPrecisionAndDecimals(
                      parseFloat(selectedBalance.balance),
                      selectedBalance.precision
                    ) + ' sats'}
              </p>

              <button onClick={() => setSatsFirst(s => !s)}>
                <ArrowDownUp size={16} />
              </button>
            </div>

            {priceLoading ? (
              <Skeleton className="mx-auto mb-6 mt-4 h-4 w-24" />
            ) : (
              <p className="mb-6 mt-4 text-center text-xs font-semibold text-primary">
                {prices ? formatFiat(Number(prices[0].price)) : '-'} USD
              </p>
            )}

            {priceLoading ? (
              <Skeleton className="h-[288px] w-full" />
            ) : (
              <ChartContainer config={chartConfig}>
                <LineChart accessibilityLayer data={prices?.toReversed()}>
                  <ChartTooltip
                    content={
                      <ChartTooltipContent labelFormatter={() => d('price')} />
                    }
                  />
                  <Line
                    dataKey="price"
                    type="natural"
                    stroke="var(--color-price)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            )}

            <div className="mt-6 flex justify-center space-x-1">
              {chartPeriods.map(p => (
                <button
                  key={p}
                  onClick={() => setChartPeriod(p)}
                  disabled={priceLoading}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-xl font-semibold',
                    chartPeriod === p
                      ? 'bg-slate-200 dark:bg-neutral-800'
                      : 'text-slate-600 dark:text-white/60'
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          <p className="text-center text-xs font-medium text-slate-600 dark:text-neutral-400">
            {c('coming-soon')}
          </p>

          <div className="mt-3 flex justify-center space-x-3">
            <Button disabled className="w-full lg:w-36">
              {d('buy')}
            </Button>

            <Button variant="secondary" disabled className="w-full lg:w-36">
              {d('sell')}
            </Button>
          </div>
        </div>
      </div>
    );

  if (view === 'assets')
    return (
      <div className="relative">
        <button
          onClick={() => setView('default')}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75 lg:-left-16"
        >
          <ArrowLeft size={24} />
        </button>

        <Link
          href={ROUTES.wallet.settings}
          className="absolute right-0 top-0 transition-opacity hover:opacity-75 lg:-right-16"
        >
          <Settings2 size={24} />
        </Link>

        <p className="mx-auto mb-4 max-w-[232px] text-center text-2xl font-semibold sm:max-w-none">
          {data?.wallets.find_one.name}
        </p>

        <p className="mb-4 text-center text-4xl font-semibold lg:text-5xl">
          {totalBalance}
        </p>

        <div className="mb-6 flex justify-center space-x-3">
          <Button asChild>
            <Link
              href={ROUTES.wallet.receive}
              className="flex w-full max-w-32 items-center justify-center space-x-2"
            >
              <p>{t('receive')}</p> <ArrowDown size={16} />
            </Link>
          </Button>

          <Button asChild variant="secondary">
            <Link
              href={ROUTES.wallet.send}
              className="flex w-full max-w-32 items-center justify-center space-x-2"
            >
              <p>{t('send')}</p> <ArrowUp size={16} />
            </Link>
          </Button>
        </div>

        <div className="mb-6 h-px w-full bg-slate-200 dark:bg-neutral-800" />

        <p className="text-center text-2xl font-semibold">{t('assets')}</p>

        <div className="my-6 flex w-full flex-wrap items-end justify-evenly">
          {balancePercentages.map(b => {
            const width = `w-[${b.percent}%]`;
            const height = `h-[${b.percent}%]`;

            return (
              <button
                onClick={() => {
                  setSelectedAsset(b.ticker);
                  setView('asset');
                  setAssetHover('');
                }}
                onMouseEnter={() => setAssetHover(b.ticker)}
                onMouseLeave={() => setAssetHover('')}
                key={b.assetId}
                className={cn(
                  'relative min-h-20 min-w-20 rounded-full text-center text-sm font-medium transition-all',
                  width,
                  height,
                  assetHover === b.ticker
                    ? 'scale-125 bg-slate-300 dark:bg-neutral-600'
                    : 'bg-slate-200 dark:bg-neutral-500'
                )}
              >
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <p>{b.ticker === 'USDT' ? b.formatted_balance : b.balance}</p>
                  <p>{b.ticker}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          {balancePercentages.map(b => (
            <button
              onClick={() => {
                setSelectedAsset(b.ticker);
                setView('asset');
                setAssetHover('');
              }}
              onMouseEnter={() => setAssetHover(b.ticker)}
              onMouseLeave={() => setAssetHover('')}
              key={b.assetId}
              className={cn(
                'flex w-full items-center justify-between rounded-xl px-2 py-1 transition-colors',
                assetHover === b.ticker
                  ? 'bg-slate-200 dark:bg-neutral-950'
                  : 'bg-slate-100 dark:bg-neutral-900'
              )}
            >
              <div className="flex items-center space-x-2">
                <AssetLogo ticker={b.ticker} />

                <p className="font-medium">
                  {b.name} ({b.ticker})
                </p>
              </div>

              <div>
                <p className="font-medium">{b.formatted_balance}</p>

                <p className="text-right text-sm text-slate-600 dark:text-neutral-400">
                  {b.percent}%
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );

  return (
    <Card className="relative">
      <Image
        src={smallCircular}
        alt="circles"
        className="absolute right-0 top-1/2 hidden -translate-y-1/2 dark:block"
      />
      <Image
        src={smallCircularLight}
        alt="circles"
        className="absolute right-0 top-1/2 -translate-y-1/2 dark:hidden"
      />

      <div className="mb-3 flex w-full justify-between space-x-2">
        <button
          onClick={() => setView('assets')}
          className="z-[1] h-fit font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          {data?.wallets.find_one.name}
        </button>

        <div className="flex space-x-2">
          <IconButton
            icon={hideBalance ? <EyeOff size={20} /> : <Eye size={20} />}
            onClick={() => setHideBalance(h => !h)}
            className="z-[1]"
          />

          <RefreshButton className="z-[1]" />
        </div>
      </div>

      <button
        onClick={() => setView('assets')}
        className="relative z-[1] mb-1 text-4xl font-semibold"
      >
        {hideBalance ? '***' : totalBalance}
      </button>

      <div className="mb-4 flex flex-wrap gap-6">
        {balancePercentages.map(b => (
          <p
            key={b.assetId}
            className="z-[1] text-sm font-medium text-slate-600 dark:text-neutral-400 lg:text-base"
          >
            {hideBalance ? '***' : b.formatted_balance} {b.ticker}
          </p>
        ))}
      </div>

      <div className="flex space-x-3">
        <Button asChild>
          <Link
            href={ROUTES.wallet.receive}
            className="z-[1] flex w-full items-center justify-center space-x-2 sm:max-w-32"
          >
            <p>{t('receive')}</p> <ArrowDown size={16} />
          </Link>
        </Button>

        <Button asChild variant="secondary">
          <Link
            href={ROUTES.wallet.send}
            className="z-[1] flex w-full items-center justify-center space-x-2 sm:max-w-32"
          >
            <p>{t('send')}</p> <ArrowUp size={16} />
          </Link>
        </Button>
      </div>
    </Card>
  );
};
