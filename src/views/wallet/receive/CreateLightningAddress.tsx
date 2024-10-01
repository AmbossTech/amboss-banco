import { Dispatch, FC, SetStateAction } from 'react';
import { useLocalStorage } from 'usehooks-ts';

import { useToast } from '@/components/ui/use-toast';
import { useGetWalletDetailsQuery } from '@/graphql/queries/__generated__/wallet.generated';
import { LOCALSTORAGE_KEYS } from '@/utils/constants';
import { handleApolloError } from '@/utils/error';

import { CreateView } from './CreateView';
import { ReceiveOptions } from './Receive';

export const CreateLightningAddress: FC<{
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

  const { loading: detailsLoading, error: detailsError } =
    useGetWalletDetailsQuery({
      variables: { id: value },
      onCompleted: data => {
        const first = data.wallets.find_one.money_address[0];
        const code = first.user + '@' + first.domains[0];

        setReceiveString(code);
      },
      onError: err => {
        const messages = handleApolloError(err);

        toast({
          variant: 'destructive',
          title: 'Error getting wallet details.',
          description: messages.join(', '),
        });
      },
    });

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
      receiveText={receiveString}
      dataLoading={detailsLoading}
      dataError={Boolean(detailsError)}
    />
  );
};
