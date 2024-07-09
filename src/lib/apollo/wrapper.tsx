'use client';

import { from, GraphQLRequest, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/experimental-nextjs-app-support';

import {
  RefreshTokenDocument,
  RefreshTokenMutation,
} from '@/graphql/mutations/__generated__/refreshToken.generated';
import { ROUTES } from '@/utils/routes';

import { promiseToObservable } from './utils';

const isRefreshRequest = (operation: GraphQLRequest) => {
  return operation.operationName === 'RefreshToken';
};

const returnTokenDependingOnOperation = (
  accessToken: string = '',
  refreshToken: string = '',
  operation: GraphQLRequest
) => {
  return isRefreshRequest(operation) ? refreshToken : accessToken;
};

const refreshTokens = async (
  serverUrl: string,
  accessToken: string = '',
  refreshToken: string = ''
) => {
  const result = await makeClient(
    serverUrl,
    accessToken,
    refreshToken
  ).mutate<RefreshTokenMutation>({
    mutation: RefreshTokenDocument,
  });

  return result.data?.refreshToken.access_token || '';
};

const makeClient = (
  serverUrl: string,
  accessToken: string | undefined,
  refreshToken: string | undefined
) => {
  const ssrMode = typeof window === 'undefined';

  const authLink = setContext((operation, { headers }) => {
    const token = returnTokenDependingOnOperation(
      accessToken,
      refreshToken,
      operation
    );

    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  const errorLink = onError(
    ({ graphQLErrors, networkError, operation, forward }) => {
      if (graphQLErrors) {
        for (const err of graphQLErrors) {
          switch (err.extensions.code) {
            case 'UNAUTHENTICATED':
              if (operation.operationName === 'refreshToken') return;
              if (ssrMode) return;

              if (!refreshToken) {
                window.location.href = ROUTES.home;
                return;
              }

              return promiseToObservable(
                refreshTokens(serverUrl, accessToken, refreshToken).catch(
                  () => {
                    window.location.href = ROUTES.home;
                  }
                )
              ).flatMap(accessToken => {
                const oldHeaders = operation.getContext().headers;

                operation.setContext({
                  headers: {
                    ...oldHeaders,
                    Authorization: `Bearer ${accessToken}`,
                  },
                });

                return forward(operation);
              });

            default:
              console.log(`[GraphQL error]: ${err}`);
          }
        }
      }

      if (networkError) console.log(`[Network error]: ${networkError}`);
    }
  );

  const httpLink = new HttpLink({
    uri: serverUrl,
    credentials: 'include',
    fetchOptions: { cache: 'no-store' },
  });

  const link = from([authLink, errorLink, httpLink]);

  return new ApolloClient({
    cache: new InMemoryCache(),
    link,
    connectToDevTools: true,
  });
};

export function ApolloWrapper({
  serverUrl,
  accessToken,
  refreshToken,
  children,
}: React.PropsWithChildren<{
  serverUrl: string;
  accessToken: string | undefined;
  refreshToken: string | undefined;
}>) {
  return (
    <ApolloNextAppProvider
      makeClient={() => makeClient(serverUrl, accessToken, refreshToken)}
    >
      {children}
    </ApolloNextAppProvider>
  );
}
