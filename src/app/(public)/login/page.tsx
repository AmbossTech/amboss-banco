'use client';

import { useState } from 'react';

import { LoginForm } from '@/components/form/LoginForm';
import { LoginMutation } from '@/graphql/mutations/__generated__/login.generated';
import { TwoFASteps } from '@/views/login/TwoFASteps';

export default function Page() {
  const [methods, setMethods] =
    useState<LoginMutation['login']['initial']['two_factor']>();

  if (!!methods) {
    return <TwoFASteps methods={methods} />;
  }

  return <LoginForm twoFACallback={payload => setMethods(payload)} />;
}
