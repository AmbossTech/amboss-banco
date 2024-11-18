'use client';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { VaultButton } from '@/components/button/VaultButtonV2';
import { Button } from '@/components/ui/button-v2';
import { useToast } from '@/components/ui/use-toast';
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
  const t = useTranslations();

  const [, setValue] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const setCurrentContact = useContactStore(s => s.setCurrentContact);
  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  const { toast } = useToast();

  const workerRef = useRef<Worker>();
  const { push } = useRouter();

  const keys = useKeyStore(s => s.keys);

  const [createWallet, { loading: createLoading }] = useCreateWalletMutation({
    onCompleted: data => {
      setValue(data.wallets.create.id);
      push(ROUTES.dashboard);
      setCurrentContact(undefined);
      setCurrentPaymentOption(undefined);

      toast({
        title: 'New wallet created!',
      });

      setLoading(false);
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error creating new wallet.',
        description: messages.join(', '),
      });

      setLoading(false);
    },
    refetchQueries: [{ query: GetAllWalletsDocument }, { query: UserDocument }],
    awaitRefetchQueries: true,
  });

  const [loading, setLoading] = useState(false);

  const isLoading = loading || createLoading;

  const handleCreate = async () => {
    if (isLoading || !keys) return;

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'newWallet',
        payload: {
          keys,
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
    <Button
      onClick={handleCreate}
      disabled={isLoading}
      className="flex w-full items-center justify-center space-x-2"
    >
      {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
      <p>{t('Index.new-wallet')}</p>
    </Button>
  );
};

export function NewWallet() {
  const t = useTranslations();

  const keys = useKeyStore(s => s.keys);

  return (
    <div className="relative mx-auto my-6 w-full max-w-lg space-y-6 px-4">
      <Link
        href={ROUTES.dashboard}
        className="absolute -top-1 left-2 p-2 transition-opacity hover:opacity-75"
      >
        <ArrowLeft size={24} />
      </Link>

      <h1 className="text-center text-2xl font-semibold">
        {t('App.Wallet.Setup.create')}
      </h1>

      <p className="text-sm">{t('App.Wallet.Setup.no-sensitive')}</p>

      {!keys ? <VaultButton className="w-full" /> : <NewWalletButton />}
    </div>
  );
}
