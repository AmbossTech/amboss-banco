import { gql } from '@apollo/client';

export const CreateLightningInvoice = gql`
  mutation CreateLightningInvoice($input: CreateLightingInvoiceInput!) {
    wallets {
      create_lightning_invoice(input: $input) {
        payment_request
      }
    }
  }
`;
