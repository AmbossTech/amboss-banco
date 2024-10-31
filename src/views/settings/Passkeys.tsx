'use client';

import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';
import {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';
import { format } from 'date-fns';
import { ArrowLeft, KeySquare, Loader2, RectangleEllipsis } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { VaultButton } from '@/components/button/VaultButtonV2';
import { Button } from '@/components/ui/button-v2';
import { useToast } from '@/components/ui/use-toast';
import {
  useLoginPasskeyAddMutation,
  useLoginPasskeyAuthMutation,
  useLoginPasskeyInitAuthMutation,
  useLoginPasskeyVerifyMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import {
  GetAccountPasskeysQuery,
  useGetAccountPasskeysQuery,
} from '@/graphql/queries/__generated__/passkey.generated';
import { useKeyStore } from '@/stores/keys';
import { handleApolloError } from '@/utils/error';
import {
  cleanupWebauthnAuthenticationResponse,
  cleanupWebauthnRegistrationResponse,
  getPRFSalt,
} from '@/utils/passkey';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Setting } from './Setting';

const PasskeyList = () => {
  const t = useTranslations();

  const { toast } = useToast();

  const keys = useKeyStore(s => s.keys);

  const workerRef = useRef<Worker>();
  const [loadingWorker, setLoadingWorker] = useState(true);

  const { data } = useGetAccountPasskeysQuery();
  const passkeys = data?.passkey.find_many || [];

  const [setup, { loading: setupLoading }] = useLoginPasskeyInitAuthMutation({
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
        title: 'Error enabling encryption for Passkey.',
        description: messages.join(', '),
      });
    },
  });

  const [verify, { loading: verifyLoading }] = useLoginPasskeyAuthMutation({
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Passkey Encryption Enabled',
      });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error setting up Passkey for encryption.',
        description: messages.join(', '),
      });
    },
    refetchQueries: ['getAccountPasskeys'],
  });

  const handleAuthentication = async (
    options: PublicKeyCredentialRequestOptionsJSON
  ) => {
    if (!workerRef.current || !keys) return;

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

      const message: WorkerMessage = {
        type: 'enablePasskeyEncryption',
        payload: {
          prfSecret: prfSecretHash,
          options: JSON.stringify(response),
          keys,
        },
      };

      workerRef.current.postMessage(message);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error setting up Passkey for encryption.',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'enablePasskeyEncryption': {
          const { options, protected_symmetric_key } = message.payload;

          verify({
            variables: {
              input: { options, protected_symmetric_key },
            },
          });

          break;
        }

        case 'loaded':
          setLoadingWorker(false);
          return;
      }

      setLoadingWorker(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoadingWorker(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [toast, verify]);

  const loading = loadingWorker || setupLoading || verifyLoading;

  const getStatus = (
    passkey: GetAccountPasskeysQuery['passkey']['find_many'][0]
  ) => {
    if (passkey.encryption_enabled) {
      return (
        <p className="text-sm font-medium text-green-500 dark:text-green-400">
          {t('App.Settings.encrypt-enabled')}
        </p>
      );
    }

    if (passkey.encryption_available) {
      if (!keys) {
        return (
          <VaultButton
            lockedTitle={t('App.Settings.unlock-encrypt')}
            variant="secondary"
          />
        );
      }

      return (
        <Button
          variant="secondary"
          onClick={() => setup({ variables: { id: passkey.id } })}
          disabled={loading}
        >
          {t('App.Settings.enable-encrypt')}
        </Button>
      );
    }

    return (
      <p className="text-sm font-medium text-green-500 dark:text-green-400">
        {t('App.Settings.login-only')}
      </p>
    );
  };

  if (!passkeys.length) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-3 mt-7 w-full border-b border-slate-200 pb-2 text-lg font-semibold text-slate-600 dark:border-neutral-800 dark:text-neutral-400">
        {t('App.Settings.saved-passkeys')}
      </h3>

      <div className="w-full space-y-6">
        {passkeys.map(p => (
          <Setting
            key={p.id}
            title={p.name || t('Public.Login.passkey')}
            description={format(p.created_at, 'MMM do, yyyy - HH:mm')}
            icon={<RectangleEllipsis size={24} />}
          >
            {getStatus(p)}
          </Setting>
        ))}
      </div>
    </div>
  );
};

export const Passkeys = () => {
  const t = useTranslations();
  const { toast } = useToast();

  const {
    data: passkeysData,
    loading: passkeysLoading,
    error: passkeysError,
  } = useGetAccountPasskeysQuery({
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting Passkeys.',
        description: messages.join(', '),
      });
    },
  });

  const hasPasskeys = passkeysData?.passkey.find_many.length;

  const [add, { loading: addLoading }] = useLoginPasskeyAddMutation({
    onCompleted: data => {
      try {
        handleRegistration(JSON.parse(data.passkey.add));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error adding Passkey.',
        });
      }
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error adding Passkey.',
        description: messages.join(', '),
      });
    },
  });

  const [verify, { loading: verifyLoading }] = useLoginPasskeyVerifyMutation({
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Passkey Login Enabled',
      });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error verifying Passkey.',
        description: messages.join(', '),
      });
    },
    refetchQueries: ['getAccountPasskeys'],
  });

  const handleRegistration = async (
    options: PublicKeyCredentialCreationOptionsJSON
  ) => {
    try {
      const originalResponse = await startRegistration({
        ...options,
        extensions: {
          ...options.extensions,
          prf: { eval: { first: await getPRFSalt() } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
      });

      const { response } =
        cleanupWebauthnRegistrationResponse(originalResponse);

      verify({ variables: { options: JSON.stringify(response) } });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error setting up Passkey.',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const loading = passkeysLoading || addLoading || verifyLoading;

  return (
    <div className="mx-auto w-full max-w-lg py-6 lg:py-10">
      <div className="mb-6 flex w-full items-center justify-between space-x-2">
        <Link
          href={ROUTES.settings.home}
          className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1 className="text-2xl font-semibold">{t('App.Settings.passkeys')}</h1>

        <div />
      </div>

      <p className="mb-6 font-semibold">{t('App.Settings.login-wallet')}</p>

      <div className="flex w-full items-center justify-between space-x-2">
        <Setting
          title={t('App.Settings.passkeys')}
          description={
            passkeysLoading || passkeysError
              ? ''
              : hasPasskeys
                ? t('App.Settings.added')
                : t('App.Settings.off')
          }
          icon={<KeySquare size={24} />}
          className={hasPasskeys ? 'text-green-500 dark:text-green-400' : ''}
        />

        <Button
          variant="secondary"
          onClick={() => add()}
          disabled={loading}
          className="flex items-center justify-center"
        >
          {addLoading || verifyLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
          ) : null}
          {t('App.Settings.add-passkey')}
        </Button>
      </div>

      <PasskeyList />
    </div>
  );
};
