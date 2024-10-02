import { Dispatch, FC, useEffect, useMemo } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useCreateOnchainAddressMutation } from '@/graphql/mutations/__generated__/createOnchainAddress.generated';
import { useGetWalletQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LiquidAssetEnum } from '@/graphql/types';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

import { CreateView } from './CreateView';
import { ReceiveAction, ReceiveState } from './Receive';

export const CreateLiquidAddress: FC<{
  state: ReceiveState;
  dispatch: Dispatch<ReceiveAction>;
}> = ({ state, dispatch }) => {
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
      dispatch({
        type: 'receiveString',
        nextString:
          data.wallets.create_onchain_address.bip21 ||
          data.wallets.create_onchain_address.address,
      }),
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

    switch (state.receive) {
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
  }, [createLiquidAddress, liquidAccountId, state.receive]);

  const loading = walletLoading || liquidLoading;
  const error = Boolean(walletError) || Boolean(liquidError);

  return (
    <CreateView
      state={state}
      dispatch={dispatch}
      receiveText={liquidAddressFormatted}
      dataLoading={loading}
      dataError={error}
      createFunction={() => {
        switch (state.receive) {
          case 'Liquid Bitcoin':
            if (state.amountSatsInput !== state.amountSatsSaved) {
              createLiquidAddress({
                variables: {
                  input: {
                    amount: Number(state.amountSatsInput),
                    asset: LiquidAssetEnum.Btc,
                    wallet_account_id: liquidAccountId,
                  },
                },
              });
            }
            break;
          case 'Tether USD':
            if (state.amountUSDInput !== state.amountUSDSaved) {
              createLiquidAddress({
                variables: {
                  input: {
                    amount: Number(state.amountUSDInput) * 100_000_000,
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
