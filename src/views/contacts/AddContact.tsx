'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { Dispatch, FC, SetStateAction } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToast } from '@/components/ui/use-toast';
import { useCreateContactMutation } from '@/graphql/mutations/__generated__/contact.generated';
import { GetWalletContactsDocument } from '@/graphql/queries/__generated__/contacts.generated';
import { handleApolloError } from '@/utils/error';

const formSchema = z.object({
  money_address: z.string().min(1, {
    message: 'A lightning address is required to create a new contact.',
  }),
});

export const AddContact: FC<{
  walletId: string;
  setOpenDialog: Dispatch<SetStateAction<boolean>>;
}> = ({ walletId, setOpenDialog }) => {
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      money_address: '',
    },
  });

  const [create, { loading }] = useCreateContactMutation({
    onCompleted: () => {
      setOpenDialog(false);
      toast({
        variant: 'default',
        title: 'Contact Added',
        description: 'New contact has been added successfully',
      });
      form.reset();
    },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error Adding Contact',
        description: messages.join(', '),
      });
    },
    refetchQueries: [
      { query: GetWalletContactsDocument, variables: { id: walletId } },
    ],
  });

  const handleSubmit = async (formData: z.infer<typeof formSchema>) => {
    create({
      variables: {
        input: {
          wallet_id: walletId,
          money_address: formData.money_address,
        },
      },
    });
  };

  return (
    <DialogContent className="mt-4">
      <DialogHeader>
        <DialogTitle>New Contact</DialogTitle>
        <DialogDescription>
          Add a contact to start sending them messages or money.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="w-full space-y-6"
        >
          <FormField
            control={form.control}
            name="money_address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Lightning Address</FormLabel>
                <FormControl>
                  <Input
                    type="money_address"
                    placeholder="satoshi@nakamoto.com"
                    autoComplete="off"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
                <FormDescription>
                  Input the lightning address from the new contact.
                </FormDescription>
              </FormItem>
            )}
          />

          <Button type="submit" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create
          </Button>
        </form>
      </Form>
    </DialogContent>
  );
};
