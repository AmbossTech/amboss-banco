/* THIS FILE IS AUTOMATICALLY GENERATED. DO NOT MODIFY. */
/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';

import * as Types from '../../types';

const defaultOptions = {} as const;
export type GetPricesHistoricalQueryVariables = Types.Exact<{
  input: Types.PriceChartInput;
}>;

export type GetPricesHistoricalQuery = {
  __typename?: 'Query';
  prices: {
    __typename?: 'PriceQueries';
    id: string;
    historical: {
      __typename?: 'PriceHistorical';
      id: string;
      interval: string;
      points: Array<{
        __typename?: 'PricePoint';
        currency: string;
        date: string;
        id: string;
        value?: number | null;
      }>;
    };
  };
};

export type GetPriceCurrentQueryVariables = Types.Exact<{
  [key: string]: never;
}>;

export type GetPriceCurrentQuery = {
  __typename?: 'Query';
  prices: {
    __typename?: 'PriceQueries';
    id: string;
    current: {
      __typename?: 'PricePoint';
      currency: string;
      date: string;
      id: string;
      value?: number | null;
    };
  };
};

export const GetPricesHistoricalDocument = gql`
  query getPricesHistorical($input: PriceChartInput!) {
    prices {
      id
      historical(input: $input) {
        id
        interval
        points {
          currency
          date
          id
          value
        }
      }
    }
  }
`;

/**
 * __useGetPricesHistoricalQuery__
 *
 * To run a query within a React component, call `useGetPricesHistoricalQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPricesHistoricalQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPricesHistoricalQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useGetPricesHistoricalQuery(
  baseOptions: Apollo.QueryHookOptions<
    GetPricesHistoricalQuery,
    GetPricesHistoricalQueryVariables
  > &
    (
      | { variables: GetPricesHistoricalQueryVariables; skip?: boolean }
      | { skip: boolean }
    )
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<
    GetPricesHistoricalQuery,
    GetPricesHistoricalQueryVariables
  >(GetPricesHistoricalDocument, options);
}
export function useGetPricesHistoricalLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetPricesHistoricalQuery,
    GetPricesHistoricalQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetPricesHistoricalQuery,
    GetPricesHistoricalQueryVariables
  >(GetPricesHistoricalDocument, options);
}
export function useGetPricesHistoricalSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetPricesHistoricalQuery,
    GetPricesHistoricalQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetPricesHistoricalQuery,
    GetPricesHistoricalQueryVariables
  >(GetPricesHistoricalDocument, options);
}
export type GetPricesHistoricalQueryHookResult = ReturnType<
  typeof useGetPricesHistoricalQuery
>;
export type GetPricesHistoricalLazyQueryHookResult = ReturnType<
  typeof useGetPricesHistoricalLazyQuery
>;
export type GetPricesHistoricalSuspenseQueryHookResult = ReturnType<
  typeof useGetPricesHistoricalSuspenseQuery
>;
export type GetPricesHistoricalQueryResult = Apollo.QueryResult<
  GetPricesHistoricalQuery,
  GetPricesHistoricalQueryVariables
>;
export const GetPriceCurrentDocument = gql`
  query getPriceCurrent {
    prices {
      current {
        currency
        date
        id
        value
      }
      id
    }
  }
`;

/**
 * __useGetPriceCurrentQuery__
 *
 * To run a query within a React component, call `useGetPriceCurrentQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPriceCurrentQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPriceCurrentQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPriceCurrentQuery(
  baseOptions?: Apollo.QueryHookOptions<
    GetPriceCurrentQuery,
    GetPriceCurrentQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetPriceCurrentQuery, GetPriceCurrentQueryVariables>(
    GetPriceCurrentDocument,
    options
  );
}
export function useGetPriceCurrentLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    GetPriceCurrentQuery,
    GetPriceCurrentQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<
    GetPriceCurrentQuery,
    GetPriceCurrentQueryVariables
  >(GetPriceCurrentDocument, options);
}
export function useGetPriceCurrentSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    GetPriceCurrentQuery,
    GetPriceCurrentQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<
    GetPriceCurrentQuery,
    GetPriceCurrentQueryVariables
  >(GetPriceCurrentDocument, options);
}
export type GetPriceCurrentQueryHookResult = ReturnType<
  typeof useGetPriceCurrentQuery
>;
export type GetPriceCurrentLazyQueryHookResult = ReturnType<
  typeof useGetPriceCurrentLazyQuery
>;
export type GetPriceCurrentSuspenseQueryHookResult = ReturnType<
  typeof useGetPriceCurrentSuspenseQuery
>;
export type GetPriceCurrentQueryResult = Apollo.QueryResult<
  GetPriceCurrentQuery,
  GetPriceCurrentQueryVariables
>;