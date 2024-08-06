import { gql } from '@apollo/client';

export const TwoFactorOtpAdd = gql`
  mutation TwoFactorOtpAdd {
    two_factor {
      otp {
        add {
          otp_secret
          otp_url
        }
      }
    }
  }
`;

export const TwoFactorOtpVerify = gql`
  mutation TwoFactorOtpVerify($input: TwoFactorOTPVerifyInput!) {
    two_factor {
      otp {
        verify(input: $input)
      }
    }
  }
`;

export const TwoFactorOtpLogin = gql`
  mutation TwoFactorOtpLogin($input: TwoFactorOTPLogin!) {
    login {
      two_factor {
        otp(input: $input) {
          access_token
          refresh_token
        }
      }
    }
  }
`;
