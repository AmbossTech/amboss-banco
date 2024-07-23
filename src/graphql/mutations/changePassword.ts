import { gql } from '@apollo/client';

export const ChangePassword = gql`
  mutation ChangePassword($input: ChangePasswordInput!) {
    password {
      change(input: $input)
    }
  }
`;
