import { gql } from '@apollo/client';

export const User = gql`
  query User {
    user {
      id
      email
      symmetric_key_iv
      default_wallet_id
    }
  }
`;
