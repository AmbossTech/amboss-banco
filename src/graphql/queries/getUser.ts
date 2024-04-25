import { gql } from '@apollo/client';

export const GetUser = gql`
  query GetUser {
    user {
      id
      email
    }
  }
`;
