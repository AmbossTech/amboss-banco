'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import bolt11 from 'bolt11';
import { Loader2, SquareArrowOutUpRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  BroadcastLiquidTransactionDocument,
  BroadcastLiquidTransactionMutation,
  BroadcastLiquidTransactionMutationVariables,
} from '@/graphql/mutations/__generated__/broadcastLiquidTransaction.generated';
import {
  PayLightningInvoiceDocument,
  PayLightningInvoiceMutation,
  PayLightningInvoiceMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useWalletInfo } from '@/hooks/wallet';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { handleApolloError } from '@/utils/error';
import { numberWithPrecisionAndDecimals } from '@/utils/numbers';
import { ROUTES } from '@/utils/routes';
import { shorten } from '@/utils/string';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

import { VaultButton } from '../button/VaultButton';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';

const formSchema = z.object({
  invoice: z.string().min(1, { message: 'A Lightning invoice is mandatory' }),
});

const Decoded: FC<{ invoice: string }> = ({ invoice }) => {
  const decoded = useMemo(() => {
    if (!invoice) return;

    try {
      const { payeeNodeKey, satoshis } = bolt11.decode(invoice);

      return { type: 'DECODED', satoshis, payeeNodeKey };
    } catch (error) {
      return { type: 'ERROR' };
    }
  }, [invoice]);

  if (!decoded) {
    return null;
  }

  if (decoded.type === 'ERROR' || !decoded.satoshis || !decoded.payeeNodeKey) {
    return (
      <div className="w-full text-center">
        <p className="text-xs text-muted-foreground">Error decoding invoice.</p>
      </div>
    );
  }

  return (
    <div className="border-t py-4">
      <Label>Amount</Label>
      <Input
        readOnly
        contentEditable={'false'}
        value={numberWithPrecisionAndDecimals(decoded.satoshis, 0) + ' sats'}
      />
      <Label>Destination</Label>
      <div className="flex gap-1">
        <Input
          readOnly
          contentEditable={'false'}
          value={shorten(decoded.payeeNodeKey)}
        />
        <Button asChild variant={'outline'} size={'icon'}>
          <Link href={`https://amboss.space/node/${decoded.payeeNodeKey}`}>
            <SquareArrowOutUpRight className="size-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
};

export const SendInvoiceForm: FC<{
  walletId: string;
  accountId: string;
}> = ({ walletId, accountId }) => {
  const workerRef = useRef<Worker>();

  const client = useApolloClient();

  const { toast } = useToast();

  const { push } = useRouter();

  const walletInfo = useWalletInfo();

  const [loading, setLoading] = useState(true);

  const masterKey = useKeyStore(s => s.masterKey);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoice: '',
    },
  });

  const watchInvoice = form.watch(['invoice']);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'loaded':
          setLoading(false);
          break;

        case 'signPset':
          const [, error] = await toWithError(
            client.mutate<
              BroadcastLiquidTransactionMutation,
              BroadcastLiquidTransactionMutationVariables
            >({
              mutation: BroadcastLiquidTransactionDocument,
              variables: {
                input: {
                  wallet_account_id: message.payload.wallet_account_id,
                  signed_pset: message.payload.signedPset,
                },
              },
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);

            toast({
              variant: 'destructive',
              title: 'Error Sending Money',
              description: messages.join(', '),
            });

            setLoading(false);
            return;
          }

          toast({
            title: 'Money Sent!',
            description: `Money has been sent.`,
          });

          push(ROUTES.dashboard);

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
  }, [client, push, toast, walletId]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (loading) return;

    setLoading(true);

    const [result, error] = await toWithError(
      client.mutate<
        PayLightningInvoiceMutation,
        PayLightningInvoiceMutationVariables
      >({
        mutation: PayLightningInvoiceDocument,
        variables: {
          invoiceInput: {
            invoice: values.invoice,
          },
          payInput: {
            account_id: accountId,
          },
        },
      })
    );

    if (error) {
      const messages = handleApolloError(error as ApolloError);

      toast({
        variant: 'destructive',
        title: 'Error Sending Money',
        description: messages.join(', '),
      });

      setLoading(false);
      return;
    }

    if (
      !result.data?.pay.lightning_invoice ||
      !walletInfo.protected_mnemonic ||
      !masterKey
    ) {
      setLoading(false);
      return;
    }

    if (!workerRef.current) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: result.data.pay.lightning_invoice.wallet_account.id,
        mnemonic: walletInfo.protected_mnemonic,
        descriptor: result.data.pay.lightning_invoice.wallet_account.descriptor,
        pset: result.data.pay.lightning_invoice.base_64,
        masterKey,
      },
    };

    workerRef.current.postMessage(message);
  };

  return (
    <Card className="w-full max-w-96">
      <CardHeader>
        <CardTitle>Send To Invoice</CardTitle>
      </CardHeader>{' '}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="invoice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lightning Invoice</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="lnbc20u1pn8fejxpp5..."
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Decoded invoice={watchInvoice[0]} />

            <div className="flex items-center justify-center">
              {masterKey ? (
                <Button type="submit" disabled={loading} className="w-full">
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
      </CardContent>
    </Card>
  );
};
