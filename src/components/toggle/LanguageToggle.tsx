'use client';

import { ChevronsUpDown, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import * as React from 'react';
import { FC, useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupportedLanguage } from '@/i18n';
import { cn } from '@/utils/cn';
import { localeToLanguage } from '@/views/settings/Settings';

import { Button } from '../ui/button-v2';

export const getCookie = () =>
  document.cookie
    .split('; ')
    .find(c => c.startsWith('locale='))
    ?.split('=')[1] as SupportedLanguage | undefined;

export const setCookie = (locale: SupportedLanguage) =>
  (document.cookie = `locale=${locale}; max-age=31536000; path=/;`);

export const deleteCookie = () =>
  (document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;');

export const LanguageToggle: FC<{ type?: 'compact' | 'select' }> = ({
  type = 'compact',
}) => {
  const locale = useLocale();

  const { refresh } = useRouter();

  const [language, setLanguage] = useState<SupportedLanguage | undefined>(
    typeof window !== 'undefined' ? getCookie() : undefined
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {type === 'compact' ? (
          <Button
            variant="neutral"
            size="sm"
            className="flex items-center space-x-1"
          >
            <Globe size={16} />
            <p className="uppercase">{language || locale}</p>
            <span className="sr-only">Toggle theme</span>
          </Button>
        ) : type === 'select' ? (
          <button className="flex h-10 w-full items-center justify-between space-x-2 rounded-xl border border-slate-200 px-4 dark:border-neutral-800">
            <p>{localeToLanguage(language)}</p>

            <ChevronsUpDown size={16} />
          </button>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => {
            setCookie('en');
            setLanguage('en');
            refresh();
          }}
        >
          <p className={cn(language === 'en' && 'font-bold')}>English 🇬🇧</p>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCookie('es');
            setLanguage('es');
            refresh();
          }}
        >
          <p className={cn(language === 'es' && 'font-bold')}>Español 🇪🇸</p>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            deleteCookie();
            setLanguage(undefined);
            refresh();
          }}
        >
          <p className={cn(!language && 'font-bold')}>System</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
