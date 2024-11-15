'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ReactNode, useMemo } from 'react';
import Confetti from 'react-confetti';
import { useIsClient } from 'usehooks-ts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/utils/routes';

export default function Page({
  searchParams,
}: {
  searchParams: { variant: string };
}) {
  const isClient = useIsClient();

  const t = useTranslations();

  const content = useMemo((): {
    title: string;
    description?: string;
    button?: ReactNode;
  } => {
    switch (searchParams.variant) {
      case 'waitlist':
        return {
          title: t('Public.Success.waitlist-title'),
          description: t('Public.Success.waitlist-desc'),
          button: (
            <Link
              href={ROUTES.home}
              className="mb-2 flex text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              <p className="text-xs">{t('Index.home')}</p>
            </Link>
          ),
        };

      default:
        return { title: 'Success!' };
    }
  }, [searchParams, t]);

  return (
    <main className="flex h-dvh w-full flex-col items-center justify-center">
      {isClient ? <Confetti /> : null}
      <div className="z-50 m-4">
        {content.button || null}
        <Card className="max-w-96 space-y-3 text-center">
          <CardHeader className="pb-0">
            <CardTitle className="text-xl">{content.title}</CardTitle>
          </CardHeader>
          {content.description ? (
            <CardContent className="pb-0">
              <p className="text-muted-foreground">{content.description}</p>
            </CardContent>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
