import { format, formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import { ArrowDown, ArrowUp } from 'lucide-react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { FC } from 'react';

import { cn } from '@/utils/cn';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';
import { ROUTES } from '@/utils/routes';

export const Transaction: FC<{
  id: string;
  balance: string;
  precision: number;
  date: string | undefined | null;
  formatted_balance: string;
  ticker: string;
}> = ({ id, balance, precision, date, formatted_balance, ticker }) => {
  const t = useTranslations();
  const locale = useLocale();

  const balanceNum = Number(balance);

  const formatted = numberWithPrecisionAndDecimals(
    parseFloat(balance),
    precision
  );

  return (
    <Link href={ROUTES.transactions.tx(id)} className="block">
      <div className="group flex w-full items-center justify-between space-x-2 overflow-x-auto whitespace-nowrap rounded-xl bg-slate-100 px-2 py-1 transition-colors dark:bg-neutral-900 dark:hover:bg-neutral-800">
        <div className="flex items-center space-x-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition-colors group-hover:bg-slate-100 dark:bg-neutral-800 group-hover:dark:bg-neutral-800">
            {balanceNum < 0 ? (
              <ArrowUp size={24} />
            ) : (
              <ArrowDown
                size={24}
                className="text-green-500 dark:text-green-400"
              />
            )}
          </div>

          {date ? (
            <div>
              <p className="font-medium">
                {locale === 'es'
                  ? t('App.Wallet.Transactions.ago') +
                    ' ' +
                    formatDistanceToNowStrict(date, {
                      locale: es,
                    })
                  : formatDistanceToNowStrict(date) +
                    ' ' +
                    t('App.Wallet.Transactions.ago')}
              </p>

              <p className="text-sm text-slate-600 dark:text-neutral-400">
                {format(date, 'MMM dd, yyyy')}
              </p>
            </div>
          ) : (
            <p>{t('App.Wallet.Transactions.pending')}</p>
          )}
        </div>

        <div className="text-right">
          <p
            className={cn(
              'font-medium',
              balanceNum > 0 && 'text-green-500 dark:text-green-400'
            )}
          >
            {formatted_balance.includes('-')
              ? '-' + formatted_balance.replaceAll('-', '')
              : '+' + formatted_balance}
          </p>

          <p className="text-sm text-slate-600 dark:text-neutral-400">
            {formatted.includes('-') ? formatted : '+' + formatted} {ticker}
          </p>
        </div>
      </div>
    </Link>
  );
};
