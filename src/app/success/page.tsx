'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
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

  const content = useMemo((): {
    title: string;
    description?: string;
    button?: ReactNode;
  } => {
    switch (searchParams.variant) {
      case 'waitlist':
        return {
          title: "You're On the List!",
          description:
            "You're one step closer to experiencing MiBanco. We'll notify you as soon as we're ready for you.",
          button: (
            <Link
              href={ROUTES.home}
              className="mb-2 flex text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-4" />
              <p className="text-xs">Home</p>
            </Link>
          ),
        };

      default:
        return { title: 'Success!' };
    }
  }, [searchParams]);

  return (
    <main className="flex h-screen w-full flex-col items-center justify-center">
      {isClient ? <Confetti /> : null}
      <div className="z-50 mx-4 md:mx-0">
        {content.button || null}
        <Card className="max-w-96 text-center">
          <CardHeader>
            <CardTitle className="text-xl">{content.title}</CardTitle>
          </CardHeader>
          {content.description ? (
            <CardContent>
              <p className="text-muted-foreground">{content.description}</p>
            </CardContent>
          ) : null}
        </Card>
      </div>
    </main>
  );
}
