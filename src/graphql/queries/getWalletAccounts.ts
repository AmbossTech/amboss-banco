import { gql } from '@apollo/client';

export const GetWalletAccounts = gql`
  query GetWalletAccounts($findOneId: String!) {
    wallets {
      id
      find_one(id: $findOneId) {
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
              id
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
            }
          }
        }
      }
    }
  }
`;
