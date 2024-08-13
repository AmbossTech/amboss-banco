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
import { Key } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { VaultButton } from '@/components/button/VaultButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Section } from './Section';

const PasskeyList = () => {
  const workerRef = useRef<Worker>();

  const { data, loading, error } = useGetAccountPasskeysQuery();

  const [loadingWorker, setLoadingWorker] = useState(true);

  const passkeys = data?.passkey.find_many || [];

  const { toast } = useToast();

  const keys = useKeyStore(s => s.keys);

  const hasWithoutEncryption = useMemo(() => {
    if (!data?.passkey.find_many.length) return false;
    return data.passkey.find_many.some(
      p => p.encryption_available && !p.encryption_enabled
    );
  }, [data]);

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

  const [verify, { loading: verifyLoading }] = useLoginPasskeyAuthMutation({
    onCompleted: () => {
      toast({
        title: 'Passkey Setup',
        description: 'Passkey encryption has been configured for this passkey.',
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
        throw new Error('This passkey does not have encryption capabilities.');
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

  if (loading || error) {
    return null;
  }

  const getBadge = (
    passkey: GetAccountPasskeysQuery['passkey']['find_many'][0]
  ) => {
    if (passkey.encryption_enabled) {
      return (
        <Badge variant={'outline'}>
          <Key className="mr-1 size-3" color={'green'} />
          Encryption Enabled
        </Badge>
      );
    }

    if (passkey.encryption_available) {
      if (!keys) {
        return (
          <Badge variant={'outline'}>
            <Key className="mr-1 size-3" />
            Encryption Available
          </Badge>
        );
      }

      return (
        <button
          className="cursor-pointer"
          disabled={addLoading || verifyLoading || loadingWorker || !keys}
          onClick={() => {
            if (!!keys) {
              setup({ variables: { id: passkey.id } });
            }
          }}
        >
          <Badge>Enable Encryption</Badge>
        </button>
      );
    }

    return <Badge variant={'outline'}>Only Login</Badge>;
  };

  if (!passkeys.length) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 mt-4 text-sm font-medium">Saved Passkeys</h3>
      {!keys && hasWithoutEncryption ? (
        <VaultButton
          size="sm"
          lockedTitle="Unlock to enable encryption for passkeys."
          className="mb-2"
        />
      ) : null}
      <div className="flex flex-col gap-1">
        {passkeys.map((d, index) => (
          <div key={d.id}>
            <div className="flex flex-wrap items-center justify-start">
              <p className="text-xs font-medium">
                {index + 1}. {d.name || 'Passkey'}
              </p>
              <p className="mx-2 text-xs text-muted-foreground">
                {format(d.created_at, 'MMM do, yyyy - HH:mm')}
              </p>
              {getBadge(d)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const PasskeySettings = () => {
  const { toast } = useToast();

  const [setup, { loading: addLoading }] = useLoginPasskeyAddMutation({
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
        title: 'Error getting Passkey details.',
        description: messages.join(', '),
      });
    },
  });

  const [verify, { loading: verifyLoading }] = useLoginPasskeyVerifyMutation({
    onCompleted: () => {
      toast({
        title: 'Passkey Setup',
        description: 'Passkey login has been configured for your account.',
      });
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error setting up Passkey.',
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

  return (
    <Section
      title="Login with Passkeys"
      description="Passkeys can be used to login to your account. Some passkeys can also be used to unlock your vault."
    >
      <Button
        className="w-full md:w-fit"
        disabled={addLoading || verifyLoading}
        onClick={() => {
          setup();
        }}
      >
        Setup New Passkey
      </Button>
      <PasskeyList />
    </Section>
  );
};
