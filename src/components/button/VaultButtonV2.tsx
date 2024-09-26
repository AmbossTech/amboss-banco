'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { Loader2, Lock, Unlock, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FC, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  CheckPasswordDocument,
  CheckPasswordMutation,
  CheckPasswordMutationVariables,
} from '@/graphql/mutations/__generated__/checkPassword.generated';
import {
  LoginPasskeyAuthDocument,
  LoginPasskeyAuthMutation,
  LoginPasskeyAuthMutationVariables,
  useLoginPasskeyInitAuthMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { cn } from '@/utils/cn';
import { handleApolloError } from '@/utils/error';
import {
  cleanupWebauthnAuthenticationResponse,
  getPRFSalt,
} from '@/utils/passkey';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Button } from '../ui/button-v2';
import { Drawer, DrawerContent, DrawerTrigger } from '../ui/drawer';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

type Variants = 'primary' | 'secondary' | 'neutral' | null | undefined;

const formSchema = z.object({
  password: z.string(),
});

const UnlockDialogContent: FC<{ callback: () => void }> = ({ callback }) => {
  const t = useTranslations('App.Wallet.Vault');

  const workerRef = useRef<Worker>();

  const client = useApolloClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  const { toast } = useToast();

  const setKeys = useKeyStore(s => s.setKeys);

  const [loading, setLoading] = useState(false);

  const {
    data,
    loading: userLoading,
    error,
  } = useUserQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting user data.',
        description: messages.join(', '),
      });
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (
      loading ||
      userLoading ||
      error ||
      !data?.user.email ||
      !data?.user.protected_symmetric_key ||
      !workerRef.current
    ) {
      return;
    }

    setLoading(true);

    const message: WorkerMessage = {
      type: 'generateMaster',
      payload: {
        email: data.user.email,
        password: values.password,
        protectedSymmetricKey: data.user.protected_symmetric_key,
      },
    };

    workerRef.current.postMessage(message);
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'generateMaster': {
          const [, error] = await toWithError(
            client.mutate<
              CheckPasswordMutation,
              CheckPasswordMutationVariables
            >({
              mutation: CheckPasswordDocument,
              variables: { password: message.payload.masterPasswordHash },
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);

            toast({
              variant: 'destructive',
              title: 'Unable to unlock.',
              description: messages.join(', '),
            });

            form.reset();
          } else {
            setKeys({
              masterKey: message.payload.masterKey,
              protectedSymmetricKey: message.payload.protectedSymmetricKey,
            });
            callback();
          }
          break;
        }

        case 'error':
          toast({
            variant: 'destructive',
            title: 'Error unlocking.',
            description: message.msg,
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
  }, [client, toast, callback, form, setKeys]);

  return (
    <>
      <p className="mb-4 text-2xl font-semibold">{t('unlock-wallet')}</p>

      <p className="mb-6 text-sm font-medium text-neutral-400">{t('seed')}</p>

      <Form {...form}>
        <form
          onSubmit={event => {
            form.handleSubmit(handleSubmit)(event);

            event?.preventDefault?.();
            event?.stopPropagation?.();
          }}
          className="space-y-4"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('password')}</FormLabel>
                <FormControl>
                  <Input
                    autoFocus
                    type="password"
                    disabled={loading || userLoading || Boolean(error)}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={
              loading ||
              userLoading ||
              Boolean(error) ||
              !form.getValues().password
            }
            className="flex w-full items-center justify-center"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
            ) : null}
            {t('unlock')}
          </Button>
        </form>
      </Form>
    </>
  );
};

