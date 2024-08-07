'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { FC, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  LoginMutation,
  useLoginMutation,
} from '@/graphql/mutations/__generated__/login.generated';
import { generateMasterKeyAndHash } from '@/utils/argon';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { useToast } from '../ui/use-toast';

const FormSchema = z.object({
  email: z.string().email().min(5, {
    message: 'Invalid email.',
  }),
  password: z.string(),
});

export const LoginForm: FC<{
  twoFACallback: (
    payload: LoginMutation['login']['initial']['two_factor']
  ) => void;
}> = ({ twoFACallback }) => {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [login] = useLoginMutation({
    onCompleted: data => {
      if (!!data.login.initial.two_factor?.session_id) {
        twoFACallback(data.login.initial.two_factor);
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

    if (data.email.trim().toLowerCase() !== data.email) {
      setLoading(false);

      toast({
        title: 'Email Mismatch!',
        description:
          'Please use only lowercase letters in your email. If you signed up with an email that contains uppercase letters, contact support for assistance.',
      });

      return;
    }

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

  return (
    <Card className="w-full max-w-96">
      <CardHeader>
        <CardTitle>Login</CardTitle>
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
                Login
              </Button>

              <Link href={ROUTES.signup} className="w-full">
                <Button
                  type="button"
                  disabled={loading}
                  variant={'ghost'}
                  className="mt-4 w-full"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
