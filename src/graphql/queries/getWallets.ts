import { gql } from '@apollo/client';

export const GetWallets = gql`
  query GetWallets {
    wallets {
      id
      find_many {
        id
        name
        accounts {
          id
          name
          account_type
        }
      }
    }
  }
`;
