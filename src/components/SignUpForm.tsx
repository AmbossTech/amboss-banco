'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import {
  evaluatePasswordStrength,
  MIN_PASSWORD_LENGTH,
} from '@/utils/password';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from './ui/card';
import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';
import { useToast } from './ui/use-toast';

const FormSchema = z
  .object({
    email: z.string().email().min(5, {
      message: 'Invalid email.',
    }),
    password: z.string().min(MIN_PASSWORD_LENGTH, {
      message: `Password needs to be at least ${MIN_PASSWORD_LENGTH} characters.`,
    }),
    confirm_password: z.string(),
    password_hint: z.string().optional(),
    accept_tos_and_pp: z.boolean(),
  })
  .refine(data => data.password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ['confirm_password'],
  })
  .refine(data => !!data.accept_tos_and_pp, {
    message: 'You must accept to sign up.',
    path: ['accept_tos_and_pp'],
  });

export function SignUpForm() {
  const { toast } = useToast();

  const client = useApolloClient();

  const workerRef = useRef<Worker>();

  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      password_hint: '',
      confirm_password: '',
      accept_tos_and_pp: false,
    },
  });

  const password = form.watch('password', '');
  const strength = evaluatePasswordStrength(password);

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
        },
      };

      workerRef.current.postMessage(message);
    }
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/account/account.ts', import.meta.url)
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

          window.location.href = ROUTES.app.home;

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

  return (
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
                  <FormLabel>Master Password</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="super secret password"
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <Progress value={strength?.progress || 0} />
                  <FormDescription>
                    <strong>Important: </strong>
                    Your master password cannot be recovered if you forget it!
                    Minimum length is {MIN_PASSWORD_LENGTH}.
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
                    The password hint will be stored in clear text on the
                    server.
                  </FormDescription>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accept_tos_and_pp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex flex-col gap-2">
                    <FormLabel>
                      By checking this box you agree to the Terms of Service and
                      the Privacy Policy.
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
