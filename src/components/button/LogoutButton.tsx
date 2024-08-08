'use client';

import { LogOut } from 'lucide-react';

import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { ROUTES } from '@/utils/routes';

import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { useToast } from '../ui/use-toast';

export const LogoutButtonWithTooltip = () => {
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
          className="mt-auto rounded-lg"
          aria-label="Account"
          onClick={() => logout()}
        >
          <LogOut className="size-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        Logout
      </TooltipContent>
    </Tooltip>
  );
};

export const LogoutButton = () => {
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
    <Button
      variant="outline"
      className="mt-auto w-full rounded-lg"
      aria-label="Logout"
      onClick={() => logout()}
    >
      <LogOut className="mr-2 h-5 w-5" />
      Logout
    </Button>
  );
};
