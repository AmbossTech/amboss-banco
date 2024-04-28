import { gql } from '@apollo/client';

export const GetWalletAccounts = gql`
  query GetWalletAccounts($id: String!) {
    wallets {
      find_one(id: $id) {
        id
        name
        accounts {
          id
          name
          account_type
          liquid_assets {
            id
            asset_id
            balance
            asset_info {
              name
              ticker
              precision
              is_featured
            }
            transactions {
              id
              balance
              blinded_url
              unblinded_url
              tx_id
              fee
              date
              block_height
            }
          }
        }
      }
    }
  }
`;
