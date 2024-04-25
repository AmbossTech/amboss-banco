import { gql } from '@apollo/client';

export const VerifyPin = gql`
  mutation VerifyPin($pin: String!, $email: String!) {
    publicAuth {
      verifyPin(pin: $pin, email: $email) {
        jwt
      }
    }
  }
`;
