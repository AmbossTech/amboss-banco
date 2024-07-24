import './globals.css';

import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import PlausibleProvider from 'next-plausible';

import { Toaster } from '@/components/ui/toaster';
import { ApolloWrapper } from '@/lib/apollo/wrapper';
import { ThemeProvider } from '@/lib/themes/wrapper';

const font = Noto_Sans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'MiBanco',
  description: 'MiBanco',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();

  const serverUrl = `${process.env.URL}/api/graphql`;
  const enablePlausible = process.env.ENABLE_PLAUSIBLE === 'true';
  const plausibleURL = process.env.PLAUSIBLE_DOMAIN || 'mibanco.app';

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
