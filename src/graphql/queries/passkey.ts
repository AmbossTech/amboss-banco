import { gql } from '@apollo/client';

export const getAccountPasskeys = gql`
  query getAccountPasskeys {
    passkey {
      find_many {
        id
        created_at
        name
        encryption_available
        encryption_enabled
      }
    }
  }
`;
