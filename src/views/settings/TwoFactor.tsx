'use client';

import { Loader2 } from 'lucide-react';
import { useMemo } from 'react';

import { useGetAccountTwoFactorMethodsQuery } from '@/graphql/queries/__generated__/2fa.generated';
import { TwoFactorMethod } from '@/graphql/types';

import { OTP } from './TwoFactorOtp';
import { Passkey } from './TwoFactorPasskey';

export const TwoFactor = () => {
  const { data, loading, error } = useGetAccountTwoFactorMethodsQuery();

  const hasOTP = useMemo(() => {
    if (loading || error) return false;

    return !!data?.two_factor.find_many.some(
      m => m.method === TwoFactorMethod.Otp
    );
  }, [data, loading, error]);

  const renderContent = () => {
    if (loading) {
      return <Loader2 className="size-4 animate-spin" />;
    }

    if (error) {
      return (
        <p className="text-sm text-muted-foreground">
          Error loading your 2FA methods.
        </p>
      );
    }

    return (
      <div className="flex max-w-screen-lg flex-col gap-10 pt-4 md:gap-16">
        <OTP hasAlready={hasOTP} />
        <Passkey />
      </div>
    );
  };

  return (
    <div>
      <h1 className="my-2 text-xl font-semibold">
        Secure Your Account with 2FA
      </h1>

      {renderContent()}
    </div>
  );
};
