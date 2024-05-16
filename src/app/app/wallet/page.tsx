import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';
import { UserWallets } from '@/views/app/Wallets';

export default function Page() {
  return (
    <div>
      <UserWallets />

      <div className="flex w-full items-center justify-center gap-4">
        <Button asChild>
          <Link href={ROUTES.app.wallet.new}>New Wallet</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={ROUTES.app.wallet.restore}>Restore Wallet</Link>
        </Button>
      </div>
    </div>
  );
}
