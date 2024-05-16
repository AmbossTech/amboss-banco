import { Settings } from 'lucide-react';
import Link from 'next/link';

import { WalletBreadcrumb } from '@/components/breadcrumb/wallets';
import { RefreshWallet } from '@/components/button/RefreshWallet';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';
import { WalletInfo } from '@/views/wallet/Wallet';

export default function Page({ params }: { params: { walletId: string } }) {
  return (
    <div>
      <div className="flex w-full items-center justify-between">
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
    </div>
  );
}
