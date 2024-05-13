'use client';

import { InternalHeader } from '@/components/header/InternalHeader';
import { ReceiveAddress } from '@/views/wallet/ReceiveAddress';

export default function Page({
  params,
}: {
  params: { walletId: string; accountId: string };
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />

      <ReceiveAddress accountId={params.accountId} />
    </main>
  );
}
