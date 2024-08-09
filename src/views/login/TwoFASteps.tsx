'use client';

import { ChevronRight } from 'lucide-react';
import { FC, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { LoginMutation } from '@/graphql/mutations/__generated__/login.generated';
import { TwoFactorMethod } from '@/graphql/types';

import { OTPForm } from './OTPForm';
import { PasskeyForm } from './PasskeyForm';

export const TwoFASteps: FC<{
  methods: LoginMutation['login']['initial']['two_factor'];
}> = ({ methods }) => {
  const [form, setForm] = useState<TwoFactorMethod | undefined>();

  const methodInfo = useMemo(() => {
    const methodList = methods?.methods || [];

    const hasOTP = methodList.some(m => m.method === TwoFactorMethod.Otp);
    const hasPasskey = methodList.some(
      m => m.method === TwoFactorMethod.Passkey
    );

    const differentAvailableTypes = [hasOTP ? 1 : 0, hasPasskey ? 1 : 0].reduce(
      (p, c) => p + c,
      0
    );

    return {
      hasOTP,
      hasPasskey,
      differentAvailableTypes,
    };
  }, [methods]);

  const getMethodForm = (method: TwoFactorMethod) => {
    if (!methods?.session_id) {
      return (
        <p className="text-sm text-muted-foreground">
          {`Error loading ${method} form.`}
        </p>
      );
    }

    switch (method) {
      case TwoFactorMethod.Otp:
        return <OTPForm session_id={methods.session_id} />;
      case TwoFactorMethod.Passkey:
        return <PasskeyForm session_id={methods.session_id} />;
      default:
        return (
          <p className="text-sm text-muted-foreground">
            {`Error loading ${method} form.`}
          </p>
        );
    }
  };

  if (!methods?.methods.length || !methods.session_id) {
    return (
      <p className="text-sm text-muted-foreground">
        Error loading account 2FA methods.
      </p>
    );
  }

  if (methodInfo.differentAvailableTypes === 1) {
    return getMethodForm(methods.methods[0].method);
  }

  if (!!form) {
    return (
      <div className="flex flex-col gap-4">
        {getMethodForm(form)}
        <Button variant={'link'} onClick={() => setForm(undefined)}>
          More Methods <ChevronRight className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4">
      <h1 className="font-bold">Two Factor Methods</h1>
      {methodInfo.hasOTP ? (
        <Button
          variant={'outline'}
          className="w-full p-6"
          onClick={() => {
            setForm(TwoFactorMethod.Otp);
          }}
        >
          <div className="flex w-full items-center justify-between">
            <h3 className="font-semibold leading-none tracking-tight">
              One-Time Password
            </h3>
            <ChevronRight className="size-5" />
          </div>
        </Button>
      ) : null}

      {methodInfo.hasPasskey ? (
        <Button
          variant={'outline'}
          className="w-full p-6"
          onClick={() => {
            setForm(TwoFactorMethod.Passkey);
          }}
        >
          <div className="flex w-full items-center justify-between">
            <h3 className="font-semibold leading-none tracking-tight">
              Passkey
            </h3>
            <ChevronRight className="size-5" />
          </div>
        </Button>
      ) : null}
    </div>
  );
};
