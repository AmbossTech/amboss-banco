import { Settings } from 'lucide-react';
import Link from 'next/link';

import { WalletBreadcrumb } from '@/components/breadcrumb/wallets';
import { RefreshWallet } from '@/components/button/RefreshWallet';
import { InternalHeader } from '@/components/header/InternalHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';
import { WalletInfo } from '@/views/wallet/Wallet';

export default function Page({ params }: { params: { walletId: string } }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />
      <div className="flex w-full max-w-5xl items-center justify-between">
        <WalletBreadcrumb id={params.walletId} />
        <div className="flex gap-2">
          <Button variant="outline">
            <Link
              href={ROUTES.app.wallet.settings(params.walletId)}
              className="flex"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <RefreshWallet walletId={params.walletId} />
        </div>
      </div>
      <WalletInfo id={params.walletId} />
    </main>
  );
}
