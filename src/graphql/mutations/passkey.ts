import { gql } from '@apollo/client';

export const TwoFactorPasskeyAdd = gql`
  mutation TwoFactorPasskeyAdd {
    two_factor {
      passkey {
        add {
          options
        }
      }
    }
  }
`;

export const TwoFactorPasskeyVerify = gql`
  mutation TwoFactorPasskeyVerify($options: String!) {
    two_factor {
      passkey {
        verify(options: $options)
      }
    }
  }
`;

export const TwoFactorPasskeyAuthInit = gql`
  mutation TwoFactorPasskeyAuthInit($input: TwoFactorPasskeyAuthInput!) {
    login {
      two_factor {
        passkey {
          options(input: $input)
        }
      }
    }
  }
`;

export const TwoFactorPasskeyAuthLogin = gql`
  mutation TwoFactorPasskeyAuthLogin($input: TwoFactorPasskeyAuthLoginInput!) {
    login {
      two_factor {
        passkey {
          login(input: $input) {
            access_token
            refresh_token
          }
        }
      }
    }
  }
`;
