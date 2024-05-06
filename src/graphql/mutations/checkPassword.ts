import { gql } from '@apollo/client';

export const Login = gql`
  mutation CheckPassword($password: String!) {
    checkPassword(password: $password)
  }
`;
