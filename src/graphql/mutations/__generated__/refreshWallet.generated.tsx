/* THIS FILE IS AUTOMATICALLY GENERATED. DO NOT MODIFY. */
/* eslint-disable no-unused-vars, @typescript-eslint/no-unused-vars */
import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';

import * as Types from '../../types';

const defaultOptions = {} as const;
export type RefreshWalletMutationVariables = Types.Exact<{
  input: Types.RefreshWalletInput;
}>;

export type RefreshWalletMutation = {
  __typename?: 'Mutation';
  wallets: { __typename?: 'WalletMutations'; refresh_wallet: boolean };
};

export const RefreshWalletDocument = gql`
  mutation RefreshWallet($input: RefreshWalletInput!) {
    wallets {
      refresh_wallet(input: $input)
    }
  }
`;
export type RefreshWalletMutationFn = Apollo.MutationFunction<
  RefreshWalletMutation,
  RefreshWalletMutationVariables
>;

/**
 * __useRefreshWalletMutation__
 *
 * To run a mutation, you first call `useRefreshWalletMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useRefreshWalletMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [refreshWalletMutation, { data, loading, error }] = useRefreshWalletMutation({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useRefreshWalletMutation(
  baseOptions?: Apollo.MutationHookOptions<
    RefreshWalletMutation,
    RefreshWalletMutationVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<
    RefreshWalletMutation,
    RefreshWalletMutationVariables
  >(RefreshWalletDocument, options);
}
export type RefreshWalletMutationHookResult = ReturnType<
  typeof useRefreshWalletMutation
>;
export type RefreshWalletMutationResult =
  Apollo.MutationResult<RefreshWalletMutation>;
export type RefreshWalletMutationOptions = Apollo.BaseMutationOptions<
  RefreshWalletMutation,
  RefreshWalletMutationVariables
>;
