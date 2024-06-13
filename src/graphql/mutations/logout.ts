import { gql } from '@apollo/client';

export const Logout = gql`
  mutation Logout {
    logout
  }
`;
