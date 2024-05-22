'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import { VaultLockedAlert } from '@/components/vault/VaultLockedAlert';
import { useCreateWalletMutation } from '@/graphql/mutations/__generated__/wallet.generated';
import {
  UserDocument,
  useUserQuery,
} from '@/graphql/queries/__generated__/user.generated';
import { GetAllWalletsDocument } from '@/graphql/queries/__generated__/wallet.generated';
import { WalletAccountType, WalletType } from '@/graphql/types';
import { useKeyStore } from '@/stores/private';
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
  const workerRef = useRef<Worker>();
  const { push } = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mnemonic: '',
    },
  });

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
    refetchQueries: [{ query: GetAllWalletsDocument }, { query: UserDocument }],
    awaitRefetchQueries: true,
  });

  const [loading, setLoading] = useState(false);

  const isLoading = loading || userLoading || createLoading;

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    if (isLoading) return;
    if (!masterKey || !data?.user.symmetric_key_iv || !formData.mnemonic) {
      return;
    }

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'restoreWallet',
        payload: {
          mnemonic: formData.mnemonic,
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

        <Button type="submit" disabled={loading}>
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
    return <VaultLockedAlert />;
  }

  return (
    <div className="flex w-full justify-center">
      <RestoreWalletButton />
    </div>
  );
}
