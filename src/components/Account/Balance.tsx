import { FC, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CompressedEntry } from '../../../app/wallet/tabs';
import { Link } from 'expo-router';

export const AccountBalance: FC<{ account: CompressedEntry }> = ({
  account,
}) => {
  const balance = useMemo(() => {
    const {
      balance,
      asset_info: { precision },
    } = account;

    const numberAmount = Number(balance);
    const precisionNumber = Math.pow(10, precision);

    const small = numberAmount % precisionNumber;

    const bigAmount = numberAmount - small;

    const big = bigAmount / precisionNumber;

    return { big, small };
  }, [account]);

  console.log(account.asset_info.ticker);

  return (
    <View className="w-full pb-10 pt-32">
      <View className="flex flex-row items-center justify-center">
        <Text>
          <Text style={{ fontSize: 48, fontWeight: '900', color: 'white' }}>
            {balance.big.toLocaleString()}
          </Text>
          {balance.small ? (
            <Text style={{ fontSize: 32, fontWeight: '900', color: 'white' }}>
              .{balance.small}
            </Text>
          ) : null}
        </Text>
      </View>
      <Text className="text-center text-white">{account.asset_info.name}</Text>
      <View className="flex items-center py-8">
        <Link href="/wallet/accounts" asChild>
          <Pressable className="rounded-lg bg-zinc-900 p-2">
            <Text className="font-bold text-white">Accounts</Text>
          </Pressable>
        </Link>
      </View>
    </View>
  );
};
