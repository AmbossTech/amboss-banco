'use client';

import { ChevronsUpDown, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/utils/cn';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex h-10 w-full items-center justify-between space-x-2 rounded-xl border border-slate-200 px-4 dark:border-neutral-800">
          <p className="capitalize">{theme}</p>

          <ChevronsUpDown size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <p className={cn(theme === 'light' && 'font-bold')}>Light</p>

          <Sun size={16} className="ml-2" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <p className={cn(theme === 'dark' && 'font-bold')}>Dark</p>

          <Moon size={16} className="ml-2" />
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <p className={cn(theme === 'system' && 'font-bold')}>System</p>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
