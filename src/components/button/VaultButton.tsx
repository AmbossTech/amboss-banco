'use client';

import { ApolloError, useApolloClient } from '@apollo/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import {
  CheckPasswordDocument,
  CheckPasswordMutation,
  CheckPasswordMutationVariables,
} from '@/graphql/mutations/__generated__/checkPassword.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { cn } from '@/utils/cn';
import { handleApolloError } from '@/utils/error';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { Input } from '../ui/input';
import { useToast } from '../ui/use-toast';

const formSchema = z.object({
  password: z.string(),
});

const UnlockDialogContent: FC<{ callback: () => void }> = ({ callback }) => {
  const workerRef = useRef<Worker>();

  const client = useApolloClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  const { toast } = useToast();

  const setKeys = useKeyStore(s => s.setKeys);

  const [loading, setLoading] = useState(true);

  const { data, loading: userLoading, error } = useUserQuery();

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    if (
      loading ||
      userLoading ||
      error ||
      !data?.user.email ||
      !data?.user.protected_symmetric_key ||
      !workerRef.current
    ) {
      setLoading(false);
      return;
    }

    const message: WorkerMessage = {
      type: 'generateMaster',
      payload: {
        email: data.user.email,
        password: values.password,
        protectedSymmetricKey: data.user.protected_symmetric_key,
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
        case 'generateMaster': {
          const [, error] = await toWithError(
            client.mutate<
              CheckPasswordMutation,
              CheckPasswordMutationVariables
            >({
              mutation: CheckPasswordDocument,
              variables: { password: message.payload.masterPasswordHash },
            })
          );

          if (error) {
            const messages = handleApolloError(error as ApolloError);

            toast({
              variant: 'destructive',
              title: 'Unable to unlock.',
              description: messages.join(', '),
            });

            form.reset();
          } else {
            setKeys({
              masterKey: message.payload.masterKey,
              protectedSymmetricKey: message.payload.protectedSymmetricKey,
            });
            callback();
          }

          break;
        }

        case 'loaded':
          setLoading(false);
          return;
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
  }, [client, toast, callback, form, setKeys]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>Unlock your vault</DialogTitle>
        <DialogDescription>
          This will allow you to send funds and messages.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form
          onSubmit={event => {
            form.handleSubmit(handleSubmit)(event);

            event?.preventDefault?.();
            event?.stopPropagation?.();
          }}
          className="space-y-8"
        >
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Master Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="super secret password"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="gap-2 sm:justify-start">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Unlock
            </Button>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={loading}>
                Close
              </Button>
            </DialogClose>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export const VaultButton: FC<{
  lockedTitle?: string;
  className?: string;
  size?: 'sm';
}> = ({ lockedTitle = 'Locked', className, size }) => {
  const keys = useKeyStore(s => s.keys);

  const clearKeys = useKeyStore(s => s.clear);

  const [open, setOpen] = useState(false);

  const handleClear = () => {
    clearKeys();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {!!keys ? (
          <Button
            type="button"
            variant="outline"
            size={size}
            className={cn(className)}
          >
            <Unlock className="mr-2 h-4 w-4" color="green" />
            Unlocked
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size={size}
            className={cn(className)}
          >
            <Lock className="mr-2 h-4 w-4" color="red" />
            {lockedTitle}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {!!keys ? (
          <>
            <DialogHeader>
              <DialogTitle>Lock your vault</DialogTitle>
              <DialogDescription>
                You will not be able to send funds or messages until the vault
                is unlocked with your Master Password.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:justify-center">
              <Button type="submit" onClick={handleClear} className="w-full">
                Lock
              </Button>
              <DialogClose asChild>
                <Button type="button" variant="secondary" className="w-full">
                  Close
                </Button>
              </DialogClose>
            </DialogFooter>
          </>
        ) : (
          <UnlockDialogContent
            callback={() => {
              setOpen(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
