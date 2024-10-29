'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useGetAccountTwoFactorMethodsQuery } from '@/graphql/queries/__generated__/2fa.generated';
import { TwoFactorMethod } from '@/graphql/types';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

import { OTP } from './TwoFactorOtp';
import { Passkey } from './TwoFactorPasskey';

export type View = 'default' | 'otp';

export const TwoFactor = () => {
  const t = useTranslations();
  const { toast } = useToast();

  const [view, setView] = useState<View>('default');

  const { data, loading, error } = useGetAccountTwoFactorMethodsQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting user data.',
        description: messages.join(', '),
      });
    },
  });

  const hasOTP = useMemo(() => {
    if (loading || error) return false;

    return !!data?.two_factor.find_many.some(
      m => m.method === TwoFactorMethod.Otp
    );
  }, [data, loading, error]);

  const hasPasskey = useMemo(() => {
    if (loading || error) return false;

    return !!data?.two_factor.find_many.some(
      m => m.method === TwoFactorMethod.Passkey
    );
  }, [data, loading, error]);

  return (
    <div className="mx-auto w-full max-w-lg py-6 lg:py-10">
      <div className="mb-6 flex w-full items-center justify-between space-x-2">
        {view === 'default' ? (
          <>
            <Link
              href={ROUTES.settings.home}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-75"
            >
              <ArrowLeft size={24} />
            </Link>

            <h1 className="text-2xl font-semibold">
              {t('App.Settings.setup-2fa')}
            </h1>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setView('default');
              }}
              className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-75"
            >
              <ArrowLeft size={24} />
            </button>

            <h1 className="text-2xl font-semibold">
              {t('App.Settings.auth-app')}
            </h1>
          </>
        )}

        <div />
      </div>

      <div className="space-y-6">
        {loading ? (
          <>
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-12 w-full rounded-xl" />
          </>
        ) : error ? null : (
          <>
            <OTP hasAlready={hasOTP} view={view} setView={setView} />
            {view === 'default' ? <Passkey hasAlready={hasPasskey} /> : null}
          </>
        )}
      </div>
    </div>
  );
};
