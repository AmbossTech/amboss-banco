import { ApolloError, useApolloClient } from '@apollo/client';
import bolt11 from 'bolt11';
import { SquareArrowOutUpRight, Zap } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import {
  PayLightningInvoiceDocument,
  PayLightningInvoiceMutation,
  PayLightningInvoiceMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { ROUTES } from '@/utils/routes';
import { shorten } from '@/utils/string';
import { CryptoWorkerMessage } from '@/workers/crypto/types';

import { PayView } from './PayView';
import { SendView } from './Send';
import { useSendWorker } from './sendWorker';

export const PayLightningInvoice: FC<{
  sendString: string;
  setView: Dispatch<SetStateAction<SendView>>;
  reset: () => void;
  amountSatsInput: string;
  amountUSDInput: string;
  setAmountSatsInput: Dispatch<SetStateAction<string>>;
  setAmountUSDInput: Dispatch<SetStateAction<string>>;
}> = ({
  sendString,
  setView,
  reset,
  amountSatsInput,
  amountUSDInput,
  setAmountSatsInput,
  setAmountUSDInput,
}) => {
  const t = useTranslations();
  const { toast } = useToast();

  const client = useApolloClient();

  const [invoiceNode, setInvoiceNode] = useState('');
  const [invoiceDescription, setInvoiceDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const { payeeNodeKey, tagsObject } = bolt11.decode(sendString);

      if (payeeNodeKey) {
        setInvoiceNode(payeeNodeKey);
        setInvoiceDescription(tagsObject.description || '');
      } else {
        toast({
          variant: 'destructive',
          title: 'Could not decode invoice.',
        });

        return;
      }
    } catch (error) {
      console.log(error);

      toast({
        variant: 'destructive',
        title: 'Could not decode invoice.',
      });

      return;
    }
  }, [sendString, toast]);

  const [value] = useLocalStorage(LOCALSTORAGE_KEYS.currentWalletId, '');
  const keys = useKeyStore(s => s.keys);

  const { data: walletData } = useGetWalletQuery({
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

  const workerRef = useSendWorker(setLoading, setView);

  const payLightningInvoice = async () => {
    if (!workerRef.current || !walletData?.wallets.find_one) {
      return;
    }

    setLoading(true);

    const [result, error] = await toWithError(
      client.mutate<
        PayLightningInvoiceMutation,
        PayLightningInvoiceMutationVariables
      >({
        mutation: PayLightningInvoiceDocument,
        variables: {
          invoiceInput: {
            invoice: sendString,
          },
          payInput: {
            account_id: liquidAccountId,
          },
        },
      })
    );

    if (error) {
      const messages = handleApolloError(error as ApolloError);

      toast({
        variant: 'destructive',
        title: 'Error Sending Money',
        description: messages.join(', '),
      });

      setLoading(false);
      return;
    }

    const invoice = result.data?.pay.lightning_invoice;
    const protectedMnemonic =
      walletData.wallets.find_one.details.protected_mnemonic;

    if (!invoice || !protectedMnemonic || !keys) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: invoice.wallet_account.id,
        mnemonic: protectedMnemonic,
        descriptor: invoice.wallet_account.descriptor,
        pset: invoice.base_64,
        keys,
      },
    };

    workerRef.current.postMessage(message);
  };

  return (
    <PayView
      reset={reset}
      loading={loading}
      UpperBadge={
        <div className="mx-auto flex h-10 w-fit items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
          <p>Lightning Invoice</p>
          <Zap size={16} />
        </div>
      }
      asset="Liquid Bitcoin"
      amountSatsInput={amountSatsInput}
      amountUSDInput={amountUSDInput}
      setAmountSatsInput={setAmountSatsInput}
      setAmountUSDInput={setAmountUSDInput}
      recipient={
        <Link
          href={ROUTES.external.space + '/node/' + invoiceNode}
          target="_blank"
          className="inline-flex items-center text-primary transition-colors hover:text-primary-hover"
        >
          {shorten(invoiceNode)}
          <SquareArrowOutUpRight size={16} className="ml-1" />
        </Link>
      }
      payFunction={payLightningInvoice}
      disableInput={true}
      InvoiceDescription={
        invoiceDescription ? (
          <p className="mt-2 text-center font-medium text-slate-600 dark:text-neutral-400">
            {t('App.Wallet.desc')}: {invoiceDescription}
          </p>
        ) : null
      }
    />
  );
};
