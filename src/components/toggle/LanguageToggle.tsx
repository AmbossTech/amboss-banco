'use client';

import { Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';
import { useIsClient } from 'usehooks-ts';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupportedLanguage } from '@/i18n';
import { cn } from '@/utils/cn';

import { Button } from '../ui/button-v2';

const getCookie = () =>
  document.cookie
    .split('; ')
    .find(c => c.startsWith('locale='))
    ?.split('=')[1] as SupportedLanguage | undefined;

const setCookie = (locale: SupportedLanguage) =>
  (document.cookie = `locale=${locale}; max-age=31536000; path=/;`);

const deleteCookie = () =>
  (document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;');

export function LanguageToggle() {
  const isClient = useIsClient();

  const { refresh } = useRouter();

  const [language, setLanguage] = useState<SupportedLanguage | undefined>(
    typeof window !== 'undefined' ? getCookie() : undefined
  );

  if (!isClient) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="neutral"
          size="sm"
          className="flex items-center space-x-1"
        >
          <Globe size={16} />
          <p className="uppercase">
            {language || document.documentElement.lang}
          </p>
          <span className="sr-only">Toggle theme</span>
        </Button>
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
            window.location.reload();
          }}
        >
          <p className={cn(!language && 'font-bold')}>System</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
