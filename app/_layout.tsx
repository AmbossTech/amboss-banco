import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import { Slot } from 'expo-router';
import { getItemAsync } from 'expo-secure-store';
import { useEffect, useState } from 'react';

import { SessionProvider } from '../src/context/session';

const client = new ApolloClient({
  uri: 'https://relevant-ruling-crane.ngrok-free.app/graphql',
  cache: new InMemoryCache(),
});

export default function HomeLayout() {
  const [created, setCreated] = useState(false);

  useEffect(() => {
    getItemAsync('pin').then(value => {
      if (value) setCreated(true);
    });
  }, []);

  return (
    <ApolloProvider client={client}>
      <SessionProvider accountCreated={created}>
        <Slot />
      </SessionProvider>
    </ApolloProvider>
  );
}
