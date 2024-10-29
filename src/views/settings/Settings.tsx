'use client';

import {
  Brush,
  KeySquare,
  Languages,
  ShieldHalf,
  SquareAsterisk,
} from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

import { getCookie } from '@/components/toggle/LanguageToggle';
import { useToast } from '@/components/ui/use-toast';
import { useGetAccountTwoFactorMethodsQuery } from '@/graphql/queries/__generated__/2fa.generated';
import { useGetAccountPasskeysQuery } from '@/graphql/queries/__generated__/passkey.generated';
import { SupportedLanguage } from '@/i18n';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

import { Setting } from './Setting';

export const passwordStrength = () => {
  const pw = localStorage.getItem('pw');
  if (!pw) return 'Unknown Strength';

  const entropy = Number(pw);

  switch (true) {
    case entropy < 50:
      return 'Very Weak';
    case entropy < 100:
      return 'Weak';
    case entropy < 150:
      return 'Good';
    case entropy < 200:
      return 'Strong';
    case entropy >= 200:
      return 'Very Strong';
    default:
      return 'Unknown Strength';
  }
};

const themeText = (theme: string | undefined) => {
  switch (theme) {
    case 'dark':
      return 'Dark Mode';
    case 'light':
      return 'Light Mode';
    case 'system':
      return 'System Mode';
    default:
      return 'Unknown Mode';
  }
};

export const localeToLanguage = (locale: SupportedLanguage | undefined) => {
  switch (locale) {
    case 'en':
      return 'English';
    case 'es':
      return 'Español';
    case undefined:
      return 'System';
    default:
      return 'Unknown';
  }
};

export const Settings = () => {
  const t = useTranslations();
  const { toast } = useToast();

  const password = passwordStrength();

  const { data, loading, error } = useGetAccountTwoFactorMethodsQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting 2FA methods.',
        description: messages.join(', '),
      });
    },
  });

  const twoFAEnabled = data?.two_factor.find_many.find(m => m.enabled);

  const {
    data: passkeysData,
    loading: passkeysLoading,
    error: passkeysError,
  } = useGetAccountPasskeysQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting Passkeys.',
        description: messages.join(', '),
      });
    },
  });

  const hasPasskeys = passkeysData?.passkey.find_many.length;

  const { theme } = useTheme();

  const locale = typeof window !== 'undefined' ? getCookie() : undefined;

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <h1 className="mb-5 px-3 text-3xl font-semibold">
        {t('Index.settings')}
      </h1>

      <div>
        <Link
          href={ROUTES.settings.password}
          className="block rounded-2xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-900"
        >
          <Setting
            title={t('Common.password')}
            description={password}
            icon={<SquareAsterisk size={24} />}
            alert={['Very Weak', 'Weak'].includes(password)}
            className={
              password === 'Very Strong'
                ? 'text-green-500 dark:text-green-400'
                : ''
            }
          />
        </Link>

        <Link
          href={ROUTES.settings.twofa}
          className="block rounded-2xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-900"
        >
          <Setting
            title={t('App.Settings.2fa')}
            description={
              loading || error
                ? ''
                : twoFAEnabled
                  ? t('App.Settings.enabled')
                  : t('App.Settings.not-set')
            }
            icon={<ShieldHalf size={24} />}
            className={twoFAEnabled && 'text-green-500 dark:text-green-400'}
          />
        </Link>

        <Link
          href={ROUTES.settings.passkeys}
          className="block rounded-2xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-900"
        >
          <Setting
            title={t('App.Settings.passkeys')}
            description={
              passkeysLoading || passkeysError
                ? ''
                : hasPasskeys
                  ? t('App.Settings.enabled')
                  : t('App.Settings.not-set')
            }
            icon={<KeySquare size={24} />}
            className={hasPasskeys ? 'text-green-500 dark:text-green-400' : ''}
          />
        </Link>

        <Link
          href={ROUTES.settings.appearance}
          className="block rounded-2xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-900"
        >
          <Setting
            title={t('App.Settings.appearance')}
            description={themeText(theme)}
            icon={<Brush size={24} />}
          />
        </Link>

        <Link
          href={ROUTES.settings.language}
          className="block rounded-2xl p-3 transition-colors hover:bg-slate-100 dark:hover:bg-neutral-900"
        >
          <Setting
            title={t('App.Settings.language')}
            description={localeToLanguage(locale)}
            icon={<Languages size={24} />}
          />
        </Link>
      </div>
    </div>
  );
};
