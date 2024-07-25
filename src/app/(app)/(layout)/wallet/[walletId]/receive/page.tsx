'use client';

import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';

export default function Page({ params }: { params: { walletId: string } }) {
  const { data } = useGetWalletDetailsQuery({
    variables: { id: params.walletId },
  });

  console.log(data);

  return <div className="mt-4 flex justify-center">{params.walletId}</div>;
}
