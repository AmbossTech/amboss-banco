'use client';

import { SingleWalletBreadcrumb } from '@/components/breadcrumb/wallet';
import { ReceiveAddress } from '@/views/wallet/ReceiveAddress';

export default function Page({
  params,
}: {
  params: { walletId: string; accountId: string };
}) {
  return (
    <div>
      <SingleWalletBreadcrumb id={params.walletId} currentTitle="Receive" />
      <ReceiveAddress accountId={params.accountId} />
    </div>
  );
}
