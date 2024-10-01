import { ApolloError, useApolloClient } from '@apollo/client';
import { Link } from 'lucide-react';
import { Dispatch, FC, SetStateAction, useMemo, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import {
  PaySwapAddressDocument,
  PaySwapAddressMutation,
  PaySwapAddressMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { PaySwapCurrency, PaySwapNetwork } from '@/graphql/types';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { shorten } from '@/utils/string';
import { CryptoWorkerMessage } from '@/workers/crypto/types';

import { PayView } from './PayView';
import { SendView } from './Send';
import { useSendWorker } from './sendWorker';

export const PayBitcoinAddress: FC<{
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
  const { toast } = useToast();

  const client = useApolloClient();

  const [loading, setLoading] = useState(false);

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

  const payBitcoinAddress = async () => {
    if (!workerRef.current || !walletData?.wallets.find_one) {
      return;
    }

    setLoading(true);

    const [result, error] = await toWithError(
      client.mutate<PaySwapAddressMutation, PaySwapAddressMutationVariables>({
        mutation: PaySwapAddressDocument,
        variables: {
          input: {
            currency: PaySwapCurrency.Btc,
            network: PaySwapNetwork.Bitcoin,
            recipient: { address: sendString, amount: amountSatsInput },
          },
          payInput2: {
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

    const address = result.data?.pay.swap_address;
    const protectedMnemonic =
      walletData.wallets.find_one.details.protected_mnemonic;

    if (!address || !protectedMnemonic || !keys) {
      setLoading(false);
      return;
    }

    const message: CryptoWorkerMessage = {
      type: 'signPset',
      payload: {
        wallet_account_id: address.wallet_account.id,
        mnemonic: protectedMnemonic,
        descriptor: address.wallet_account.descriptor,
        pset: address.base_64,
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
          <p>Bitcoin Address</p>
          <Link size={16} />
        </div>
      }
      asset="Liquid Bitcoin"
      amountSatsInput={amountSatsInput}
      amountUSDInput={amountUSDInput}
      setAmountSatsInput={setAmountSatsInput}
      setAmountUSDInput={setAmountUSDInput}
      recipient={shorten(sendString)}
      payFunction={payBitcoinAddress}
    />
  );
};
