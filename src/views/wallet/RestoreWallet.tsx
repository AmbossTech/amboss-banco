'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useLocalStorage } from 'usehooks-ts';
import { z } from 'zod';

import { VaultButton } from '@/components/button/VaultButtonV2';
import { Button } from '@/components/ui/button-v2';
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

const formSchema = z
  .object({
    mnemonic: z.string(),
  })
  .refine(
    data => {
      const split = data.mnemonic.trim().split(' ');
      return split.length === 12 || split.length === 24;
    },
    {
      message: 'Mnemonic needs to be 12 or 24 words.',
      path: ['mnemonic'],
    }
  );

const RestoreWalletButton = () => {
const t = useTranslations();
  
  const [, setValue] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const setCurrentContact = useContactStore(s => s.setCurrentContact);
  const setCurrentPaymentOption = useChat(s => s.setCurrentPaymentOption);

  const { toast } = useToast();

  const workerRef = useRef<Worker>();
  const { push } = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mnemonic: '',
    },
  });

  const keys = useKeyStore(s => s.keys);

  const [createWallet, { loading: createLoading }] = useCreateWalletMutation({
    onCompleted: data => {
      setValue(data.wallets.create.id);
      push(ROUTES.dashboard);
      setCurrentContact(undefined);
      setCurrentPaymentOption(undefined);

      toast({
        title: 'Wallet restored!',
      });

      setLoading(false);
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error restoring wallet.',
        description: messages.join(', '),
      });

      setLoading(false);
    },
    refetchQueries: [{ query: GetAllWalletsDocument }, { query: UserDocument }],
    awaitRefetchQueries: true,
  });

  const [loading, setLoading] = useState(false);

  const isLoading = loading || createLoading;

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    if (isLoading || !keys || !formData.mnemonic) return;

    setLoading(true);

    if (workerRef.current) {
      const message: CryptoWorkerMessage = {
        type: 'restoreWallet',
        payload: {
          mnemonic: formData.mnemonic,
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
              <FormLabel>{t('App.Wallet.Setup.seed')}</FormLabel>
              <FormControl>
                <Input
                  type="mnemonic"
                  autoComplete="off"
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>{t('App.Wallet.Setup.input')}</FormDescription>
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={!form.getValues().mnemonic || isLoading}
          className="flex w-full items-center justify-center space-x-2"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          <p>{t('App.Wallet.Setup.restore')}</p>
        </Button>
      </form>
    </Form>
  );
};

export function RestoreWallet() {
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
        {t('Index.restore-wallet')}
      </h1>

      <p className="text-sm">{t('App.Wallet.Setup.no-sensitive')}</p>

      {!keys ? <VaultButton className="w-full" /> : <RestoreWalletButton />}
    </div>
  );
}
