import { FC, useMemo, useState } from 'react';
import { CompressedEntry } from '../../../app/wallet/tabs';
import { Pressable, Text, View } from 'react-native';
import { numberWithPrecision } from '../../utils/numbers';
import { formatDate } from '../../utils/dates';

export const AccountTransactions: FC<{ account: CompressedEntry }> = ({
  account,
}) => {
  const [showMore, setShowMore] = useState(false);

  const slicedTxs = useMemo(() => {
    if (showMore) return account.transactions;
    return account.transactions.slice(0, 3);
  }, [showMore, account]);

  const showButton = useMemo(() => {
    return account.transactions.length > 3;
  }, [account]);

  return (
    <View className="flex w-full items-center justify-center px-4 pb-20">
      <View className="flex w-full items-center justify-center rounded-lg bg-zinc-900 py-2">
        {slicedTxs.map(tx => (
          <View
            key={tx.id}
            className="my-1 flex w-full flex-row items-center justify-between  px-6 py-4"
          >
            <Text className="font-bold text-white">
              {tx.date ? formatDate(tx.date) : '-'}
            </Text>
            <Text>
              <Text className="mr-4 text-lg font-bold text-white">
                {numberWithPrecision(tx.balance, account.asset_info.precision)}
              </Text>{' '}
              <Text className="font-bold text-white">
                {account.asset_info.ticker}
              </Text>
            </Text>
          </View>
        ))}
        {showButton ? (
          <Pressable className="my-5" onPress={() => setShowMore(p => !p)}>
            <Text className="font-black text-white">
              {showMore ? 'Show Less' : 'Show More'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};
