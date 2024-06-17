import './globals.css';

import type { Metadata } from 'next';
import { Noto_Sans } from 'next/font/google';
import { cookies } from 'next/headers';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();

  const accessToken = cookieStore.get('amboss_banco_access_token')?.value;
  const refreshToken = cookieStore.get('amboss_banco_refresh_token')?.value;

  console.log({ accessToken, refreshToken });
  console.log(cookieStore.getAll());

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={font.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ApolloWrapper accessToken={accessToken} refreshToken={refreshToken}>
            {children}
            <Toaster />
          </ApolloWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
