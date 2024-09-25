'use client';

import { ArrowLeft, Copy, CopyCheck, CornerDownRight } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { VaultButton } from '@/components/button/VaultButtonV2';
import { Button } from '@/components/ui/button-v2';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useChangeWalletNameMutation } from '@/graphql/mutations/__generated__/wallet.generated';
import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import useCopyClipboard from '@/hooks/useClipboardCopy';
import { useKeyStore } from '@/stores/keys';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

const WalletName: FC<{ walletId: string }> = ({ walletId }) => {
  const t = useTranslations('App');

  const { toast } = useToast();

  const { data, loading } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    errorPolicy: 'ignore',
  });

  const [name, setName] = useState(data?.wallets.find_one.name || '');

  const [changeName, { loading: loadingChange }] = useChangeWalletNameMutation({
    onCompleted: () => {
      toast({
        title: 'Wallet name saved.',
      });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error changing wallet name.',
        description: messages.join(', '),
      });
    },
    refetchQueries: ['getWalletDetails', 'getAllWallets'],
  });

  useEffect(() => {
    if (!data) return;
    setName(data.wallets.find_one.name);
  }, [data]);

  const hasChange = name !== data?.wallets.find_one.name;

  return (
    <div>
      <Label htmlFor="walletname">{t('Wallet.Settings.name')}</Label>

      <div className="mt-2 flex gap-2">
        <Input
          id="walletname"
          autoComplete="off"
          value={name}
          onChange={e => setName(e.target.value)}
          disabled={loading || loadingChange}
        />

        <Button
          variant="secondary"
          disabled={loading || !name || !hasChange || loadingChange}
          onClick={() => changeName({ variables: { id: walletId, name } })}
        >
          {t('save')}
        </Button>
      </div>
    </div>
  );
};

const WalletCode: FC<{ walletId: string }> = ({ walletId }) => {
  const t = useTranslations('App');

  const [copiedText, copy] = useCopyClipboard();

  const { data } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    errorPolicy: 'ignore',
  });

  const address = useMemo(() => {
    if (!data?.wallets.find_one.money_address.length) return '';

    const first = data.wallets.find_one.money_address[0];

    return first.user + '@' + first.domains[0];
  }, [data]);

  return (
    <div>
      <Label htmlFor="address">{t('miban')}</Label>

      <p className="my-2 text-sm text-neutral-400">
        {t('Wallet.Settings.miban')}
      </p>

      <div className="flex items-center gap-2">
        <Input id="address" readOnly defaultValue={address} />

        <button
          onClick={() => copy(address)}
          disabled={!address}
          className="px-2 transition-opacity hover:opacity-75 disabled:cursor-not-allowed"
        >
          {copiedText ? <CopyCheck size={24} /> : <Copy size={24} />}
        </button>
      </div>
    </div>
  );
};

const WalletMnemonic: FC<{ walletId: string }> = ({ walletId }) => {
  const t = useTranslations();

  const { toast } = useToast();

  const workerRef = useRef<Worker>();

  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);

  const [copiedMnemonic, copyMnemonic] = useCopyClipboard();

  const keys = useKeyStore(s => s.keys);

  const { data, loading: walletLoading } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error getting wallet details.',
      }),
  });

  const protectedMnemonic =
    data?.wallets.find_one.details.protected_mnemonic || '';

  const disabled = loading || walletLoading;

  const handleDecrypt = () => {
    if (!keys || !protectedMnemonic || !workerRef.current) return;

    setLoading(true);

    const message: CryptoWorkerMessage = {
      type: 'decryptMnemonic',
      payload: {
        protectedMnemonic,
        keys,
      },
    };

    workerRef.current.postMessage(message);
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'decryptMnemonic':
          setMnemonic(message.payload.mnemonic);
          break;

        case 'error':
          toast({
            variant: 'destructive',
            title: 'Error decrypting mnemonic.',
            description: `Please reach out to support. ${message.msg}`,
          });
          break;
      }

      setLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [toast]);

  return (
    <div>
      <div>
        <Label htmlFor="protectedMnemonic">{t('Common.mnemonic')}</Label>

        <p className="my-2 text-sm text-neutral-400">
          {t('App.Wallet.Settings.decrypt')}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="protectedMnemonic"
            readOnly
            defaultValue={protectedMnemonic}
          />

          {!keys ? (
            <VaultButton
              lockedTitle={t('App.Wallet.Settings.unlock')}
              variant="secondary"
              className="w-full sm:w-fit"
            />
          ) : (
            <Button
              variant="secondary"
              onClick={() => handleDecrypt()}
              disabled={disabled || !protectedMnemonic || Boolean(mnemonic)}
              className="w-full sm:w-fit"
            >
              {t('Common.decrypt')}
            </Button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-start space-x-2">
          <CornerDownRight size={20} className="text-neutral-500" />

          <Label htmlFor="mnemonic">{t('App.Wallet.Settings.decrypted')}</Label>
        </div>

        <p className="my-2 ml-7 text-sm text-orange-400">
          {t('Common.private')}
        </p>

        <div className="ml-7 flex flex-col items-center gap-2 sm:flex-row">
          <div className="flex w-full items-center gap-2">
            <Input id="mnemonic" readOnly defaultValue={mnemonic} />

            <button
              onClick={() => copyMnemonic(mnemonic)}
              disabled={!mnemonic}
              className="px-2 transition-opacity hover:opacity-75 disabled:cursor-not-allowed"
            >
              {copiedMnemonic ? <CopyCheck size={24} /> : <Copy size={24} />}
            </button>
          </div>

          <Button
            variant="secondary"
            onClick={() => setMnemonic('')}
            disabled={!mnemonic}
            className="w-full sm:w-fit"
          >
            {t('Common.clear')}
          </Button>
        </div>
      </div>
    </div>
  );
};

const WalletDescriptor: FC<{ walletId: string }> = ({ walletId }) => {
  const t = useTranslations('App.Wallet.Settings');

  const [copiedText, copy] = useCopyClipboard();

  const { data } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    errorPolicy: 'ignore',
  });

  return (
    <div>
      {data?.wallets.find_one.accounts.map((a, i) => {
        return (
          <div key={i}>
            <Label htmlFor="descriptor">
              <span className="capitalize">{a.account_type.toLowerCase()}</span>{' '}
              {t('descriptor')}
            </Label>

            <p className="my-2 text-sm text-neutral-400">{t('tech-info')}</p>

            <div className="flex items-center gap-2">
              <Input id="descriptor" readOnly defaultValue={a.descriptor} />

              <button
                onClick={() => copy(a.descriptor)}
                className="px-2 transition-opacity hover:opacity-75"
              >
                {copiedText ? <CopyCheck size={24} /> : <Copy size={24} />}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const WalletSettings = () => {
  const t = useTranslations('App.Wallet.Settings');

  const [walletId] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  return (
    <div className="mx-auto w-full max-w-lg py-4 lg:py-10">
      <div className="mb-6 flex items-center space-x-4">
        <Link
          href={ROUTES.dashboard}
          className="transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <p className="text-3xl font-semibold">{t('settings')}</p>
      </div>

      <div className="space-y-8">
        <WalletName walletId={walletId} />
        <WalletCode walletId={walletId} />
        <WalletMnemonic walletId={walletId} />
        <WalletDescriptor walletId={walletId} />
      </div>
    </div>
  );
};
