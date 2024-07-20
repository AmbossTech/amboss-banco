import { gql } from '@apollo/client';

export const User = gql`
  query User {
    user {
      id
      email
      protected_symmetric_key
      default_wallet_id
    }
  }
`;
