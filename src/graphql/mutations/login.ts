import { gql } from '@apollo/client';

export const Login = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      id
    }
  }
`;
