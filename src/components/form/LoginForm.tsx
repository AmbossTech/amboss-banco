'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
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
import { useLoginMutation } from '@/graphql/mutations/__generated__/login.generated';
import { generateMasterKeyAndHash } from '@/utils/crypto';
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

export function LoginForm() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [login] = useLoginMutation({
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
      const { masterPasswordHash } = await generateMasterKeyAndHash(
        data.email,
        data.password
      );

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
}
