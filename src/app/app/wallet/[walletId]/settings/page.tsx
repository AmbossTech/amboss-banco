import { InternalHeader } from '@/components/header/InternalHeader';
import { WalletSettings } from '@/views/wallet/Settings';

export default function Page({ params }: { params: { walletId: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />
      <WalletSettings walletId={params.walletId} />
    </main>
  );
}
