'use client';

import { Copy, CopyCheck, Loader2 } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

import { VaultButton } from '@/components/button/VaultButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useChangeWalletNameMutation } from '@/graphql/mutations/__generated__/wallet.generated';
import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useKeyStore } from '@/stores/keys';
import { handleApolloError } from '@/utils/error';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

import { Section } from '../settings/Section';

const WalletName: FC<{ walletId: string }> = ({ walletId }) => {
  const { toast } = useToast();

  const { data } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    errorPolicy: 'ignore',
  });

  const [name, setName] = useState(data?.wallets.find_one.name || '');

  const [changeName, { loading }] = useChangeWalletNameMutation({
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

  if (!data) return null;

  const hasChange = name !== data.wallets.find_one.name;

  return (
    <Section
      title={'Wallet Name'}
      description={'This is the name for this wallet.'}
    >
      <div>
        <Label htmlFor="walletname">Wallet Name</Label>
        <div className="flex gap-2">
          <Input
            id="walletname"
            autoComplete="off"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Wallet Name"
          />
          <Button
            disabled={!name || loading || !hasChange}
            onClick={() => {
              if (!name) return;
              changeName({ variables: { id: walletId, name } });
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </Section>
  );
};

const WalletMnemonic: FC<{ walletId: string }> = ({ walletId }) => {
  const { toast } = useToast();

  const workerRef = useRef<Worker>();

  const [stateLoading, setLoading] = useState(false);

  const [protectedMnemonic, setProtectedMnemonic] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  const keys = useKeyStore(s => s.keys);

  const { data, loading: walletLoading } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    onError: () =>
      toast({
        variant: 'destructive',
        title: 'Error getting wallet details.',
      }),
  });

  useEffect(() => {
    if (!data?.wallets.find_one.details.protected_mnemonic) return;
    setProtectedMnemonic(data.wallets.find_one.details.protected_mnemonic);
  }, [data]);

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
  }, []);

  const handleDecrypt = () => {
    if (!keys) return;
    if (!data?.wallets.find_one.details.protected_mnemonic) return;

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'decryptMnemonic',
        payload: {
          protectedMnemonic: data.wallets.find_one.details.protected_mnemonic,
          keys,
        },
      };

      workerRef.current.postMessage(message);
    }
  };

  const [copiedMnemonic, copyMnemonic] = useCopyToClipboard();

  const loading = stateLoading || walletLoading;

  return (
    <Section title="Mnemonic" description="View your wallets secret mnemonic.">
      <div>
        <Label htmlFor="protectedMnemonic">Encrypted</Label>
        <div className="flex gap-2">
          <Input
            id="protectedMnemonic"
            readOnly
            defaultValue={protectedMnemonic}
          />
          {!keys ? (
            <VaultButton lockedTitle="Unlock to Decrypt" />
          ) : (
            <Button
              className="w-40"
              disabled={loading || !!mnemonic || !keys}
              onClick={() => handleDecrypt()}
            >
              Decrypt
            </Button>
          )}
        </div>
      </div>

      <div className="my-2">
        <Label htmlFor="mnemonic">Decrypted</Label>
        <div className="flex gap-2">
          <Input
            id="mnemonic"
            readOnly
            defaultValue={mnemonic}
            placeholder="Clear text Mnemonic"
          />
          <Button
            disabled={loading || !mnemonic || !keys}
            onClick={() => copyMnemonic(mnemonic)}
            size={'icon'}
            className="px-2"
            variant={'outline'}
          >
            {copiedMnemonic ? (
              <CopyCheck color="green" className="size-4" />
            ) : (
              <Copy className="size-4" />
            )}
          </Button>
          <Button
            className="w-40"
            disabled={loading || !mnemonic || !keys}
            onClick={() => setMnemonic('')}
          >
            Clear Memory
          </Button>
        </div>
      </div>
    </Section>
  );
};

export const WalletSettings: FC<{ walletId: string }> = ({ walletId }) => {
  const { data, loading } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    errorPolicy: 'ignore',
  });

  const [copiedText, copy] = useCopyToClipboard();

  if (loading) {
    return (
      <div className="flex w-full justify-center py-4">
        <Loader2 className="size-4 animate-spin" />
      </div>
    );
  }

  if (!data?.wallets.find_one.id) {
    return (
      <div className="flex w-full justify-center py-4">
        <p className="text-sm text-muted-foreground">Error loading wallet.</p>
      </div>
    );
  }

  return (
    <div className="flex max-w-screen-lg flex-col gap-10 py-4 md:gap-16">
      <WalletName walletId={walletId} />
      <Section
        title="MIBAN Code"
        description="This is your MIBAN Code. You can share this with other users to
            receive money."
      >
        {!data?.wallets.find_one.money_address.length ? (
          <p className="text-sm text-muted-foreground">No MIBAN Code found.</p>
        ) : (
          data.wallets.find_one.money_address.map(a => {
            return a.domains.map(d => {
              return (
                <div key={d}>
                  <Label htmlFor="address">MIBAN Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="address"
                      readOnly
                      defaultValue={`${a.user}@${d}`}
                    />
                    <Button onClick={() => copy(`${a.user}@${d}`)}>
                      {copiedText === `${a.user}@${d}` ? 'Copied' : 'Copy'}
                      {copiedText === `${a.user}@${d}` ? (
                        <CopyCheck className="ml-2 size-4" color="green" />
                      ) : (
                        <Copy className="ml-2 size-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            });
          })
        )}
      </Section>

      <WalletMnemonic walletId={walletId} />

      <Section
        title="Details"
        description="Technical information about your wallet, helpful for advanced recovery."
      >
        {!data?.wallets.find_one.accounts.length ? (
          <p className="text-sm text-muted-foreground">No accounts found.</p>
        ) : (
          data.wallets.find_one.accounts.map((a, i) => {
            return (
              <div key={i}>
                <Label htmlFor="descriptor">
                  <span className="capitalize">
                    {a.account_type.toLowerCase()}
                  </span>{' '}
                  Descriptor
                </Label>
                <div className="flex gap-2">
                  <Input id="descriptor" readOnly defaultValue={a.descriptor} />
                  <Button onClick={() => copy(a.descriptor)}>
                    {copiedText === a.descriptor ? 'Copied' : 'Copy'}
                    {copiedText === a.descriptor ? (
                      <CopyCheck className="ml-2 size-4" color="green" />
                    ) : (
                      <Copy className="ml-2 size-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </Section>
    </div>
  );
};
