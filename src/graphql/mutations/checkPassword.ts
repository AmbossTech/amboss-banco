import { gql } from '@apollo/client';

export const CheckPassword = gql`
  mutation CheckPassword($password: String!) {
    password {
      check(password: $password)
    }
  }
`;
