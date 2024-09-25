import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FC } from 'react';

import success from '/public/icons/success.svg';
import { Button } from '@/components/ui/button-v2';
import { formatFiat } from '@/utils/fiat';
import { ROUTES } from '@/utils/routes';

export const Success: FC<{ reset: () => void; amountUSDInput: string }> = ({
  reset,
  amountUSDInput,
}) => {
  const t = useTranslations();

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <div className="relative mb-14">
        <button
          onClick={() => reset()}
          className="absolute left-0 top-0 transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </button>

        <p className="text-center text-2xl font-semibold">
          {t('App.Wallet.success')}
        </p>
      </div>

      <Image src={success} alt="success" className="mx-auto" />

      <p className="my-6 text-center text-3xl font-medium">
        {t('App.Wallet.started')}
      </p>

      <p className="mb-2 text-center text-4xl font-semibold">
        {formatFiat(Number(amountUSDInput))}
      </p>

      <p className="mb-6 text-center text-sm text-slate-600 dark:text-neutral-400">
        {t('App.Wallet.fee')}: {t('App.Wallet.unknown')}
      </p>

      <Button variant="secondary" className="mx-auto" asChild>
        <Link href={ROUTES.dashboard}>{t('Common.done')}</Link>
      </Button>
    </div>
  );
};
