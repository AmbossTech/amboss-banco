import { gql } from '@apollo/client';

export const CreateOnchainAddressSwap = gql`
  mutation CreateOnchainAddressSwap($input: ReceiveSwapInput!) {
    wallets {
      create_onchain_address_swap(input: $input) {
        bip21
        id
        receive_address
      }
    }
  }
`;
