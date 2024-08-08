import { gql } from '@apollo/client';

export const GetWalletSwaps = gql`
  query getAccountTwoFactorMethods {
    two_factor {
      id
      find_many {
        id
        created_at
        method
        enabled
        passkey_name
      }
    }
  }
`;
