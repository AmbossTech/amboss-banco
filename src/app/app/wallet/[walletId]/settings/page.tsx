import { SingleWalletBreadcrumb } from '@/components/breadcrumb/wallet';
import { WalletSettings } from '@/views/wallet/Settings';

export default function Page({ params }: { params: { walletId: string } }) {
  return (
    <div>
      <SingleWalletBreadcrumb id={params.walletId} currentTitle="Settings" />

      <h1 className="mb-2 text-xl font-semibold">Settings</h1>

      <WalletSettings walletId={params.walletId} />
    </div>
  );
}
