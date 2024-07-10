'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { VaultLockedAlert } from '@/components/vault/VaultLockedAlert';
import { useCreateWalletMutation } from '@/graphql/mutations/__generated__/wallet.generated';
import { UserDocument } from '@/graphql/queries/__generated__/user.generated';
import { GetAllWalletsDocument } from '@/graphql/queries/__generated__/wallet.generated';
import { WalletAccountType, WalletType } from '@/graphql/types';
import { useChat, useContactStore } from '@/stores/contacts';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

const NewWalletButton = () => {
  const [, setValue] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const setCurrentContact = useContactStore(s => s.setCurrentContact);
  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  const { toast } = useToast();

  const workerRef = useRef<Worker>();
  const { push } = useRouter();

  const masterKey = useKeyStore(s => s.masterKey);

  const [createWallet, { loading: createLoading }] = useCreateWalletMutation({
    onCompleted: data => {
      setValue(data.wallets.create.id);
      push(ROUTES.dashboard);
      setCurrentContact(undefined);
      setCurrentPaymentOption(undefined);

      toast({
        title: 'New wallet created!',
      });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error creating new wallet.',
        description: messages.join(', '),
      });
    },
    refetchQueries: [{ query: GetAllWalletsDocument }, { query: UserDocument }],
    awaitRefetchQueries: true,
  });

  const [loading, setLoading] = useState(false);

  const isLoading = loading || createLoading;

  const handleCreate = async () => {
    if (isLoading) return;
    if (!masterKey) {
      return;
    }

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'newWallet',
        payload: {
          masterKey,
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
          createWallet({
            variables: {
              input: {
                secp256k1_key_pair: message.payload.secp256k1_key_pair,
                details: {
                  type: WalletType.ClientGenerated,
                  protected_mnemonic: message.payload.protectedMnemonic,
                },
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
    <Button disabled={isLoading} onClick={handleCreate} className="w-full">
      {isLoading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
      New Wallet
    </Button>
  );
};

export function NewWallet() {
  const masterKey = useKeyStore(s => s.masterKey);

  if (!masterKey) {
    return (
      <div>
        <h1 className="mx-2 mb-2 font-semibold">Create New Wallet</h1>
        <VaultLockedAlert />
      </div>
    );
  }

  return (
    <Card className="mx-4">
      <CardHeader>
        <CardTitle>Create New Wallet</CardTitle>
        <CardDescription>
          The wallet will be created and encrypted client-side. No sensitive
          information is stored on the server.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <div className="flex w-full justify-center">
          <NewWalletButton />
        </div>
      </CardFooter>
    </Card>
  );
}
