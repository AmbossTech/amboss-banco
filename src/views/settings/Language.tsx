import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { LanguageToggle } from '@/components/toggle/LanguageToggle';
import { ROUTES } from '@/utils/routes';

export const Language = () => {
  const t = useTranslations();

  return (
    <div className="mx-auto w-full max-w-lg py-6 lg:py-10">
      <div className="mb-6 flex w-full items-center justify-between space-x-2">
        <Link
          href={ROUTES.settings.home}
          className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1 className="text-2xl font-semibold">{t('App.Settings.language')}</h1>

        <div />
      </div>

      <p className="mb-2 font-semibold">{t('App.Settings.lang')}</p>

      <LanguageToggle type="select" />
    </div>
  );
};