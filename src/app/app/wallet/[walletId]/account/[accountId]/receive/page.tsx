'use client';

import { WalletBreadcrumb } from '@/components/breadcrumb/wallets';
import { ReceiveAddress } from '@/views/wallet/ReceiveAddress';

export default function Page({
  params,
}: {
  params: { walletId: string; accountId: string };
}) {
  return (
    <div>
      <WalletBreadcrumb id={params.walletId} />
      <ReceiveAddress accountId={params.accountId} />
    </div>
  );
}
