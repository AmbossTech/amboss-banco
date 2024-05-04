import { gql } from '@apollo/client';

export const SignUp = gql`
  mutation SignUp($input: SignUpInput!) {
    signUp(input: $input)
  }
`;
