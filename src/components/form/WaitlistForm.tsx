'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Dispatch, FC, SetStateAction, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import hourglass from '/public/icons/hourglass.svg';
import { ROUTES } from '@/utils/routes';

import { Button } from '../ui/button-v2';
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
  setSubscriber: Dispatch<SetStateAction<boolean>>;
}> = ({ setView, setSubscriber }) => {
  const w = useTranslations('Public.Waitlist');
  const c = useTranslations('Common');

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
    <div className="mx-auto max-w-96 px-4 py-10">
      <Image src={hourglass} alt="hourglass" className="mx-auto" priority />

      <h1 className="my-4 text-center text-2xl font-semibold lg:text-3xl">
        {w('join')}
      </h1>

      <p className="mb-6 text-center">{w('good-things')}</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
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
                <FormDescription>{w('notify')}</FormDescription>
              </FormItem>
            )}
          />

          <Button
            type="submit"
            disabled={!form.getValues().email || loading}
            className="mt-4 flex w-full items-center justify-center"
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-black" />
            ) : null}
            {w('submit')}
          </Button>
        </form>
      </Form>

      <button
        type="button"
        onClick={() => setView('sign-up')}
        disabled={loading}
        className="hover:text-primary-hover my-4 w-full text-center font-medium text-primary transition-colors"
      >
        {w('referral')}
      </button>

      <button
        type="button"
        onClick={() => {
          setSubscriber(true);
          setView('sign-up');
        }}
        disabled={loading}
        className="hover:text-primary-hover w-full text-center font-medium text-primary transition-colors"
      >
        {w('subscriber')}
      </button>
    </div>
  );
};