const VaultPasswordButton: FC<{
  lockedTitle: string;
  className?: string;
  variant?: Variants;
  size?: 'md';
}> = ({ lockedTitle, className, variant, size }) => {
  const t = useTranslations('App.Wallet.Vault');

  const keys = useKeyStore(s => s.keys);

  const clearKeys = useKeyStore(s => s.clear);

  const [open, setOpen] = useState(false);

  const handleClear = () => {
    clearKeys();
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          type="button"
          variant={variant}
          size={size}
          className={cn('flex items-center justify-center', className)}
        >
          {keys ? (
            <>
              <Unlock className="mr-2" size={16} />
              {t('unlocked')}
            </>
          ) : (
            <>
              <Lock className="mr-2" size={16} />
              {lockedTitle}
            </>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent>
        {!!keys ? (
          <>
            <p className="mb-4 text-2xl font-semibold">{t('lock-wallet')}</p>

            <p className="mb-6 text-sm font-medium text-neutral-400">
              {t('seed')}
            </p>

            <Button
              type="button"
              onClick={() => handleClear()}
              className="w-full"
            >
              {t('lock')}
            </Button>
          </>
        ) : (
          <UnlockDialogContent
            callback={() => {
              setOpen(false);
            }}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
};

const PasskeyVaultButton: FC<{
  lockedTitle: string;
  className?: string;
  variant?: Variants;
  size?: 'md';
  protectedSymmetricKey: string;
  passkeyId: string;
}> = ({
  lockedTitle,
  className,
  variant,
  size,
  protectedSymmetricKey,
  passkeyId,
}) => {
  const t = useTranslations('App.Wallet.Vault');

  const client = useApolloClient();

  const keys = useKeyStore(s => s.keys);
  const setKeys = useKeyStore(s => s.setKeys);
  const clearKeys = useKeyStore(s => s.clear);

  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const [setup, { loading: addLoading }] = useLoginPasskeyInitAuthMutation({
    onCompleted: data => {
      try {
        handleAuthentication(JSON.parse(data.passkey.init_authenticate));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error enabling encryption for Passkey.',
        });
      }
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting Passkey details.',
        description: messages.join(', '),
      });
    },
  });

  const handleAuthentication = async (
    options: PublicKeyCredentialRequestOptionsJSON
  ) => {
    setLoading(true);

    try {
      const originalResponse = await startAuthentication({
        ...options,
        extensions: {
          ...options.extensions,
          prf: { eval: { first: await getPRFSalt() } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });

      const { response, prfSecretHash } =
        await cleanupWebauthnAuthenticationResponse(originalResponse);

      if (!prfSecretHash) {
        throw new Error('This Passkey does not have encryption capabilities.');
      }

      if ('prf' in response.clientExtensionResults) {
        alert(
          'PRF result should never be sent to the server. This should only happen if a developer made a mistake.'
        );
        return;
      }

      const [, error] = await toWithError(
        client.mutate<
          LoginPasskeyAuthMutation,
          LoginPasskeyAuthMutationVariables
        >({
          mutation: LoginPasskeyAuthDocument,
          variables: {
            input: {
              options: JSON.stringify(response),
            },
          },
        })
      );

      if (error) {
        const messages = handleApolloError(error as ApolloError);

        toast({
          variant: 'destructive',
          title: 'Unable to unlock.',
          description: messages.join(', '),
        });

        return;
      }

      setKeys({
        masterKey: prfSecretHash,
        protectedSymmetricKey,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Unlocking.',
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!keys) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('flex items-center justify-center', className)}
        disabled={loading || addLoading}
        onClick={() => {
          setup({ variables: { id: passkeyId } });
        }}
      >
        <Lock className="mr-2" size={16} />
        {lockedTitle}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={cn('flex items-center justify-center', className)}
      onClick={() => {
        clearKeys();
      }}
    >
      <Unlock className="mr-2" size={16} />
      {t('unlocked')}
    </Button>
  );
};

export const VaultButton: FC<{
  lockedTitle?: string;
  className?: string;
  variant?: Variants;
  size?: 'md';
}> = ({ lockedTitle, className, variant, size }) => {
  const t = useTranslations();

  const lockedTitleFinal = lockedTitle || t('App.Wallet.Vault.locked');

  const { data, loading, error } = useUserQuery();

  if (loading) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('flex items-center justify-center', className)}
        disabled
      >
        <Loader2 className="mr-2 animate-spin" size={16} />
        {lockedTitleFinal}
      </Button>
    );
  }

  if (error || !data?.user.protected_symmetric_key) {
    return (
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn('flex items-center justify-center', className)}
        disabled
      >
        <X className="mr-2" size={16} />
        {t('Common.error')}
      </Button>
    );
  }

  if (data.user.using_passkey_id) {
    return (
      <PasskeyVaultButton
        lockedTitle={lockedTitleFinal}
        className={className}
        variant={variant}
        size={size}
        protectedSymmetricKey={data.user.protected_symmetric_key}
        passkeyId={data.user.using_passkey_id}
      />
    );
  }

  return (
    <VaultPasswordButton
      lockedTitle={lockedTitleFinal}
      className={className}
      variant={variant}
      size={size}
    />
  );
};
