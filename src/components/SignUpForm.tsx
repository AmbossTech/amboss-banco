'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { useSignUpMutation } from '@/graphql/mutations/__generated__/signUp.generated';
import {
  evaluatePasswordStrength,
  MIN_PASSWORD_LENGTH,
} from '@/utils/password';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Checkbox } from './ui/checkbox';
import { Progress } from './ui/progress';

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
  const workerRef = useRef<Worker>();

  const [loading, setLoading] = useState(false);

  const [signUp] = useSignUpMutation({
    onCompleted: () => {
      window.location.href = ROUTES.app.home;
    },
    onError: err => console.log('ERROR', err),
  });

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

    workerRef.current.onmessage = event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'create':
          signUp({ variables: { input: message.payload } });
          break;

        default:
          console.error('Unhandled message type:', event.data.type);
          break;
      }

      setLoading(false);
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [signUp]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
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
                  By checking this box you agree to the Terms of Service and the
                  Privacy Policy.
                </FormLabel>

                <FormMessage />
              </div>
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign Up
        </Button>
      </form>
    </Form>
  );
}
