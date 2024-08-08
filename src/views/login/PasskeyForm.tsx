'use client';

import { startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { FC } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  useTwoFactorPasskeyAuthInitMutation,
  useTwoFactorPasskeyAuthLoginMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

export const PasskeyForm: FC<{ session_id: string }> = ({ session_id }) => {
  const { toast } = useToast();

  const [init, { loading: initLoading }] = useTwoFactorPasskeyAuthInitMutation({
    onCompleted: data => {
      try {
        handleAuthentication(JSON.parse(data.login.two_factor.passkey.options));
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

  const [verify, { loading: verifyLoading }] =
    useTwoFactorPasskeyAuthLoginMutation({
      onCompleted: () => {
        window.location.href = ROUTES.dashboard;
      },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error logging in.',
          description: messages.join(', '),
        });
      },
    });

  const handleAuthentication = async (
    options: PublicKeyCredentialRequestOptionsJSON
  ) => {
    try {
      const response = await startAuthentication(options);

      verify({
        variables: { input: { session_id, options: JSON.stringify(response) } },
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error authenticating with Passkey.',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  return (
    <Button
      onClick={() => init({ variables: { input: { session_id } } })}
      disabled={initLoading || verifyLoading}
    >
      Authenticate with a Passkey
    </Button>
  );
};
