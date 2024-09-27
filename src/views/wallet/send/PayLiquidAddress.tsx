import { ApolloError, useApolloClient } from '@apollo/client';
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
  PayLiquidAddressDocument,
  PayLiquidAddressMutation,
  PayLiquidAddressMutationVariables,
} from '@/graphql/mutations/__generated__/pay.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { useKeyStore } from '@/stores/keys';
import { toWithError } from '@/utils/async';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';
import { shorten } from '@/utils/string';
import { CryptoWorkerMessage } from '@/workers/crypto/types';

import { PayView } from './PayView';
import { SelectAsset } from './SelectAsset';
import { Assets, SendView } from './Send';
import { useSendWorker } from './sendWorker';

export const PayLiquidAddress: FC<{
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

  const [sendAll, setSendAll] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (asset === 'Tether USD') {
      setSendAll(false);
    }
  }, [asset]);

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

  const liquidAssetId = useMemo(
    () =>
      walletData?.wallets.find_one.accounts
        .find(a => a.liquid)
        ?.liquid?.assets.find(a => a.asset_info.name === asset)?.asset_id || '',
    [walletData?.wallets.find_one.accounts, asset]
  );

  const workerRef = useSendWorker(setLoading, setView);

  const payLiquidAddress = async () => {
    if (!workerRef.current || !walletData?.wallets.find_one) {
      return;
    }

    if (!liquidAssetId) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Money',
        description: 'Could not find asset ID.',
      });
      return;
    }

    setLoading(true);

    const [result, error] = await toWithError(
      client.mutate<
        PayLiquidAddressMutation,
        PayLiquidAddressMutationVariables
      >({
        mutation: PayLiquidAddressDocument,
        variables: {
          addressInput: {
            recipients: [
              {
                address: sendString,
                amount:
                  asset === 'Liquid Bitcoin'
                    ? amountSatsInput
                    : (Number(amountUSDInput) * 100_000_000).toString(),
                asset_id: liquidAssetId,
              },
            ],
            send_all_lbtc: sendAll,
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

    const address = result.data?.pay.liquid_address;
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
      sendAll={sendAll}
      setSendAll={setSendAll}
      showSendAll={asset === 'Liquid Bitcoin'}
      reset={reset}
      loading={loading}
      UpperBadge={
        <SelectAsset loading={loading} asset={asset} setAsset={setAsset} />
      }
      asset={asset}
      amountSatsInput={amountSatsInput}
      amountUSDInput={amountUSDInput}
      setAmountSatsInput={setAmountSatsInput}
      setAmountUSDInput={setAmountUSDInput}
      recipient={shorten(sendString)}
      payFunction={payLiquidAddress}
    />
  );
};
