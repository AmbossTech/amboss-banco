'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useBroadcastLiquidTransactionMutation } from '@/graphql/mutations/__generated__/broadcastLiquidTransaction.generated';
import { useCreateLiquidTransactionMutation } from '@/graphql/mutations/__generated__/createLiquidTransaction.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useKeyStore } from '@/stores/private';
import { numberWithoutPrecision } from '@/utils/numbers';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

import { VaultButton } from '../button/VaultButton';

const formSchema = z.object({
  destination: z.string().min(1, { message: 'A destination is mandatory' }),
  assetId: z.string().min(1, { message: 'An asset is mandatory' }),
  amount: z.string().min(1, { message: 'An amount is mandatory' }),
  feeRate: z.string().min(1, { message: 'A fee rate is mandatory' }),
});

export const SendForm: FC<{
  walletId: string;
  accountId: string;
  assetId: string | undefined;
}> = ({ walletId, accountId, assetId }) => {
  const workerRef = useRef<Worker>();

  const { data: userData } = useUserQuery();

  const [stateLoading, setStateLoading] = useState(false);

  const masterKey = useKeyStore(s => s.masterKey);

  const {
    data,
    loading: walletLoading,
    error,
  } = useGetWalletQuery({
    variables: { id: walletId },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      destination: '',
      assetId,
      amount: '',
      feeRate: '0.1',
    },
  });

  const selectedAsset = form.getValues('assetId');

  const [startSend, { data: sendData, loading: sendLoading }] =
    useCreateLiquidTransactionMutation({
      onError: error => console.error('ERRORRR', error),
    });

  const [broadcast, { loading: broadcastLoading }] =
    useBroadcastLiquidTransactionMutation();

  const loading =
    stateLoading || walletLoading || broadcastLoading || sendLoading;

  useEffect(() => {
    console.log('SEND FOR SIGNING');
    if (!sendData) return;
    if (!masterKey) return;
    if (!userData) return;
    if (!data?.wallets.find_one) return;

    const currentAccount = data.wallets.find_one.accounts.find(
      a => a.id === accountId
    );

    if (!currentAccount) return;

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'signPset',
        payload: {
          mnemonic: data.wallets.find_one.vault,
          descriptor: currentAccount.descriptor,
          pset: sendData.wallets.create_liquid_transaction.base_64,
          masterKey,
          iv: userData.user.symmetric_key_iv,
        },
      };

      workerRef.current.postMessage(message);
    }
  }, [sendData, userData, masterKey, data, accountId]);

  const asset = useMemo(() => {
    if (walletLoading || error) return;
    if (!data?.wallets.find_one.accounts.length) return;

    const currentAccount = data.wallets.find_one.accounts.find(
      a => a.id === accountId
    );

    if (!currentAccount) return;

    const firstAsset = currentAccount.liquid_assets[0];
    const foundAsset = selectedAsset
      ? currentAccount.liquid_assets.find(a => a.asset_id === selectedAsset)
      : undefined;

    const currentAsset = foundAsset || firstAsset;

    if (!currentAccount) return;

    return currentAsset;
  }, [data, walletLoading, error, accountId, selectedAsset]);

  const accountAssets = useMemo(() => {
    if (walletLoading || error) return [];
    if (!data?.wallets.find_one.accounts.length) return [];

    const currentAccount = data.wallets.find_one.accounts.find(
      a => a.id === accountId
    );

    if (!currentAccount) return [];

    return currentAccount.liquid_assets;
  }, [data, walletLoading, error, accountId]);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'signPset':
          console.log('READY FOR BROADCAST', message);

          const currentAccount = data?.wallets.find_one.accounts.find(
            a => a.id === accountId
          );

          console.log({ currentAccount });

          if (!currentAccount) return;

          broadcast({
            variables: {
              input: {
                wallet_account_id: currentAccount.id,
                signed_pset: message.payload.signedPset,
              },
            },
          });

          break;

        default:
          console.error('Unhandled message type:', event.data.type);
          break;
      }

      setStateLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setStateLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [broadcast, accountId, data]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (loading) return null;

    startSend({
      variables: {
        input: {
          wallet_account_id: accountId,
          fee_rate: Number(values.feeRate),
          recipients: [
            {
              address: values.destination,
              amount: numberWithoutPrecision(
                values.amount,
                asset?.asset_info.precision || 0
              ),
              asset_id: values.assetId,
            },
          ],
        },
      },
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="destination"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination</FormLabel>
              <FormControl>
                <Input placeholder="bc1qxvay4an52gcghxq..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="1000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="assetId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose which asset you want to send." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {accountAssets.map(a => (
                      <SelectItem key={a.asset_id} value={a.asset_id}>
                        {a.asset_info.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="feeRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fee Rate</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          {masterKey ? (
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Send
            </Button>
          ) : (
            <VaultButton lockedTitle="Unlock to Send" />
          )}
        </div>
      </form>
    </Form>
  );
};
