'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import stringEntropy from 'fast-password-entropy';
import { ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { VaultButton } from '@/components/button/VaultButtonV2';
import { Button } from '@/components/ui/button-v2';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useChangePasswordMutation } from '@/graphql/mutations/__generated__/changePassword.generated';
import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useKeyStore } from '@/stores/keys';
import { cn } from '@/utils/cn';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

const FormSchema = z
  .object({
    current_password: z
      .string()
      .min(8, { message: 'Valid password required.' }),
    new_password: z.string().min(8, { message: 'Password is too weak.' }),
    confirm_password: z.string(),
    password_hint: z.string().optional(),
    accept_condition_1: z.boolean(),
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ['confirm_password'],
  })
  .refine(data => !!data.accept_condition_1, {
    message: 'You must accept to proceed.',
    path: ['accept_condition_1'],
  });

export const Password = () => {
  const t = useTranslations();

  const keys = useKeyStore(s => s.keys);
  const clearKeys = useKeyStore(s => s.clear);

  const workerRef = useRef<Worker>();
  const { data } = useUserQuery({ errorPolicy: 'ignore' });

  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
      password_hint: '',
      accept_condition_1: false,
    },
  });

  const password = form.watch('new_password', '');
  const entropy = stringEntropy(password);

  const passwordStrength = useMemo(() => {
    switch (true) {
      case !entropy:
        return {
          text: 'Not Set',
          bg: 'bg-slate-200 dark:bg-neutral-700',
          font: 'text-slate-200 dark:text-neutral-700',
        };
      case entropy < 50:
        return {
          text: 'Very Weak',
          bg: 'bg-red-500 dark:bg-red-400',
          font: 'text-red-500 dark:text-red-400',
        };
      case entropy < 100:
        return {
          text: 'Weak',
          bg: 'bg-[#EACC7E] dark:bg-yellow-200',
          font: 'text-[#EACC7E] dark:text-yellow-200',
        };
      case entropy < 150:
        return {
          text: 'Good',
          bg: 'bg-green-500 dark:bg-green-400',
          font: 'text-green-500 dark:text-green-400',
        };
      case entropy < 200:
        return {
          text: 'Strong',
          bg: 'bg-green-500 dark:bg-green-400',
          font: 'text-green-500 dark:text-green-400',
        };
      case entropy >= 200:
        return {
          text: 'Very Strong',
          bg: 'bg-green-500 dark:bg-green-400',
          font: 'text-green-500 dark:text-green-400',
        };
    }
  }, [entropy]);

  const [changePassword] = useChangePasswordMutation({
    onCompleted: () => {
      toast({
        title: 'Password changed!',
        description: `You will now be logged out.`,
      });

      localStorage.removeItem('pw');

      setTimeout(() => logout(), 2100);
    },
    onError: error => {
      const messages = handleApolloError(error);

      toast({
        variant: 'destructive',
        title: 'Could not change password.',
        description: messages.join(', '),
      });

      setLoading(false);
    },
  });

  const [logout] = useLogoutMutation({
    onCompleted: () => {
      clearKeys();
      localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
      window.location.assign(ROUTES.home);
    },
    onError: error => {
      const messages = handleApolloError(error);

      toast({
        variant: 'destructive',
        title: 'Error logging out.',
        description: messages.join(', '),
      });
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setLoading(true);

    if (
      !data?.user.email ||
      !data.user.protected_symmetric_key ||
      !workerRef.current ||
      !keys
    ) {
      setLoading(false);
      return;
    }

    const message: WorkerMessage = {
      type: 'changePassword',
      payload: {
        email: data.user.email,
        currentPassword: values.current_password,
        newPassword: values.new_password,
        newPasswordHint: values.password_hint,
        currentMasterKey: keys.masterKey,
        currentProtectedSymmetricKey: keys.protectedSymmetricKey,
      },
    };

    workerRef.current.postMessage(message);
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'changePassword': {
          changePassword({
            variables: {
              input: {
                current_master_password_hash:
                  message.payload.currentMasterKeyHash,
                new_master_password_hash: message.payload.newMasterKeyHash,
                new_password_hint: message.payload.newPasswordHint,
                new_protected_symmetric_key:
                  message.payload.newProtectedSymmetricKey,
              },
            },
          });

          break;
        }

        case 'error': {
          if (message.msg === 'invalid MAC') {
            toast({
              variant: 'destructive',
              title: 'Could not change password.',
              description: 'Invalid current password.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Could not change password.',
              description: message.msg,
            });
          }

          setLoading(false);

          break;
        }
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [changePassword, toast]);

  const values = form.getValues();

  return (
    <div className="mx-auto w-full max-w-lg py-6 lg:py-10">
      <div className="mb-6 flex w-full items-center justify-between space-x-2">
        <Link
          href={ROUTES.settings.home}
          className="flex h-10 w-10 items-center justify-center transition-opacity hover:opacity-75"
        >
          <ArrowLeft size={24} />
        </Link>

        <h1 className="text-2xl font-semibold">
          {t('App.Settings.change-pass')}
        </h1>

        <div />
      </div>

      {!keys ? (
        <VaultButton className="w-full" variant="secondary" />
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="current_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('App.Settings.current-pass')}</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="new_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('App.Settings.new-pass')}</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        type={showPassword ? undefined : 'password'}
                        disabled={loading}
                        {...field}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        className="transition-opacity hover:opacity-75"
                      >
                        {showPassword ? (
                          <EyeOff size={24} />
                        ) : (
                          <Eye size={24} />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                  <div className="flex items-center space-x-2">
                    <Progress
                      value={Math.min(100, (entropy || 0) / 2)}
                      className={passwordStrength?.bg}
                    />
                    <p
                      className={cn(
                        'whitespace-nowrap text-xs font-medium',
                        passwordStrength?.font
                      )}
                    >
                      {passwordStrength?.text}
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Common.confirm-password')}</FormLabel>
                  <FormControl>
                    <Input type="password" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password_hint"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t('Public.Signup.hint')} ({t('Common.optional')})
                  </FormLabel>
                  <FormControl>
                    <Input autoComplete="off" disabled={loading} {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>{t('Public.Signup.plain')}</FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accept_condition_1"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="flex space-x-3">
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                        className="border-input !bg-white"
                      />

                      <FormLabel className="font-semibold">
                        {t('App.Settings.pass-confirm')}
                      </FormLabel>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              variant="secondary"
              disabled={
                loading ||
                !values.current_password ||
                !values.new_password ||
                !values.confirm_password ||
                !values.accept_condition_1
              }
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
              ) : null}
              {t('App.save')}
            </Button>
          </form>
        </Form>
      )}
    </div>
  );
};
