import { gql } from '@apollo/client';

export const Login = gql`
  mutation Login($input: LoginInput!) {
    login {
      initial(input: $input) {
        id
        two_factor {
          session_id
          methods {
            id
            created_at
            method
            enabled
          }
        }
      }
    }
  }
`;
