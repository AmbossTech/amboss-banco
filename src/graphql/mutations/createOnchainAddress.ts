import { gql } from '@apollo/client';

export const CreateOnchainAddress = gql`
  mutation CreateOnchainAddress($input: CreateOnchainAddressInput!) {
    wallets {
      create_onchain_address(input: $input) {
        address
        bip21
        network
      }
    }
  }
`;
