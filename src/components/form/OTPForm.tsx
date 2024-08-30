'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useState } from 'react';

import touch from '/public/icons/touch.svg';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { useToast } from '@/components/ui/use-toast';
import { useTwoFactorOtpLoginMutation } from '@/graphql/mutations/__generated__/otp.generated';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

export const OTPForm: FC<{
  session_id: string;
  setView: Dispatch<SetStateAction<'default' | '2fa' | 'otp'>>;
}> = ({ session_id, setView }) => {
  const l = useTranslations('Public.Login');

  const [value, setValue] = useState('');

  const { toast } = useToast();

  const [login, { loading }] = useTwoFactorOtpLoginMutation({
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

      setValue('');
    },
  });

  const handleOTPChange = (value: string) => {
    if (loading) return;
    setValue(value);

    if (value.length >= 6) {
      login({ variables: { input: { code: value, session_id } } });
    }
  };

  return (
    <div className="relative mx-auto my-10 max-w-96 px-4">
      <button
        type="button"
        onClick={() => setView('2fa')}
        disabled={loading}
        className="absolute left-4 top-0 transition-opacity hover:opacity-75 lg:-left-16"
      >
        <ArrowLeft size={24} />
      </button>

      <Image src={touch} alt="touch" className="mx-auto" priority />

      <h1 className="my-4 text-center text-2xl font-semibold lg:text-3xl">
        {l('code')}
      </h1>

      <p className="mb-4 text-center text-neutral-400">{l('secure')}</p>

      <div className="flex w-full justify-center">
        <InputOTP
          autoFocus
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={handleOTPChange}
          disabled={loading}
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
    </div>
  );
};
