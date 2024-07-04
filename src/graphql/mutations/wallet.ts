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

export const ChangeWalletName = gql`
  mutation ChangeWalletName($id: String!, $name: String!) {
    wallets {
      change_name(id: $id, name: $name)
    }
  }
`;
