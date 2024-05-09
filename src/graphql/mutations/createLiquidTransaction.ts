import { gql } from '@apollo/client';

export const CreateLiquidTransaction = gql`
  mutation CreateLiquidTransaction($input: CreateLiquidTransactionInput!) {
    wallets {
      create_liquid_transaction(input: $input) {
        base_64
      }
    }
  }
`;
