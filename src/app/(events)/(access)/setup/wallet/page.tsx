import { Plus, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button-v2';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/utils/routes';

export default function Page() {
  const t = useTranslations();

  return (
    <div className="flex h-[calc(100dvh-102px)] w-full items-center justify-center p-4 lg:h-[calc(100dvh-86px)]">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {t('App.Wallet.Setup.welcome')}
          </CardTitle>

          <CardDescription className="text-base">
            {t('App.Wallet.Setup.start')}
          </CardDescription>
        </CardHeader>

        <CardContent className="pb-0">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button
              asChild
              className="flex w-full items-center justify-center space-x-2"
            >
              <Link href={ROUTES.setup.wallet.new}>
                <PlusCircle size={16} />
                <p>{t('Index.new-wallet')}</p>
              </Link>
            </Button>

            <Button
              asChild
              variant="secondary"
              className="flex w-full items-center justify-center space-x-2"
            >
              <Link href={ROUTES.setup.wallet.restore}>
                <Plus size={16} />
                <p>{t('Index.restore-wallet')}</p>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
