'use client';

import { REGEXP_ONLY_DIGITS } from 'input-otp';
import { Loader2 } from 'lucide-react';
import { FC, useState } from 'react';

import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTwoFactorOtpLoginMutation } from '@/graphql/mutations/__generated__/otp.generated';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

export const OTPForm: FC<{ session_id: string }> = ({ session_id }) => {
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
    <div className="flex flex-col items-center justify-center">
      <div className="mb-2 mt-4">
        {loading ? (
          <div className="flex h-[22px] w-full items-center justify-center">
            <Loader2 className="size-4 animate-spin" />
          </div>
        ) : (
          <Label>Please enter the one-time password</Label>
        )}
      </div>
      <div className="flex w-full justify-center">
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS}
          value={value}
          onChange={handleOTPChange}
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
