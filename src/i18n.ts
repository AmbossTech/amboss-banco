import { cookies, headers } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export type SupportedLanguage = 'en' | 'es';
const defaultLocale = 'en';

export default getRequestConfig(async () => {
  let locale: SupportedLanguage;

  const cookieStore = cookies();
  const localeCookie = cookieStore.get('locale')?.value as
    | SupportedLanguage
    | undefined;

  const headersList = headers();
  const localeHeader = headersList.get('Accept-Language');

  if (localeCookie) {
    locale = localeCookie;
  } else if (localeHeader?.includes('es')) {
    locale = 'es';
  } else if (localeHeader?.includes('en')) {
    locale = 'en';
  } else {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
