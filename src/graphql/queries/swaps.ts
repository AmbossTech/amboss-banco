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
          }
        }
      }
    }
  }
`;
