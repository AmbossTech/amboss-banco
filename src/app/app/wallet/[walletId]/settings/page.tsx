import { SingleWalletBreadcrumb } from '@/components/breadcrumb/wallet';
import { WalletSettings } from '@/views/wallet/Settings';

export default function Page({ params }: { params: { walletId: string } }) {
  return (
    <div>
      <SingleWalletBreadcrumb id={params.walletId} currentTitle="Settings" />
      <WalletSettings walletId={params.walletId} />
    </div>
  );
}
