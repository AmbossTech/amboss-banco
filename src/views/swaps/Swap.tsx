import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { FC } from 'react';

import bitcoin from '/public/images/bitcoin.png';
import liquid from '/public/images/liquid.jpg';
import { SimpleSwap } from '@/graphql/types';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';

const AssetLogo: FC<{ coin: string }> = ({ coin }) => {
  const classname = 'h-10 w-10 rounded-full object-cover';

  switch (coin) {
    case 'BTC':
      return <Image src={bitcoin} alt="bitcoin" className={classname} />;
    case 'L-BTC':
      return <Image src={liquid} alt="liquid" className={classname} />;
    default:
      return <div className="h-10 w-10 rounded-full bg-primary" />;
  }
};

export const Swap: FC<{ data: SimpleSwap }> = ({ data }) => {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="w-full space-y-1 overflow-x-auto whitespace-nowrap rounded-xl bg-slate-100 px-2 py-1.5 dark:bg-neutral-900">
      <p className="text-center text-xs font-medium text-slate-600 dark:text-neutral-400">
        {data.provider}
      </p>

      <div className="flex w-full items-center justify-between space-x-2">
        <div className="flex shrink-0 items-center space-x-2">
          <AssetLogo coin={data.deposit_coin} />

          <div>
            <p className="font-medium">
              {data.deposit_amount
                ? numberWithPrecisionAndDecimals(data.deposit_amount, 0)
                : '-'}
            </p>

            <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
              {data.deposit_coin}
            </p>
          </div>
        </div>

        <ArrowRight size={20} className="shrink-0" />

        <div className="flex shrink-0 items-center space-x-2">
          <div className="text-right">
            <p className="font-medium">
              {data.settle_amount
                ? numberWithPrecisionAndDecimals(data.settle_amount, 0)
                : '-'}
            </p>

            <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
              {data.settle_coin}
            </p>
          </div>

          <AssetLogo coin={data.settle_coin} />
        </div>
      </div>

      <p className="text-center text-xs font-medium text-slate-600 dark:text-neutral-400">
        {format(data.created_at, 'MMM dd, yyyy - HH:mm', {
          locale: locale === 'es' ? es : undefined,
        })}{' '}
        (
        {locale === 'es'
          ? t('App.Wallet.ago') +
            ' ' +
            formatDistanceToNowStrict(data.created_at, {
              locale: es,
            })
          : formatDistanceToNowStrict(data.created_at) +
            ' ' +
            t('App.Wallet.ago')}
        )
      </p>
    </div>
  );
};
