import { gql } from '@apollo/client';

export const PayLightningAddress = gql`
  mutation PayLightningAddress(
    $addressInput: PayLnAddressInput!
    $payInput: PayInput!
  ) {
    pay(input: $payInput) {
      lightning_address(input: $addressInput) {
        wallet_account {
          id
          descriptor
        }
        base_64
      }
    }
  }
`;
