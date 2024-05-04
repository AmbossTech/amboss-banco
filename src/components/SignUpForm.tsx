'use client';

import { zodResolver } from '@hookform/resolvers/zod';
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
  evaluatePasswordStrength,
  MIN_PASSWORD_LENGTH,
} from '@/utils/password';

import { Checkbox } from './ui/checkbox';

const FormSchema = z
  .object({
    email: z.string().email().min(5, {
      message: 'Invalid email.',
    }),
    password: z.string().min(MIN_PASSWORD_LENGTH, {
      message: `Password needs to be at least ${MIN_PASSWORD_LENGTH} characters.`,
    }),
    confirm_password: z.string(),
    password_hint: z.string(),
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
  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
      password: '',
      confirm_password: '',
      password_hint: '',
      accept_tos_and_pp: false,
    },
  });

  const password = form.watch('password', '');
  const strength = evaluatePasswordStrength(password);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    try {
      console.log(JSON.stringify(data, null, 2));
    } catch (error) {
      console.log('ERROR', error);
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
                  placeholder="supersecretpassword"
                  type="password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
              <FormDescription>
                <strong>Important: </strong>
                Your master password cannot be recovered if you forget it!{' '}
                {strength ? `Password is: ${strength.title}` : null}
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
                  placeholder="supersecretpassword"
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
        <Button type="submit">Sign Up</Button>
      </form>
    </Form>
  );
}
