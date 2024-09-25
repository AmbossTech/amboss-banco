import { ApolloError, useApolloClient } from '@apollo/client';
import { Zap } from 'lucide-react';
import { Dispatch, FC, SetStateAction, useState } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import {
  PayLightningAddressDocument,
  PayLightningAddressMutation,
  PayLightningAddressMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { PaymentOptionCode, PaymentOptionNetwork } from '@/graphql/types';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { CryptoWorkerMessage } from '@/workers/crypto/types';

import { PayView } from './PayView';
import { SelectAsset } from './SelectAsset';
import { Assets, SendType, SendView } from './Send';
import { useSendWorker } from './sendWorker';

export const PayLightningAddress: FC<{
  sendType: SendType;
  asset: Assets;
  setAsset: Dispatch<SetStateAction<Assets>>;
  sendString: string;
  setView: Dispatch<SetStateAction<SendView>>;
  reset: () => void;
  amountSatsInput: string;
  amountUSDInput: string;
  setAmountSatsInput: Dispatch<SetStateAction<string>>;
  setAmountUSDInput: Dispatch<SetStateAction<string>>;
}> = ({
  sendType,
  asset,
  setAsset,
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

  const workerRef = useSendWorker(setLoading, setView);

  const payLightningAddress = async () => {
    if (!workerRef.current || !walletData?.wallets.find_one) {
      return;
    }

    setLoading(true);

    const code =
      sendType === 'lightning-address'
        ? PaymentOptionCode.Lightning
        : asset === 'Liquid Bitcoin'
          ? PaymentOptionCode.Btc
          : PaymentOptionCode.Usdt;

    const network =
      sendType == 'lightning-address'
        ? PaymentOptionNetwork.Bitcoin
        : PaymentOptionNetwork.Liquid;

    const [result, error] = await toWithError(
      client.mutate<
        PayLightningAddressMutation,
        PayLightningAddressMutationVariables
      >({
        mutation: PayLightningAddressDocument,
        variables: {
          payInput: {
            wallet_id: walletData.wallets.find_one.id,
          },
          addressInput: {
            address: sendString,
            amount:
              asset === 'Liquid Bitcoin'
                ? Number(amountSatsInput)
                : Number(amountUSDInput) * 100_000_000,
            payment_option: {
              code,
              network,
            },
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

    const address = result.data?.pay.money_address;
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
        sendType === 'lightning-address' ? (
          <div className="mx-auto flex h-10 w-fit items-center justify-center space-x-2 rounded-xl border border-slate-200 px-4 font-semibold dark:border-neutral-800">
            <p>Lightning Address</p>
            <Zap size={16} />
          </div>
        ) : (
          <SelectAsset loading={loading} asset={asset} setAsset={setAsset} />
        )
      }
      asset={asset}
      amountSatsInput={amountSatsInput}
      amountUSDInput={amountUSDInput}
      setAmountSatsInput={setAmountSatsInput}
      setAmountUSDInput={setAmountUSDInput}
      recipient={sendString}
      payFunction={payLightningAddress}
    />
  );
};
