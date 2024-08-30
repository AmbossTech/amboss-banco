'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { startAuthentication } from '@simplewebauthn/browser';
import { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/types';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import lock from '/public/icons/lock.svg';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useLoginMutation } from '@/graphql/mutations/__generated__/login.generated';
import {
  useLoginPasskeyInitMutation,
  useLoginPasskeyMutation,
} from '@/graphql/mutations/__generated__/passkey.generated';
import { generateMasterKeyAndHash } from '@/utils/argon';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import { TwoFASteps } from '@/views/login/TwoFASteps';

import { Button } from '../ui/button-v2';
import { useToast } from '../ui/use-toast';
import { OTPForm } from './OTPForm';

const FormSchema = z.object({
  email: z.string().email().min(5, {
    message: 'Invalid email.',
  }),
  password: z.string(),
});

export const LoginForm = () => {
  const l = useTranslations('Public.Login');
  const p = useTranslations('Public');
  const c = useTranslations('Common');

  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<'default' | '2fa' | 'otp'>('default');

  const [login, { data }] = useLoginMutation({
    onCompleted: data => {
      if (data.login.initial.two_factor?.methods.find(m => m.enabled)) {
        setView('2fa');
      } else {
        window.location.href = ROUTES.dashboard;
      }
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

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (loading) return;

    setLoading(true);

    try {
      const { masterPasswordHash } = await generateMasterKeyAndHash({
        email: data.email,
        password: data.password,
      });

      login({
        variables: {
          input: {
            email: data.email,
            master_password_hash: masterPasswordHash,
          },
        },
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error logging in.',
      });
    } finally {
      setLoading(false);
    }
  };

  const [setupPasskey, { loading: setupPasskeyLoading }] =
    useLoginPasskeyInitMutation({
      onCompleted: data => {
        try {
          handlePasskeyRegistration({
            options: JSON.parse(data.login.passkey.init.options),
            session_id: data.login.passkey.init.session_id,
          });
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Error logging in with Passkey.',
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
    useLoginPasskeyMutation({
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

  const handlePasskeyRegistration = async ({
    options,
    session_id,
  }: {
    options: PublicKeyCredentialRequestOptionsJSON;
    session_id: string;
  }) => {
    try {
      const response = await startAuthentication(options);
      verifyPasskey({
        variables: { input: { session_id, options: JSON.stringify(response) } },
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error setting up Passkey.',
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const disabled = loading || setupPasskeyLoading || verifyPasskeyLoading;

  if (view === '2fa')
    return (
      <TwoFASteps
        session_id={data?.login.initial.two_factor?.session_id || ''}
        methods={
          data?.login.initial.two_factor?.methods.filter(m => m.enabled) || []
        }
        setView={setView}
      />
    );

  if (view === 'otp')
    return (
      <OTPForm
        session_id={data?.login.initial.two_factor?.session_id || ''}
        setView={setView}
      />
    );

  return (
    <div className="mx-auto max-w-96 px-4 py-10">
      <Image src={lock} alt="lock" className="mx-auto" priority />

      <h1 className="my-4 text-center text-2xl font-semibold">{p('login')}</h1>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{c('email')}</FormLabel>
                <FormControl>
                  <Input placeholder="satoshi@nakamoto.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{c('password')}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={l('password')}
                    type="password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={disabled}
            className="flex w-full items-center justify-center"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
            ) : null}
            {p('login')}
          </Button>

          <div className="flex w-full items-center justify-center space-x-6">
            <div className="h-px w-full bg-slate-300 dark:bg-neutral-800 lg:w-28" />
            <p className="font-medium">{l('or')}</p>
            <div className="h-px w-full bg-slate-300 dark:bg-neutral-800 lg:w-28" />
          </div>

          <Button
            type="button"
            disabled={disabled}
            variant="secondary"
            className="w-full"
            onClick={() => setupPasskey()}
          >
            {l('with-passkey')}
          </Button>

          <p className="text-center">
            {l('no-account')}{' '}
            <Link
              href={ROUTES.signup}
              className="text-primary transition-colors hover:text-primary-hover"
            >
              {p('signup')}
            </Link>
          </p>
        </form>
      </Form>
    </div>
  );
};
