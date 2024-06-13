import { gql } from '@apollo/client';

export const CreateWallet = gql`
  mutation CreateWallet($input: CreateWalletInput!) {
    wallets {
      create(input: $input) {
        id
      }
    }
  }
`;
