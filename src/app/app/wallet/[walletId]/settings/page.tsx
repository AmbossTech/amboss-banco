import { WalletSettings } from '@/views/wallet/Settings';

export default function Page({ params }: { params: { walletId: string } }) {
  return <WalletSettings walletId={params.walletId} />;
}
