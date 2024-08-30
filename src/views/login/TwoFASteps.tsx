import { startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { ArrowLeft, ArrowRight, KeyRound, ScanText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, ReactNode, SetStateAction } from 'react';

import { useToast } from '@/components/ui/use-toast';
import {
  useTwoFactorPasskeyAuthInitMutation,
  useTwoFactorPasskeyAuthLoginMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import { SimpleTwoFactor, TwoFactorMethod } from '@/graphql/types';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

const MethodButton: FC<{
  icon: ReactNode;
  title: string;
  onClick: () => void;
  disabled: boolean;
}> = ({ icon, title, onClick, disabled }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-between space-x-3 rounded-2xl bg-neutral-800 px-4 py-2 transition-colors hover:bg-neutral-800/80"
    >
      <div className="flex items-center space-x-3 text-white">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-700">
          {icon}
        </div>

        <p className="break-all font-semibold">{title}</p>
      </div>

      <ArrowRight size={24} className="shrink-0 text-neutral-500" />
    </button>
  );
};

export const TwoFASteps: FC<{
  session_id: string;
  methods: SimpleTwoFactor[];
  setView: Dispatch<SetStateAction<'default' | '2fa' | 'otp'>>;
}> = ({ session_id, methods, setView }) => {
  const l = useTranslations('Public.Login');

  const { toast } = useToast();

  const [initPasskey, { loading: initPasskeyLoading }] =
    useTwoFactorPasskeyAuthInitMutation({
      onCompleted: data => {
        try {
          handleAuthentication(
            JSON.parse(data.login.two_factor.passkey.options)
          );
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

  const [verifyPasskey, { loading: verifyPasskeyLoading }] =
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

      verifyPasskey({
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

  const disabled = initPasskeyLoading || verifyPasskeyLoading;

  return (
    <div className="relative mx-auto my-10 max-w-96 px-4">
      <button
        type="button"
        onClick={() => setView('default')}
        disabled={disabled}
        className="absolute left-4 top-1 transition-opacity hover:opacity-75 lg:-left-8 lg:top-1.5"
      >
        <ArrowLeft size={24} />
      </button>

      <h1 className="text-center text-2xl font-semibold lg:text-3xl">
        {l('methods')}
      </h1>

      <p className="my-4 text-center text-neutral-400">{l('2fa')}</p>

      <div className="space-y-4">
        {methods.map(m => {
          switch (m.method) {
            case TwoFactorMethod.Otp:
              return (
                <MethodButton
                  key={m.id}
                  icon={<ScanText size={24} />}
                  title={l('otp')}
                  onClick={() => setView('otp')}
                  disabled={disabled}
                />
              );

            case TwoFactorMethod.Passkey:
              return (
                <MethodButton
                  key={m.id}
                  icon={<KeyRound size={24} />}
                  title={m.passkey_name || l('passkey')}
                  onClick={() =>
                    initPasskey({ variables: { input: { session_id } } })
                  }
                  disabled={disabled}
                />
              );

            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
