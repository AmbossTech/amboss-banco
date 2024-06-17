'use client';

import { from, GraphQLRequest, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import {
  ApolloNextAppProvider,
  NextSSRApolloClient,
  NextSSRInMemoryCache,
} from '@apollo/experimental-nextjs-app-support/ssr';

import {
  RefreshTokenDocument,
  RefreshTokenMutation,
} from '@/graphql/mutations/__generated__/refreshToken.generated';

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
  accessToken: string = '',
  refreshToken: string = ''
) => {
  const result = await makeClient(
    accessToken,
    refreshToken
  ).mutate<RefreshTokenMutation>({
    mutation: RefreshTokenDocument,
  });

  return result.data?.refreshToken.access_token || '';
};

const makeClient = (
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
                console.log('NO REFRESH TOKEN', { accessToken, refreshToken });
                // window.location.href = ROUTES.home;
                return;
              }

              return promiseToObservable(
                refreshTokens(accessToken, refreshToken).catch(() => {
                  console.log('REFRESHTOKENS ERROR', {
                    accessToken,
                    refreshToken,
                  });
                  // window.location.href = ROUTES.home;
                })
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
    // this needs to be an absolute url, as relative urls cannot be used in SSR
    uri: 'https://api.mibanco.app/api/graphql',
    // uri: 'http://localhost:3000/api/graphql',
    credentials: 'include',
    // credentials: 'same-origin',
    // you can disable result caching here if you want to
    // (this does not work if you are rendering your page with `export const dynamic = "force-static"`)
    fetchOptions: { cache: 'no-store' },
    // you can override the default `fetchOptions` on a per query basis
    // via the `context` property on the options passed as a second argument
    // to an Apollo Client data fetching hook, e.g.:
    // const { data } = useSuspenseQuery(MY_QUERY, { context: { fetchOptions: { cache: "force-cache" }}});
  });

  const link = from([authLink, errorLink, httpLink]);

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link,
    connectToDevTools: true,
  });
};

export function ApolloWrapper({
  accessToken,
  refreshToken,
  children,
}: React.PropsWithChildren<{
  accessToken: string | undefined;
  refreshToken: string | undefined;
}>) {
  return (
    <ApolloNextAppProvider
      makeClient={() => makeClient(accessToken, refreshToken)}
    >
      {children}
    </ApolloNextAppProvider>
  );
}
