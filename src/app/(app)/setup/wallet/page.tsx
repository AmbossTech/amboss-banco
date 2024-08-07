import { CircleEqual, PlusCircle } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/utils/routes';

export default function Page() {
  return (
    <div className="flex justify-center p-4">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to BancoLibre.</CardTitle>

          <CardDescription>
            Setup your first wallet to start your journey.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-2">
            <Button asChild size={'sm'} className="w-full">
              <Link href={ROUTES.setup.wallet.new}>
                <PlusCircle className="mr-1 size-4" />
                New Wallet
              </Link>
            </Button>
            <Button variant="secondary" asChild size={'sm'} className="w-full">
              <Link href={ROUTES.setup.wallet.restore}>
                <CircleEqual className="mr-1 size-4" />
                Restore Wallet
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
