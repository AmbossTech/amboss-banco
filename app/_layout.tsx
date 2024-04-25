import { ApolloProvider, gql } from '@apollo/client';
import { Slot } from 'expo-router';
import { deleteItemAsync, getItemAsync } from 'expo-secure-store';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { SessionProvider } from '../src/context/session';
import { createNewApolloClient } from '../src/apollo/client';
import { Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GetUser } from '../src/graphql/queries/getUser';
import { GetUserQuery } from '../src/graphql/queries/__generated__/getUser.generated';

export const AUTH_TOKEN_KEY = 'amboss-banco-api-auth';

type Dispatch = {
  resetClient: () => Promise<void>;
};

const DispatchContext = createContext<Dispatch | undefined>(undefined);

export default function HomeLayout() {
  const [authToken, setAuthToken] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Running useEffect...');
    const checkAuth = async () => {
      const authToken = await getItemAsync(AUTH_TOKEN_KEY);

      console.log('AUTH TOKEN: ', authToken?.slice(0, 10));

      if (!authToken) {
        setAuthToken('');
        setLoading(false);
        return;
      }

      const tempClient = createNewApolloClient(authToken);

      const result = await tempClient.query<GetUserQuery>({
        query: GetUser,
      });

      if (!result.data) {
        await deleteItemAsync(AUTH_TOKEN_KEY);
        setAuthToken('');
        setLoading(false);
        return;
      }

      setAuthToken(authToken);
      setLoading(false);
    };

    checkAuth();
  }, [authToken, loading]);

  const client = useMemo(() => {
    console.log('Creating new client...');
    return createNewApolloClient(authToken);
  }, [authToken]);

  const actions = {
    resetClient: async () => {
      setLoading(true);
    },
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-blue-400">
        <Text>Loading</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <DispatchContext.Provider value={actions}>
        <ApolloProvider client={client}>
          <SessionProvider accountCreated={!!authToken}>
            <Slot />
          </SessionProvider>
        </ApolloProvider>
      </DispatchContext.Provider>
    </SafeAreaProvider>
  );
}

export const useApolloAuthDispatch = () => {
  const context = useContext(DispatchContext);
  if (context === undefined) {
    throw new Error('useApolloAuthDispatch must be used within a AuthProvider');
  }
  return context;
};
