'use client';

import Confetti from 'react-confetti';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Page({
  searchParams,
}: {
  searchParams: { text: string };
}) {
  return (
    <>
      <Confetti />
      <Card className="max-w-96 text-center">
        <CardHeader>
          <CardTitle>
            {searchParams.text
              ? decodeURIComponent(searchParams.text)
              : 'Success!'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl">🥳</p>
        </CardContent>
      </Card>
    </>
  );
}
