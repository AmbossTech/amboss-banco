import { gql } from '@apollo/client';

export const PayLightningAddress = gql`
  mutation PayLightningAddress(
    $addressInput: PayLnAddressInput!
    $payInput: PayInput!
  ) {
    pay(input: $payInput) {
      money_address(input: $addressInput) {
        wallet_account {
          id
          descriptor
        }
        base_64
      }
    }
  }
`;

export const PayLiquidAddress = gql`
  mutation PayLiquidAddress(
    $addressInput: PayLiquidAddressInput!
    $payInput: PayInput!
  ) {
    pay(input: $payInput) {
      liquid_address(input: $addressInput) {
        wallet_account {
          id
          descriptor
        }
        base_64
      }
    }
  }
`;

export const PayLightningInvoice = gql`
  mutation PayLightningInvoice(
    $invoiceInput: PayLnInvoiceInput!
    $payInput: PayInput!
  ) {
    pay(input: $payInput) {
      lightning_invoice(input: $invoiceInput) {
        wallet_account {
          id
          descriptor
        }
        base_64
      }
    }
  }
`;

export const PaySwapAddress = gql`
  mutation PaySwapAddress($input: PaySwapAddressInput!, $payInput2: PayInput!) {
    pay(input: $payInput2) {
      swap_address(input: $input) {
        wallet_account {
          id
          descriptor
        }
        base_64
      }
    }
  }
`;
