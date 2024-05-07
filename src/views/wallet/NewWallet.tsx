'use client';

import { Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useCreateWalletMutation } from '@/graphql/mutations/__generated__/wallet.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { WalletAccountType } from '@/graphql/types';
import { useKeyStore } from '@/stores/private';
import { ROUTES } from '@/utils/routes';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

const NewWalletButton = () => {
  const workerRef = useRef<Worker>();
  const { push } = useRouter();

  const masterKey = useKeyStore(s => s.masterKey);

  const { data, loading: userLoading } = useUserQuery({
    errorPolicy: 'ignore',
  });

  const [createWallet, { loading: createLoading }] = useCreateWalletMutation({
    onCompleted: () => {
      push(ROUTES.app.home);
    },
    onError: error => {
      console.log('Create wallet error', error);
    },
  });

  const [loading, setLoading] = useState(false);

  const isLoading = loading || userLoading || createLoading;

  const handleCreate = async () => {
    if (isLoading) return;
    if (!masterKey || !data?.user.symmetric_key_iv) {
      return;
    }

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'newWallet',
        payload: {
          masterKey,
          iv: data.user.symmetric_key_iv,
        },
      };

      workerRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'newWallet':
          console.log('Creating wallet', message);

          createWallet({
            variables: {
              input: {
                vault: message.payload.protectedMnemonic,
                accounts: [
                  {
                    type: WalletAccountType.Liquid,
                    liquid_descriptor: message.payload.liquidDescriptor,
                  },
                ],
              },
            },
          });

          break;

        default:
          console.error('Unhandled message type:', event.data.type);
          setLoading(false);
          break;
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [createWallet]);

  return (
    <div>
      <Button disabled={isLoading} onClick={handleCreate}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        New Wallet
      </Button>
    </div>
  );
};

export function NewWallet() {
  const masterKey = useKeyStore(s => s.masterKey);

  if (!masterKey) {
    return (
      <Alert className="max-w-5xl">
        <Shield className="h-4 w-4" />
        <AlertTitle>Vault Locked!</AlertTitle>
        <AlertDescription>
          To create a new wallet you need to unlock your vault first. This
          allows your private key to be encrypted before being sent to the
          server.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div>
      <NewWalletButton />
    </div>
  );
}
