'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
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
import { argon2Hash } from '@/utils/crypto';
import { handleApolloError } from '@/utils/error';
import { MIN_PASSWORD_LENGTH } from '@/utils/password';
import { ROUTES } from '@/utils/routes';

import { useToast } from './ui/use-toast';

const FormSchema = z.object({
  email: z.string().email().min(5, {
    message: 'Invalid email.',
  }),
  password: z.string().min(MIN_PASSWORD_LENGTH, {
    message: `The password is at least ${MIN_PASSWORD_LENGTH} characters.`,
  }),
});

export function LoginForm() {
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [login] = useLoginMutation({
    onCompleted: () => {
      window.location.href = ROUTES.app.home;
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
      const masterKey = await argon2Hash(data.password, data.email);
      const masterPasswordHash = await argon2Hash(masterKey, data.password);

      login({
        variables: {
          input: {
            email: data.email,
            master_password_hash: masterPasswordHash,
          },
        },
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error logging in.',
      });
    } finally {
      setLoading(false);
    }
  };

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

        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Login
        </Button>
      </form>
    </Form>
  );
}
