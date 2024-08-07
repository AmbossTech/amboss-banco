import './globals.css';

import type { Metadata } from 'next';
import { IBM_Plex_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import PlausibleProvider from 'next-plausible';

import { Toaster } from '@/components/ui/toaster';
import { ApolloWrapper } from '@/lib/apollo/wrapper';
import { ThemeProvider } from '@/lib/themes/wrapper';

const font = IBM_Plex_Sans({
  weight: ['100', '200', '300', '400', '500', '600', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: process.env.URL ? new URL(process.env.URL) : undefined,
  title: 'BancoLibre',
  description: 'BancoLibre',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();

  const serverUrl = `${process.env.URL}/api/graphql`;
  const enablePlausible = process.env.ENABLE_PLAUSIBLE === 'true';
  const plausibleURL = process.env.PLAUSIBLE_DOMAIN || 'bancolibre.com';

  const accessToken = cookieStore.get('amboss_banco_access_token')?.value;
  const refreshToken = cookieStore.get('amboss_banco_refresh_token')?.value;

  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      {enablePlausible ? (
        <head>
          <PlausibleProvider domain={plausibleURL} />
        </head>
      ) : null}
      <body className={font.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ApolloWrapper
              serverUrl={serverUrl}
              accessToken={accessToken}
              refreshToken={refreshToken}
            >
              {children}
              <Toaster />
            </ApolloWrapper>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
