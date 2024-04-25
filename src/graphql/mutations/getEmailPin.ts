import { gql } from '@apollo/client';

export const GetEmailPin = gql`
  mutation GetEmailPin($email: String!) {
    publicAuth {
      getEmailPin(email: $email) {
        email
      }
    }
  }
`;
