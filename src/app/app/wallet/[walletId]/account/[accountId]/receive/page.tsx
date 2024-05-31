'use client';

import { ReceiveAddress } from '@/views/wallet/ReceiveAddress';

export default function Page({
  params,
}: {
  params: { walletId: string; accountId: string };
}) {
  return (
    <div className="mt-2">
      <ReceiveAddress accountId={params.accountId} />
    </div>
  );
}
