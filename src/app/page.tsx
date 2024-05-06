import Link from 'next/link';

import { ExternalHeader } from '@/components/header/ExternalHeader';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/routes';

export default function Page() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-2 2xl:p-24">
      <ExternalHeader />

      <div className="flex w-full items-center justify-center gap-4">
        <Button asChild>
          <Link href={ROUTES.login}>Login</Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href={ROUTES.signup}>Sign Up</Link>
        </Button>
      </div>
    </main>
  );
}
