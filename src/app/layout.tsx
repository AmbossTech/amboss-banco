import './globals.css';

import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

import { Toaster } from '@/components/ui/toaster';
import { ApolloWrapper } from '@/lib/apollo/wrapper';
import { ThemeProvider } from '@/lib/themes/wrapper';

const font = Noto_Sans({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Banco',
  description: 'Banco',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();

  const serverUrl = `${process.env.URL}/api/graphql`;

  const accessToken = cookieStore.get('amboss_banco_access_token')?.value;
  const refreshToken = cookieStore.get('amboss_banco_refresh_token')?.value;

  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
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
