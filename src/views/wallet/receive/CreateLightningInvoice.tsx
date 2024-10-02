import { useTranslations } from 'next-intl';
import { Dispatch, FC, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { Button } from '@/components/ui/button-v2';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { useToast } from '@/components/ui/use-toast';
import { useCreateLightningInvoiceMutation } from '@/graphql/mutations/__generated__/createInvoice.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { shorten } from '@/utils/string';

import { CreateView } from './CreateView';
import { ReceiveAction, ReceiveState } from './Receive';

export const CreateLightningInvoice: FC<{
  state: ReceiveState;
  dispatch: Dispatch<ReceiveAction>;
}> = ({ state, dispatch }) => {
  const t = useTranslations('App');
  const { toast } = useToast();

  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [descriptionSaved, setDescriptionSaved] = useState('');

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');

  const {
    data: walletData,
    loading: walletLoading,
    error: walletError,
  } = useGetWalletQuery({
    variables: { id: value },
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error getting wallet.',
        description: messages.join(', '),
      });
    },
  });

  const liquidAccountId = useMemo(
    () => walletData?.wallets.find_one.accounts.find(a => a.liquid)?.id || '',
    [walletData?.wallets.find_one.accounts]
  );

  const [createLightningInvoice, { loading: invoiceLoading }] =
    useCreateLightningInvoiceMutation({
      variables: {
        input: {
          amount: Number(state.amountSatsInput),
          invoice_description: description,
          wallet_account_id: liquidAccountId,
        },
      },
      onCompleted: data => {
        dispatch({
          type: 'receiveString',
          nextString: data.wallets.create_lightning_invoice.payment_request,
        });
      },
      onError: err => {
        dispatch({ type: 'reset' });
        setDescription('');
        setDescriptionSaved('');

        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error generating Lightning invoice.',
          description: messages.join(', '),
        });
      },
    });

  const loading = walletLoading || invoiceLoading;

  return (
    <CreateView
      state={state}
      dispatch={dispatch}
      receiveText={
        state.receiveString
          ? shorten(state.receiveString, 12)
          : t('Wallet.amount')
      }
      dataLoading={loading}
      dataError={Boolean(walletError)}
      createFunction={() => {
        if (state.amountSatsInput !== state.amountSatsSaved) {
          createLightningInvoice();
        }
      }}
      Description={
        <Drawer
          open={descriptionOpen}
          onOpenChange={setDescriptionOpen}
          onClose={() => {
            setTimeout(() => {
              setDescription(descriptionSaved);
            }, 1000);
          }}
        >
          <DrawerTrigger asChild disabled={loading}>
            <button className="w-full text-center text-primary transition-colors hover:text-primary-hover">
              {descriptionSaved
                ? '- ' + t('Wallet.edit-desc')
                : '+ ' + t('Wallet.add-desc')}
            </button>
          </DrawerTrigger>

          <DrawerContent>
            <input
              autoFocus
              id="description"
              type="text"
              value={description}
              onChange={e => {
                setDescription(e.target.value);
              }}
              className="mt-16 w-full border-b border-primary bg-transparent pb-px text-center text-5xl font-medium focus:outline-none"
            />

            <label
              htmlFor="description"
              className="mb-16 mt-6 block text-center text-sm"
            >
              {t('Wallet.enter-desc')}
            </label>

            <Button
              onClick={() => {
                setDescriptionSaved(description);

                if (
                  description !== descriptionSaved &&
                  Number(state.amountSatsInput)
                ) {
                  createLightningInvoice();
                }

                setDescriptionOpen(false);
              }}
              disabled={!description}
              className="mb-4 w-full"
            >
              {t('save')}
            </Button>
          </DrawerContent>
        </Drawer>
      }
    />
  );
};
