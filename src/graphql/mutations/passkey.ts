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

export const LoginPasskeyAdd = gql`
  mutation LoginPasskeyAdd {
    passkey {
      add
    }
  }
`;

export const LoginPasskeyVerify = gql`
  mutation LoginPasskeyVerify($options: String!) {
    passkey {
      verify(options: $options)
    }
  }
`;

export const LoginPasskeyInitAuth = gql`
  mutation LoginPasskeyInitAuth($id: String!) {
    passkey {
      init_authenticate(id: $id)
    }
  }
`;

export const LoginPasskeyAuth = gql`
  mutation LoginPasskeyAuth($input: PasskeyAuthenticateInput!) {
    passkey {
      authenticate(input: $input)
    }
  }
`;

export const LoginPasskeyInit = gql`
  mutation LoginPasskeyInit {
    login {
      passkey {
        init {
          options
          session_id
        }
      }
    }
  }
`;

export const LoginPasskey = gql`
  mutation LoginPasskey($input: PasskeyLoginInput!) {
    login {
      passkey {
        login(input: $input) {
          access_token
          refresh_token
        }
      }
    }
  }
`;
