import { Dispatch, FC, SetStateAction, useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useCreateOnchainAddressMutation } from '@/graphql/mutations/__generated__/createOnchainAddress.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LiquidAssetEnum } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

import { CreateView } from './CreateView';
import { ReceiveOptions } from './Receive';

export const CreateLiquidAddress: FC<{
  receive: ReceiveOptions;
  setReceive: Dispatch<SetStateAction<ReceiveOptions>>;
  receiveString: string;
  setReceiveString: Dispatch<SetStateAction<string>>;
  amountUSDInput: string;
  setAmountUSDInput: Dispatch<SetStateAction<string>>;
  amountSatsInput: string;
  setAmountSatsInput: Dispatch<SetStateAction<string>>;
  amountUSDSaved: string;
  setAmountUSDSaved: Dispatch<SetStateAction<string>>;
  amountSatsSaved: string;
  setAmountSatsSaved: Dispatch<SetStateAction<string>>;
}> = ({
  receive,
  setReceive,
  receiveString,
  setReceiveString,
  amountUSDInput,
  setAmountUSDInput,
  amountSatsInput,
  setAmountSatsInput,
  amountUSDSaved,
  setAmountUSDSaved,
  amountSatsSaved,
  setAmountSatsSaved,
}) => {
  const { toast } = useToast();

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

  const [
    createLiquidAddress,
    { data: liquidData, loading: liquidLoading, error: liquidError },
  ] = useCreateOnchainAddressMutation({
    onCompleted: data =>
      setReceiveString(
        data.wallets.create_onchain_address.bip21 ||
          data.wallets.create_onchain_address.address
      ),
    onError: err => {
      const messages = handleApolloError(err);

      toast({
        variant: 'destructive',
        title: 'Error generating Liquid address.',
        description: messages.join(', '),
      });
    },
  });

  const liquidAddressFormatted = useMemo(() => {
    if (!liquidData?.wallets.create_onchain_address.address) {
      return '';
    }

    const address = liquidData.wallets.create_onchain_address.address;
    const formatted = (address.match(/.{1,6}/g) || []).join(' - ');

    return formatted;
  }, [liquidData]);

  useEffect(() => {
    if (!liquidAccountId) return;

    switch (receive) {
      case 'Liquid Bitcoin':
        createLiquidAddress({
          variables: {
            input: {
              asset: LiquidAssetEnum.Btc,
              wallet_account_id: liquidAccountId,
            },
          },
        });
        break;
      case 'Tether USD':
        createLiquidAddress({
          variables: {
            input: {
              asset: LiquidAssetEnum.Usdt,
              wallet_account_id: liquidAccountId,
            },
          },
        });
        break;
    }
  }, [createLiquidAddress, liquidAccountId, receive]);

  const loading = walletLoading || liquidLoading;
  const error = Boolean(walletError) || Boolean(liquidError);

  return (
    <CreateView
      receive={receive}
      setReceive={setReceive}
      receiveString={receiveString}
      setReceiveString={setReceiveString}
      amountUSDInput={amountUSDInput}
      setAmountUSDInput={setAmountUSDInput}
      amountSatsInput={amountSatsInput}
      setAmountSatsInput={setAmountSatsInput}
      amountUSDSaved={amountUSDSaved}
      setAmountUSDSaved={setAmountUSDSaved}
      amountSatsSaved={amountSatsSaved}
      setAmountSatsSaved={setAmountSatsSaved}
      receiveText={liquidAddressFormatted}
      dataLoading={loading}
      dataError={error}
      createFunction={() => {
        switch (receive) {
          case 'Liquid Bitcoin':
            if (amountSatsInput !== amountSatsSaved) {
              createLiquidAddress({
                variables: {
                  input: {
                    amount: Number(amountSatsInput),
                    asset: LiquidAssetEnum.Btc,
                    wallet_account_id: liquidAccountId,
                  },
                },
              });
            }
            break;
          case 'Tether USD':
            if (amountUSDInput !== amountUSDSaved) {
              createLiquidAddress({
                variables: {
                  input: {
                    amount: Number(amountUSDInput) * 100_000_000,
                    asset: LiquidAssetEnum.Usdt,
                    wallet_account_id: liquidAccountId,
                  },
                },
              });
            }
            break;
        }
      }}
    />
  );
};
