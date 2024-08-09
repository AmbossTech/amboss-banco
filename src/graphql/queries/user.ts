import { gql } from '@apollo/client';

export const User = gql`
  query User {
    user {
      id
      email
      using_passkey_id
      protected_symmetric_key
      default_wallet_id
      wallet {
        id
        wallet_limit
      }
    }
  }
`;
