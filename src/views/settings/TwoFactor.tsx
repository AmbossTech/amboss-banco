'use client';

import { useGetAccountTwoFactorMethodsQuery } from '@/graphql/queries/__generated__/2fa.generated';

export const TwoFactor = () => {
  const { data, loading, error } = useGetAccountTwoFactorMethodsQuery();

  console.log({ data, loading, error });

  return (
    <div>
      <h1 className="my-2 text-xl font-semibold">2FA</h1>

      <div className="flex max-w-screen-lg flex-col gap-10 pt-4 md:gap-16"></div>
    </div>
  );
};
