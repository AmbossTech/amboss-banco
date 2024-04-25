import {
  ApolloClient,
  InMemoryCache,
  createHttpLink,
  from,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

export const createNewApolloClient = (authToken?: string) => {
  const httpLink = createHttpLink({
    uri: 'https://relevant-ruling-crane.ngrok-free.app/graphql',
    credentials: 'include',
  });

  const authLink = setContext((_, { headers }) => {
    return {
      headers: {
        ...headers,
        authorization: authToken ? `Bearer ${authToken}` : '',
        'Amboss-Client': 'amboss-banco',
      },
    };
  });

  const link = from([authLink, httpLink]);

  const client = new ApolloClient({
    credentials: 'include',
    link,
    cache: new InMemoryCache(),
    defaultOptions: {
      query: {
        fetchPolicy: 'cache-first',
        errorPolicy: 'all',
      },
    },
    name: `banco-prod`,
    version: '0.0.1',
  });

  return client;
};
