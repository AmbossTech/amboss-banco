import { Shield } from 'lucide-react';

import { VaultButton } from '../button/VaultButton';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

export const VaultLockedAlert = () => {
  return (
    <Alert className="">
      <Shield className="size-4" />
      <div className="flex w-full flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <AlertTitle>Vault Locked!</AlertTitle>
          <AlertDescription>
            To create a new wallet you need to unlock your vault first. This
            allows your private key to be encrypted before being sent to the
            server.
          </AlertDescription>
        </div>
        <VaultButton lockedTitle="Unlock Vault" />
      </div>
    </Alert>
  );
};
