import { gql } from '@apollo/client';

export const BroadcastLiquidTransaction = gql`
  mutation BroadcastLiquidTransaction(
    $input: BroadcastLiquidTransactionInput!
  ) {
    wallets {
      broadcast_liquid_transaction(input: $input) {
        tx_id
      }
    }
  }
`;
