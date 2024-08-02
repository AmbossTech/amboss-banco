'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import stringEntropy from 'fast-password-entropy';
import { Copy, CopyCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCopyToClipboard } from 'usehooks-ts';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
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
import {
  SignUpDocument,
  SignUpMutation,
  SignUpMutationVariables,
} from '@/graphql/mutations/__generated__/signUp.generated';
import { WalletAccountType, WalletType } from '@/graphql/types';
import { toWithError } from '@/utils/async';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Badge } from '../ui/badge';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Progress } from '../ui/progress';
import { useToast } from '../ui/use-toast';
import { WaitlistForm } from './WaitlistForm';

const FormSchema = z
  .object({
    email: z.string().email().min(5, {
      message: 'Invalid email.',
    }),
    password: z.string(),
    confirm_password: z.string(),
    password_hint: z.string().optional(),
    referral_code: z.string().min(1, { message: 'Required.' }),
    accept_tos_and_pp: z.boolean(),
    accept_condition_1: z.boolean(),
  })
  .refine(data => stringEntropy(data.password) >= 90, {
    message: 'Password is weak.',
    path: ['password'],
  })
  .refine(data => data.password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ['confirm_password'],
  })
  .refine(data => !!data.accept_tos_and_pp, {
    message: 'You must accept to sign up.',
    path: ['accept_tos_and_pp'],
  })
  .refine(data => !!data.accept_condition_1, {
    message: 'You must accept to sign up.',
    path: ['accept_condition_1'],
  });

export function SignUpForm() {
  const searchParams = useSearchParams();
  const referralParam = searchParams.get('referral');

  const { toast } = useToast();

  const client = useApolloClient();

  const workerRef = useRef<Worker>();

  const [view, setView] = useState<'waitlist' | 'sign-up'>(
    referralParam ? 'sign-up' : 'waitlist'
  );
  const [loading, setLoading] = useState(true);
  const [clickedGenerate, setClickedGenerate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [copiedPassword, copyPassword] = useCopyToClipboard();

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      password_hint: '',
      confirm_password: '',
      referral_code: referralParam || '',
      accept_tos_and_pp: false,
      accept_condition_1: false,
    },
  });

  const password = form.watch('password', '');

  const entropy = stringEntropy(password);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (loading) return;

    setLoading(true);

    if (workerRef.current) {
      const message: WorkerMessage = {
        type: 'create',
        payload: {
          email: data.email,
          password,
          password_hint: data.password_hint,
          referral_code: data.referral_code,
        },
      };

      workerRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRef.current.onmessage = async event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'loaded':
          setLoading(false);
          break;

        case 'create':
          const { wallet, ...userInfo } = message.payload;

          const [, error] = await toWithError(
            client.mutate<SignUpMutation, SignUpMutationVariables>({
              mutation: SignUpDocument,
              variables: {
                input: {
                  ...userInfo,
                  wallet: {
                    secp256k1_key_pair: wallet.secp256k1_key_pair,
                    details: {
                      type: WalletType.ClientGenerated,
                      protected_mnemonic: wallet.protectedMnemonic,
                    },
                    accounts: [
                      {
                        type: WalletAccountType.Liquid,
                        liquid_descriptor: wallet.liquidDescriptor,
                      },
                    ],
                  },
                },
              },
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);

            toast({
              variant: 'destructive',
              title: 'Error creating account.',
              description: messages.join(', '),
            });

            setLoading(false);
            return;
          }

          window.location.href = ROUTES.dashboard;

          break;
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [client, toast]);

  const handleGenerateClick = () => {
    const mnemonic = generateMnemonic(wordlist);
    form.setValue('password', mnemonic);
    form.setValue('confirm_password', mnemonic);
    setClickedGenerate(true);
  };

  return view === 'waitlist' ? (
    <WaitlistForm setView={setView} />
  ) : (
    <Card>
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="satoshi@nakamoto.com" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    You will use your email to login.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex w-full items-center justify-between">
                    <FormLabel>Master Password</FormLabel>
                    <button type="button" onClick={handleGenerateClick}>
                      <Badge variant={'secondary'}>
                        Generate Strong Password
                      </Badge>
                    </button>
                  </div>
                  <FormControl>
                    <div className="flex gap-2">
                      <Input
                        placeholder="super secret password"
                        type={showPassword ? undefined : 'password'}
                        {...field}
                      />
                      <Button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        size={'icon'}
                        className="px-2"
                        variant={'outline'}
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </Button>
                      {clickedGenerate ? (
                        <Button
                          type="button"
                          onClick={() => copyPassword(password)}
                          size={'icon'}
                          className="px-2"
                          variant={'outline'}
                        >
                          {copiedPassword ? (
                            <CopyCheck color="green" className="size-4" />
                          ) : (
                            <Copy className="size-4" />
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </FormControl>
                  <FormMessage />
                  <Progress value={Math.min(100, (entropy || 0) / 2)} />
                  <FormDescription>
                    <strong>Important: </strong>
                    Your account cannot be recovered if you forget it!
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirm_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm your Master Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="super secret password"
                      type="password"
                      {...field}
                    />
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
                  <FormLabel>Master Password Hint</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Hint to remember your password"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    <strong>Important: </strong>
                    The password hint will be stored in clear text.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="referral_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Code</FormLabel>
                  <FormControl>
                    <Input placeholder="36b8f84d" {...field} />
                  </FormControl>
                  <FormMessage />
                  <FormDescription>
                    MiBanco signups are currently available by invitation only.
                    <br />
                    Please enter your invite code to complete the signup
                    process.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accept_tos_and_pp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex flex-col gap-2">
                    <FormLabel>
                      By checking this box you agree to the{' '}
                      <Link
                        href={ROUTES.docs.termsOfService}
                        target="_blank"
                        className="text-primary"
                      >
                        Terms of Service
                      </Link>{' '}
                      and the{' '}
                      <Link
                        href={ROUTES.docs.privacyPolicy}
                        target="_blank"
                        className="text-primary"
                      >
                        Privacy Policy
                      </Link>
                      .
                    </FormLabel>

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="accept_condition_1"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 pb-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex flex-col gap-2">
                    <FormLabel>
                      I understand that if I forget the password
                      <strong> my account cannot be recovered.</strong>
                    </FormLabel>

                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
          </CardContent>

          <CardFooter>
            <div className="w-full">
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Sign Up
              </Button>

              <Link href={ROUTES.login} className="w-full">
                <Button
                  type="button"
                  disabled={loading}
                  variant={'ghost'}
                  className="mt-4 w-full"
                >
                  Login
                </Button>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
