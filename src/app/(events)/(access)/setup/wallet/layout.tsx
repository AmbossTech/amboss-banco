'use client';

import { ExternalHeader } from '@/components/header/ExternalHeader';

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ExternalHeader showLang={false} />
      {children}
    </>
  );
}
