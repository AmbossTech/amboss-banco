'use client';

import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../ui/use-toast';

export const LogoutButtonWithTooltip = () => {
  const t = useTranslations('Index');

  const { toast } = useToast();

  const clearKeys = useKeyStore(s => s.clear);

  const [logout] = useLogoutMutation({
    onCompleted: () => {
      clearKeys();
      localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
      window.location.assign(ROUTES.home);
    },
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error logging out.',
      }),
  });

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Account"
          onClick={() => logout()}
        >
          <LogOut className="size-6" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        {t('logout')}
      </TooltipContent>
    </Tooltip>
  );
};

export const LogoutButton = () => {
  const t = useTranslations('Index');

  const { toast } = useToast();

  const clearKeys = useKeyStore(s => s.clear);

  const [logout] = useLogoutMutation({
    onCompleted: () => {
      clearKeys();
      localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
      window.location.assign(ROUTES.home);
    },
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error logging out.',
      }),
  });

  return (
    <button
      className="flex w-full items-center space-x-3 px-2 font-semibold"
      aria-label="Logout"
      onClick={() => logout()}
    >
      <LogOut size={24} />
      <p>{t('logout')}</p>
    </button>
  );
};
