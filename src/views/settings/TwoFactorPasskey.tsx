import { startRegistration } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { format } from 'date-fns';
import { useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  useTwoFactorPasskeyAddMutation,
  useTwoFactorPasskeyVerifyMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import { useGetAccountTwoFactorMethodsQuery } from '@/graphql/queries/__generated__/2fa.generated';
import { TwoFactorMethod } from '@/graphql/types';
import { handleApolloError } from '@/utils/error';

import { Section } from './Section';

const PasskeyList = () => {
  const { data, loading, error } = useGetAccountTwoFactorMethodsQuery();

  const passkeyMethods = useMemo(() => {
    if (loading || error || !data?.two_factor.find_many.length) return [];
    return data.two_factor.find_many.filter(
      d => d.method === TwoFactorMethod.Passkey
    );
  }, [data, loading, error]);

  if (loading || error || !passkeyMethods.length) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 mt-4 text-sm font-medium">Saved Passkeys</h3>
      <div className="flex flex-col gap-1">
        {passkeyMethods.map((d, index) => (
          <div key={d.id}>
            <div className="flex items-center justify-start gap-4">
              <p className="text-xs font-medium">
                {index + 1}. {d.passkey_name || 'Passkey'}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(d.created_at, 'MMM do, yyyy - HH:mm')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const Passkey = () => {
  const { toast } = useToast();

  const [setup, { loading: addLoading }] = useTwoFactorPasskeyAddMutation({
    onCompleted: data => {
      try {
        handleRegistration(JSON.parse(data.two_factor.passkey.add.options));
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
    useTwoFactorPasskeyVerifyMutation({
      onCompleted: () => {
        toast({
          title: 'Passkey Setup',
          description:
            'Passkey 2FA login has been configured for your account.',
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
      refetchQueries: ['getAccountTwoFactorMethods'],
    });

  const handleRegistration = async (
    options: PublicKeyCredentialCreationOptionsJSON
  ) => {
    try {
      const response = await startRegistration(options);

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
    <div>
      <Section
        title={'Passkeys'}
        description={
          'Enhance the security of your account by setting up Passkeys.'
        }
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
    </div>
  );
};
