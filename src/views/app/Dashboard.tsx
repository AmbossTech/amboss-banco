'use client';

import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';

import { WalletInfo } from '../wallet/Wallet';

export const Dashboard = () => {
  const { data } = useUserQuery();

  if (!data?.user.default_wallet_id) {
    return <div>No default wallet</div>;
  }

  return (
    <div className="py-4">
      <WalletInfo id={data?.user.default_wallet_id} />
    </div>
  );
};
