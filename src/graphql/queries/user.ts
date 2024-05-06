import { gql } from '@apollo/client';

export const User = gql`
  query User {
    user {
      id
      email
    }
  }
`;
