'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dispatch, FC, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { ROUTES } from '@/utils/routes';

import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

const FormSchema = z.object({
  email: z.string().email().min(5, {
    message: 'Invalid email.',
  }),
});

export const WaitlistForm: FC<{
  setView: Dispatch<SetStateAction<'waitlist' | 'sign-up'>>;
}> = ({ setView }) => {
  const { push } = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setLoading(true);

    try {
      const result = await fetch('https://reflex.amboss.space/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          variables: { input: { email: values.email, interest: 'BANCO' } },
          query: `mutation Add_interest($input: WaitlistInput!) {
                    public {
                        waitlist {
                            add_interest(input: $input) {
                                email
                            }
                        }
                    }
                }`,
        }),
      });

      const response = await result.json();

      if (response.data) {
        push(ROUTES.success.waitlist);
      } else {
        toast({
          variant: 'destructive',
          title: 'Error joining waitlist.',
          description: response.errors
            .map((e: { message: string }) => e.message)
            .join(', '),
        });
      }
    } catch (error) {
      console.log(error);

      toast({
        variant: 'destructive',
        title: 'Error joining waitlist.',
        description: 'Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>The BancoLibre Waitlist</CardTitle>
        <CardDescription>Join us. No bank required.</CardDescription>
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
                    {"We'll notify you as soon as we're ready for you."}
                  </FormDescription>
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
                Join Waitlist
              </Button>

              <Button
                type="button"
                onClick={() => setView('sign-up')}
                disabled={loading}
                variant={'ghost'}
                className="mt-4 w-full"
              >
                I have a Referral Code
              </Button>

              <Button
                type="button"
                onClick={() => setView('sign-up')}
                disabled={loading}
                variant={'ghost'}
                className="mt-4 w-full"
              >
                I am an Amboss Subscriber
              </Button>
            </div>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
};
