'use client';

import { Check, Languages } from 'lucide-react';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SupportedLanguage } from '@/i18n';

const setCookie = (locale: SupportedLanguage) =>
  (document.cookie = `locale=${locale}; max-age=31536000; path=/;`);

const deleteCookie = () =>
  (document.cookie = 'locale=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;');

export function LanguageToggle() {
  const { refresh } = useRouter();

  const [language, setLanguage] = useState<SupportedLanguage | undefined>(
    () => {
      const localeCookie = document.cookie
        .split('; ')
        .find(c => c.startsWith('locale='))
        ?.split('=')[1] as SupportedLanguage | undefined;

      return localeCookie;
    }
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages className="h-[1.2rem] w-[1.2rem]" />
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
          English {language === 'en' && <Check size={14} className="ml-1" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            setCookie('es');
            setLanguage('es');
            refresh();
          }}
        >
          Español {language === 'es' && <Check size={14} className="ml-1" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            deleteCookie();
            setLanguage(undefined);
            refresh();
          }}
        >
          System {!language && <Check size={14} className="ml-1" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
