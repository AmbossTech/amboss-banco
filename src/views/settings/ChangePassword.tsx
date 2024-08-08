'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import stringEntropy from 'fast-password-entropy';
import { Copy, CopyCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { useChangePasswordMutation } from '@/graphql/mutations/__generated__/changePassword.generated';
import { useLogoutMutation } from '@/graphql/mutations/__generated__/logout.generated';
import { useUserQuery } from '@/graphql/queries/__generated__/user.generated';
import useCopyClipboard from '@/hooks/useClipboardCopy';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import { WorkerMessage, WorkerResponse } from '@/workers/account/types';

import { Section } from './Section';

const FormSchema = z
  .object({
    current_password: z
      .string()
      .min(8, { message: 'Valid password required.' }),
    new_password: z.string(),
    confirm_password: z.string(),
    password_hint: z.string().optional(),
    accept_condition_1: z.boolean(),
  })
  .refine(data => stringEntropy(data.new_password) >= 90, {
    message: 'Password is weak.',
    path: ['new_password'],
  })
  .refine(data => data.new_password === data.confirm_password, {
    message: "Passwords don't match.",
    path: ['confirm_password'],
  })
  .refine(data => !!data.accept_condition_1, {
    message: 'You must accept to proceed.',
    path: ['accept_condition_1'],
  });

export const ChangePassword = () => {
  const [open, setOpen] = useState(false);

  const workerRef = useRef<Worker>();
  const { data } = useUserQuery({ errorPolicy: 'ignore' });

  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [clickedGenerate, setClickedGenerate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [copiedPassword, copyPassword] = useCopyClipboard();

  const form = useForm<z.infer<typeof FormSchema>>({
    reValidateMode: 'onChange',
    resolver: zodResolver(FormSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
      password_hint: '',
      accept_condition_1: false,
    },
  });

  const password = form.watch('new_password', '');

  const entropy = stringEntropy(password);

  const handleGenerateClick = () => {
    const mnemonic = generateMnemonic(wordlist);
    form.setValue('new_password', mnemonic);
    form.setValue('confirm_password', mnemonic);
    setClickedGenerate(true);
  };

  const [changePassword] = useChangePasswordMutation({
    onCompleted: () => {
      toast({
        title: 'Password changed!',
        description: `You will now be logged out.`,
      });

      setTimeout(() => logout(), 2100);
    },
    onError: error => {
      const messages = handleApolloError(error);

      toast({
        variant: 'destructive',
        title: 'Could not change password.',
        description: messages.join(', '),
      });

      setLoading(false);
    },
  });

  const [logout] = useLogoutMutation({
    onCompleted: () => {
      localStorage.removeItem(LOCALSTORAGE_KEYS.currentWalletId);
      window.location.assign(ROUTES.home);
    },
    onError: error => {
      const messages = handleApolloError(error);

      toast({
        variant: 'destructive',
        title: 'Error logging out.',
        description: messages.join(', '),
      });
    },
  });

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    setLoading(true);

    if (
      !data?.user.email ||
      !data.user.protected_symmetric_key ||
      !workerRef.current
    ) {
      setLoading(false);
      return;
    }

    const message: WorkerMessage = {
      type: 'changePassword',
      payload: {
        email: data.user.email,
        currentPassword: values.current_password,
        newPassword: values.new_password,
        newPasswordHint: values.password_hint,
        currentProtectedSymmetricKey: data.user.protected_symmetric_key,
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
        case 'changePassword': {
          changePassword({
            variables: {
              input: {
                current_master_password_hash:
                  message.payload.currentMasterKeyHash,
                new_master_password_hash: message.payload.newMasterKeyHash,
                new_password_hint: message.payload.newPasswordHint,
                new_protected_symmetric_key:
                  message.payload.newProtectedSymmetricKey,
              },
            },
          });

          break;
        }

        case 'error': {
          if (message.msg === 'invalid MAC') {
            toast({
              variant: 'destructive',
              title: 'Could not change password.',
              description: 'Invalid current password.',
            });
          } else {
            toast({
              variant: 'destructive',
              title: 'Could not change password.',
              description: message.msg,
            });
          }

          setLoading(false);

          break;
        }
      }
    };

    workerRef.current.onerror = error => {
      console.error('Worker error:', error);
      setLoading(false);
    };

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, [changePassword, toast]);

  return (
    <Section
      title="Change Password"
      description="You can change your Master Password used to protect your funds and messages."
    >
      <Dialog
        open={open}
        onOpenChange={() => {
          if (loading) return;

          setOpen(o => !o);

          if (!open) {
            form.reset();
            setClickedGenerate(false);
            setShowPassword(false);
          }
        }}
      >
        <DialogTrigger asChild>
          <Button className="w-full md:w-fit">Change Password</Button>
        </DialogTrigger>

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change your password</DialogTitle>
            <DialogDescription>
              This will change the Master Password used to protect your funds
              and messages.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="current_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Master Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your current password"
                        type="password"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="new_password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex w-full items-center justify-between">
                      <FormLabel>New Master Password</FormLabel>
                      <button
                        type="button"
                        onClick={handleGenerateClick}
                        disabled={loading}
                      >
                        <Badge variant={'secondary'}>
                          Generate Strong Password
                        </Badge>
                      </button>
                    </div>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Super secret password"
                          type={showPassword ? undefined : 'password'}
                          disabled={loading}
                          {...field}
                        />
                        <Button
                          type="button"
                          onClick={() => setShowPassword(p => !p)}
                          size={'icon'}
                          className="px-2"
                          variant={'outline'}
                        >
                          {showPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </Button>
                        {clickedGenerate ? (
                          <Button
                            type="button"
                            onClick={() => copyPassword(password)}
                            size={'icon'}
                            className="px-2"
                            variant={'outline'}
                          >
                            {copiedPassword ? (
                              <CopyCheck color="green" className="size-4" />
                            ) : (
                              <Copy className="size-4" />
                            )}
                          </Button>
                        ) : null}
                      </div>
                    </FormControl>
                    <FormMessage />
                    <Progress value={Math.min(100, (entropy || 0) / 2)} />
                    <FormDescription>
                      <strong>Important: </strong>
                      Your account cannot be recovered if you forget it!
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Master Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Super secret password"
                        type="password"
                        disabled={loading}
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
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <FormDescription>
                      <strong>Important: </strong>
                      The password hint will be stored in clear text.
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accept_condition_1"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pb-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={loading}
                      />
                    </FormControl>
                    <div className="flex flex-col gap-2">
                      <FormLabel>
                        I understand that if I forget the password
                        <strong> my account cannot be recovered.</strong>
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter className="gap-2 sm:justify-center">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Change
                </Button>
                <DialogClose asChild>
                  <Button type="button" variant="secondary" className="w-full">
                    Close
                  </Button>
                </DialogClose>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Section>
  );
};
