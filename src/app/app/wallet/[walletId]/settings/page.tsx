import { WalletSettings } from '@/views/wallet/Settings';

export default function Page({ params }: { params: { walletId: string } }) {
  return (
    <div>
      <h1 className="my-2 text-xl font-semibold">Settings</h1>

      <WalletSettings walletId={params.walletId} />
    </div>
  );
}
