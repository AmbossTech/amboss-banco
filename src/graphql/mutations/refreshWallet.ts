import { gql } from '@apollo/client';

export const RefreshWallet = gql`
  mutation RefreshWallet($input: RefreshWalletInput!) {
    wallets {
      refresh_wallet(input: $input)
    }
  }
`;
