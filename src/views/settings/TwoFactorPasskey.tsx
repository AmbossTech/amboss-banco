import { startRegistration } from '@simplewebauthn/browser';
import { PublicKeyCredentialCreationOptionsJSON } from '@simplewebauthn/types';
import { format } from 'date-fns';
import { KeyRound, Loader2, RectangleEllipsis } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FC, useMemo } from 'react';

import { Button } from '@/components/ui/button-v2';
import { useToast } from '@/components/ui/use-toast';
import {
  useTwoFactorPasskeyAddMutation,
  useTwoFactorPasskeyVerifyMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import { useGetAccountTwoFactorMethodsQuery } from '@/graphql/queries/__generated__/2fa.generated';
import { TwoFactorMethod } from '@/graphql/types';
import { handleApolloError } from '@/utils/error';

import { Setting } from './Setting';

const PasskeyList = () => {
  const t = useTranslations();

  const { data, loading, error } = useGetAccountTwoFactorMethodsQuery();

  const passkeyMethods = useMemo(() => {
    if (loading || error || !data?.two_factor.find_many.length) return [];
    return data.two_factor.find_many.filter(
      d => d.method === TwoFactorMethod.Passkey
    );
  }, [data, loading, error]);

  if (!passkeyMethods.length) return null;

  return (
    <div>
      <h3 className="mb-3 mt-7 w-full border-b border-slate-200 pb-2 text-lg font-semibold text-slate-600 dark:border-neutral-800 dark:text-neutral-400">
        {t('App.Settings.saved-passkeys')}
      </h3>

      <div className="w-full space-y-6">
        {passkeyMethods.map(p => (
          <Setting
            key={p.id}
            title={p.passkey_name || t('Public.Login.passkey')}
            description={format(p.created_at, 'MMM do, yyyy - HH:mm')}
            icon={<RectangleEllipsis size={24} />}
          />
        ))}
      </div>
    </div>
  );
};

export const Passkey: FC<{ hasAlready: boolean }> = ({ hasAlready }) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [add, { loading: addLoading }] = useTwoFactorPasskeyAddMutation({
    onCompleted: data => {
      try {
        handleRegistration(JSON.parse(data.two_factor.passkey.add.options));
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error adding 2FA method.',
        });
      }
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error adding 2FA method.',
        description: messages.join(', '),
      });
    },
  });

  const [verify, { loading: verifyLoading }] =
    useTwoFactorPasskeyVerifyMutation({
      onCompleted: () => {
        toast({
          title: 'Success',
          description: 'Passkey Enabled',
        });
      },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error verifying 2FA method.',
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

  const loading = addLoading || verifyLoading;

  return (
    <div>
      <div className="flex w-full items-center justify-between space-x-2">
        <Setting
          title={t('Public.Login.passkey')}
          description={
            hasAlready ? t('App.Settings.added') : t('App.Settings.off')
          }
          icon={<KeyRound size={24} />}
          className={hasAlready ? 'text-green-500 dark:text-green-400' : ''}
        />

        <Button
          variant="secondary"
          onClick={() => add()}
          disabled={loading}
          className="flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
          ) : null}
          {t('App.Settings.add-passkey')}
        </Button>
      </div>

      <PasskeyList />
    </div>
  );
};
