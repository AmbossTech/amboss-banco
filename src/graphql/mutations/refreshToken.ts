import { gql } from '@apollo/client';

export const RefreshToken = gql`
  mutation RefreshToken {
    refreshToken {
      id
      access_token
    }
  }
`;
