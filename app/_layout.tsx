import { ApolloProvider, gql } from '@apollo/client';
import { Slot } from 'expo-router';
import { deleteItemAsync, getItemAsync } from 'expo-secure-store';
import { useEffect, useMemo, useState } from 'react';
import { createNewApolloClient } from '../src/apollo/client';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GetUser } from '../src/graphql/queries/getUser';
import { GetUserQuery } from '../src/graphql/queries/__generated__/getUser.generated';
import { useSessionStore } from '../src/stores/SessionStore';
import { STORAGE_KEYS } from '../src/constants';

export default function HomeLayout() {
  const [loading, setLoading] = useState(true);

  const authToken = useSessionStore(s => s.authToken);
  const setAuthToken = useSessionStore(state => state.setAuthToken);

  useEffect(() => {
    console.log('Running useEffect...');
    const checkAuth = async () => {
      const authToken = await getItemAsync(STORAGE_KEYS.authToken);

      console.log('AUTH TOKEN: ', authToken?.slice(0, 10));

      if (!authToken) {
        setLoading(false);
        return;
      }

      const tempClient = createNewApolloClient(authToken);

      const result = await tempClient.query<GetUserQuery>({
        query: GetUser,
      });

      if (!result.data) {
        await deleteItemAsync(STORAGE_KEYS.authToken);
        setLoading(false);
        return;
      }

      setAuthToken(authToken);
      setLoading(false);
    };

    checkAuth();
  }, [loading]);

  const client = useMemo(() => {
    console.log('Creating new client...');
    return createNewApolloClient(authToken);
  }, [authToken]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-blue-400">
        <Text>Loading</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ApolloProvider client={client}>
        <Slot />
      </ApolloProvider>
    </SafeAreaProvider>
  );
}
