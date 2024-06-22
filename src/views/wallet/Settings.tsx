'use client';

import { Copy, CopyCheck, Shield } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { useCopyToClipboard } from 'usehooks-ts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useKeyStore } from '@/stores/keys';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

export const WalletSettings: FC<{ walletId: string }> = ({ walletId }) => {
  const workerRef = useRef<Worker>();

  const [stateLoading, setLoading] = useState(false);

  const [protectedMnemonic, setProtectedMnemonic] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  const masterKey = useKeyStore(s => s.masterKey);

  const { data, loading: walletLoading } = useGetWalletDetailsQuery({
    variables: { id: walletId },
    onError: err => console.log('ERROR', err),
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
    if (!masterKey) return;
    if (!data?.wallets.find_one.details.protected_mnemonic) return;

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'decryptMnemonic',
        payload: {
          protectedMnemonic: data.wallets.find_one.details.protected_mnemonic,
          masterKey,
        },
      };

      workerRef.current.postMessage(message);
    }
  };

  const [copiedText, copy] = useCopyToClipboard();

  const loading = stateLoading || walletLoading;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Money Address</CardTitle>
          <CardDescription>
            This is your money address. You can share this with other users to
            receive money.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="address">Money Address</Label>
            <div className="flex gap-2">
              <Input
                id="address"
                readOnly
                defaultValue={data?.wallets.find_one.money_address || ''}
              />
              <Button
                onClick={() => copy(data?.wallets.find_one.money_address || '')}
                disabled={!data?.wallets.find_one.money_address}
              >
                {copiedText ? 'Copied' : 'Copy'}
                {copiedText ? (
                  <CopyCheck className="ml-2 size-4" color="green" />
                ) : (
                  <Copy className="ml-2 size-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mnemonic</CardTitle>
          <CardDescription>View your wallets secret mnemonic</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="protectedMnemonic">Encrypted</Label>
            <div className="flex gap-2">
              <Input
                id="protectedMnemonic"
                readOnly
                defaultValue={protectedMnemonic}
              />
              <Button
                className="w-40"
                disabled={loading || !!mnemonic || !masterKey}
                onClick={() => handleDecrypt()}
              >
                Decrypt
              </Button>
            </div>
          </div>

          <div className="mt-2">
            <Label htmlFor="mnemonic">Decrypted</Label>
            <div className="flex gap-2">
              <Input
                id="mnemonic"
                readOnly
                defaultValue={mnemonic}
                placeholder="Clear text Mnemonic"
              />
              <Button
                className="w-40"
                disabled={loading || !mnemonic || !masterKey}
                onClick={() => setMnemonic('')}
              >
                Clear Memory
              </Button>
            </div>
          </div>
        </CardContent>
        {!masterKey ? (
          <CardFooter>
            <Alert variant={'destructive'}>
              <Shield color="red" className="size-4" />
              <AlertTitle>Vault Locked!</AlertTitle>
              <AlertDescription>
                To decrypt your mnemonic you need to unlock your vault first.
              </AlertDescription>
            </Alert>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
};
