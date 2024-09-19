'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, CopyCheck, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

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
import useCopyClipboard from '@/hooks/useClipboardCopy';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';
import {
  CryptoWorkerMessage,
  CryptoWorkerResponse,
} from '@/workers/crypto/types';

import { Button } from '../ui/button-v2';
import { Label } from '../ui/label';
import { useToast } from '../ui/use-toast';

const FormSchema = z.object({
  email: z.string().email().min(5, {
    message: 'Invalid email.',
  }),
  password: z.string().min(8, {
    message: 'Invalid password.',
  }),
  mnemonic: z.string().min(5, {
    message: 'Invalid mnemonic.',
  }),
  symmetric: z.string().min(5, {
    message: 'Invalid symmetric key.',
  }),
});

export const RecoverForm = () => {
  const r = useTranslations('Public.Recover');
  const c = useTranslations('Common');

  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      mnemonic: '',
      symmetric: '',
    },
  });

  const workerRefAccount = useRef<Worker>();
  const workerRefCrypto = useRef<Worker>();

  const [loading, setLoading] = useState(false);
  const [seed, setSeed] = useState('');
  const [copiedText, copy] = useCopyClipboard();

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (loading || !workerRefAccount.current || !workerRefCrypto.current)
      return;

    setLoading(true);

    const message: WorkerMessage = {
      type: 'generateMaster',
      payload: {
        email: data.email,
        password: data.password,
        protectedSymmetricKey: data.symmetric,
      },
    };

    workerRefAccount.current.postMessage(message);
  };

  useEffect(() => {
    workerRefAccount.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRefAccount.current.onmessage = async event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'generateMaster': {
          if (workerRefCrypto.current) {
            const newMessage: CryptoWorkerMessage = {
              type: 'decryptMnemonic',
              payload: {
                protectedMnemonic: form.getValues().mnemonic,
                keys: {
                  masterKey: message.payload.masterKey,
                  protectedSymmetricKey: message.payload.protectedSymmetricKey,
                },
              },
            };

            workerRefCrypto.current.postMessage(newMessage);
          }
          break;
        }

        case 'error':
          toast({
            variant: 'destructive',
            title: 'Error decrypting mnemonic.',
            description: `Please reach out to support. ${message.msg}`,
          });

          setLoading(false);
          break;
      }
    };

    workerRefAccount.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRefAccount.current) workerRefAccount.current.terminate();
    };
  }, [form, toast]);

  useEffect(() => {
    workerRefCrypto.current = new Worker(
      new URL('../../workers/crypto/crypto.ts', import.meta.url)
    );

    workerRefCrypto.current.onmessage = event => {
      const message: CryptoWorkerResponse = event.data;

      switch (message.type) {
        case 'decryptMnemonic':
          setSeed(message.payload.mnemonic);
          toast({
            title: 'Wallet Recovered!',
            description: 'Mnemonic has been decrypted.',
          });
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

    workerRefCrypto.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRefCrypto.current) workerRefCrypto.current.terminate();
    };
  }, [toast]);

  return (
    <div className="mx-auto max-w-96 px-4 py-10">
      <h1 className="mb-4 text-center text-2xl font-semibold lg:text-3xl">
        {r('recover')}
      </h1>

      <p className="mb-4 text-center">{r('description')}</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{c('email')}</FormLabel>
                <FormControl>
                  <Input placeholder="satoshi@nakamoto.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{c('password')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={c('your-password')}
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mnemonic"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{c('mnemonic')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>{c('combo')}</FormDescription>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="symmetric"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{r('symmetric')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
                <FormDescription>{c('combo')}</FormDescription>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={loading}
            className="!mt-6 flex w-full items-center justify-center"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
            ) : null}
            {c('decrypt')}
          </Button>
        </form>
      </Form>

      <div className="mb-4 mt-14 space-y-2">
        <Label htmlFor="seed">{r('decrypted')}</Label>

        <div className="flex items-center space-x-2">
          <Input readOnly value={seed} id="seed" />

          <button
            onClick={() => copy(seed)}
            disabled={!seed}
            className="transition-opacity hover:opacity-75"
          >
            {copiedText === seed ? <CopyCheck size={24} /> : <Copy size={24} />}
          </button>
        </div>

        <p className="text-sm text-neutral-400">{c('private')}</p>
      </div>

      <Button
        variant="secondary"
        onClick={() => {
          setSeed('');
          form.reset();
        }}
        disabled={!seed || loading}
      >
        {c('clear')}
      </Button>
    </div>
  );
};
