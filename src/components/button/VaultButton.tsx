'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Lock, Unlock } from 'lucide-react';
import { FC, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useCheckPasswordMutation } from '@/graphql/mutations/__generated__/checkPassword.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import { useKeyStore } from '@/stores/keys';
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: '',
    },
  });

  const { toast } = useToast();

  const setMasterKey = useKeyStore(s => s.setMasterKey);

  const [loading, setLoading] = useState(true);
  const [tempMasterKey, setTempMasterKey] = useState('');

  const { data } = useUserQuery({ errorPolicy: 'ignore' });

  const [checkPassword] = useCheckPasswordMutation({
    onCompleted: () => {
      setMasterKey(tempMasterKey);
      callback();
    },
    onError: error => {
      const messages = handleApolloError(error);

      toast({
        variant: 'destructive',
        title: 'Unable to unlock.',
        description: messages.join(', '),
      });

      setTempMasterKey('');
      form.reset();
    },
  });

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    setLoading(true);
    if (loading || !data?.user.email || !workerRef.current) {
      return;
    }

    const message: WorkerMessage = {
      type: 'generateMaster',
      payload: {
        email: data.user.email,
        password: values.password,
      },
    };

    workerRef.current.postMessage(message);
  };

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../../workers/account/account.ts', import.meta.url)
    );

    workerRef.current.onmessage = event => {
      const message: WorkerResponse = event.data;

      switch (message.type) {
        case 'generateMaster':
          setTempMasterKey(message.payload.masterKey);

          checkPassword({
            variables: { password: message.payload.masterPasswordHash },
          });

          break;

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
  }, [checkPassword]);

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
  const masterKey = useKeyStore(s => s.masterKey);

  const clearKeys = useKeyStore(s => s.clear);

  const [open, setOpen] = useState(false);

  const handleClear = () => {
    clearKeys();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {!!masterKey ? (
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
        {!!masterKey ? (
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
