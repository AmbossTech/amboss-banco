'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { VaultLockedAlert } from '@/components/vault/VaultLockedAlert';
import { useCreateWalletMutation } from '@/graphql/mutations/__generated__/wallet.generated';
import { UserDocument } from '@/graphql/queries/__generated__/user.generated';
import { GetAllWalletsDocument } from '@/graphql/queries/__generated__/wallet.generated';
import { WalletAccountType, WalletType } from '@/graphql/types';
import { useKeyStore } from '@/stores/keys';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

const formSchema = z
  .object({
    mnemonic: z.string(),
  })
  .refine(
    data => {
      const split = data.mnemonic.split(' ');
      return split.length === 12 || split.length === 24;
    },
    {
      message: 'Mnemonic needs to be 12 or 24 words.',
      path: ['mnemonic'],
    }
  );

const RestoreWalletButton = () => {
  const { toast } = useToast();

  const workerRef = useRef<Worker>();
  const { push } = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mnemonic: '',
    },
  });

  const masterKey = useKeyStore(s => s.masterKey);

  const [createWallet, { loading: createLoading }] = useCreateWalletMutation({
    onCompleted: () => {
      push(ROUTES.dashboard);
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error restoring wallet.',
        description: messages.join(', '),
      });
    },
    refetchQueries: [{ query: GetAllWalletsDocument }, { query: UserDocument }],
    awaitRefetchQueries: true,
  });

  const [loading, setLoading] = useState(false);

  const isLoading = loading || createLoading;

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    if (!masterKey || !formData.mnemonic) {
      return;
    }

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'restoreWallet',
        payload: {
          mnemonic: formData.mnemonic,
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

        case 'error':
          toast({
            variant: 'destructive',
            title: 'Error restoring wallet.',
            description: message.msg,
          });
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
  }, [createWallet, toast]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="w-full space-y-6"
      >
        <FormField
          control={form.control}
          name="mnemonic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mnemonic</FormLabel>
              <FormControl>
                <Input
                  type="mnemonic"
                  placeholder="super secret words"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>
                Input a 12 or 24 word mnemonic to restore the wallet.
              </FormDescription>
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Import
        </Button>
      </form>
    </Form>
  );
};

export function RestoreWallet() {
  const masterKey = useKeyStore(s => s.masterKey);

  if (!masterKey) {
    return (
      <div>
        <h1 className="mb-2 font-semibold">Restore Wallet</h1>
        <VaultLockedAlert />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Restore Wallet</CardTitle>
        <CardDescription>
          The wallet will be created and encrypted client-side. No sensitive
          information is stored on the server.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex w-full justify-center">
          <RestoreWalletButton />
        </div>
      </CardContent>
    </Card>
  );
}
