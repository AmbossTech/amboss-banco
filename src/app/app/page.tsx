import Link from 'next/link';

import { InternalHeader } from '@/components/header/InternalHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <InternalHeader />

      <div className="flex w-full items-center justify-center gap-4">
        <Button asChild>
          <Link href={ROUTES.app.wallet.new}>New Wallet</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={ROUTES.app.wallet.restore}>Restore Wallet</Link>
        </Button>
      </div>
    </main>
  );
}
