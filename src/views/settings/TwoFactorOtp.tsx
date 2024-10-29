'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Copy, CopyCheck, Loader2, ScanText } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useState } from 'react';

import { QrCode } from '@/components/QrCode';
import { Button } from '@/components/ui/button-v2';
import { Input } from '@/components/ui/input';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useToast } from '@/components/ui/use-toast';
import {
  useTwoFactorOtpAddMutation,
  useTwoFactorOtpVerifyMutation,
} from '@/graphql/mutations/__generated__/otp.generated';
import useCopyClipboard from '@/hooks/useClipboardCopy';
import { handleApolloError } from '@/utils/error';

import { Setting } from './Setting';
import { View } from './TwoFactor';

export const OTP: FC<{
  hasAlready: boolean;
  view: View;
  setView: Dispatch<SetStateAction<View>>;
}> = ({ hasAlready, view, setView }) => {
  const t = useTranslations();
  const { toast } = useToast();

  const [isCopied, copy] = useCopyClipboard();

  const [value, setValue] = useState('');

  const [add, { data, loading }] = useTwoFactorOtpAddMutation({
    onCompleted: () => setView('otp'),
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error adding 2FA method.',
        description: messages.join(', '),
      });
    },
  });

  const [verify, { loading: verifyLoading }] = useTwoFactorOtpVerifyMutation({
    onCompleted: () => {
      toast({
        title: 'Success',
        description: 'Authenticator App Enabled',
      });
      setValue('');
      setView('default');
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error verifying 2FA method.',
        description: messages.join(', '),
      });

      setValue('');
    },
    refetchQueries: ['getAccountTwoFactorMethods'],
  });

  const handleOTPChange = (value: string) => {
    if (verifyLoading) return;

    setValue(value);

    if (value.length >= 6) {
      verify({ variables: { input: { code: value } } });
    }
  };

  return view === 'default' ? (
    <div className="flex w-full items-center justify-between space-x-2">
      <Setting
        title={t('App.Settings.auth-app')}
        description={
          hasAlready ? t('App.Settings.enabled') : t('App.Settings.off')
        }
        icon={<ScanText size={24} />}
        className={hasAlready ? 'text-green-500 dark:text-green-400' : ''}
      />

      {hasAlready ? null : (
        <Button
          variant="secondary"
          onClick={() => add()}
          disabled={loading}
          className="flex items-center justify-center"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
          ) : null}
          {t('App.Settings.setup')}
        </Button>
      )}
    </div>
  ) : data?.two_factor.otp.add ? (
    <>
      <p className="mb-6 text-center text-sm">{t('App.Settings.otp')}</p>

      <QrCode
        text={data.two_factor.otp.add.otp_url}
        className="mx-auto w-fit drop-shadow-2xl dark:drop-shadow-none"
      />

      <p className="mb-4 mt-6 text-center text-sm">
        {t('App.Settings.no-scan')}
      </p>

      <div className="mb-6 flex w-full items-center space-x-3">
        <Input
          readOnly
          defaultValue={data.two_factor.otp.add.otp_secret}
          contentEditable={'false'}
        />

        <button
          onClick={() => copy(data.two_factor.otp.add.otp_secret)}
          className="transition-opacity hover:opacity-75"
        >
          {isCopied ? <CopyCheck size={24} /> : <Copy size={24} />}
        </button>
      </div>

      <p className="mb-4 text-center font-semibold">
        {t('App.Settings.enter-otp')}
      </p>

      <div className="flex w-full justify-center">
        <InputOTP
          autoFocus
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={handleOTPChange}
          disabled={verifyLoading}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>
    </>
  ) : null;
};
