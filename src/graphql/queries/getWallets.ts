import { gql } from '@apollo/client';

export const GetWallets = gql`
  query Query {
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
