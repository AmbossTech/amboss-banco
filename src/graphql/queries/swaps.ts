import { gql } from '@apollo/client';

export const GetWalletSwaps = gql`
  query getWalletSwaps($id: String!) {
    wallets {
      id
      find_one(id: $id) {
        id
        swaps {
          id
          find_many {
            id
            created_at
            provider
            deposit_coin
            deposit_amount
            settle_coin
            settle_amount
          }
        }
      }
    }
  }
`;
