import { ApolloClient, InMemoryCache, gql } from '@apollo/client'

const API_URL = 'https://api.lens.dev'

/* create the API client */
export const client = new ApolloClient({
  uri: API_URL,
  cache: new InMemoryCache()
})

export const getProfiles = gql`
query profiles(
  $addresses: [EthereumAddress!]
) {
  profiles(request: {
    ownedBy: $addresses
  }) {
    items {
      id
    }
  }
}
`

export const getFollowers = gql`
query Followers($profileId: ProfileId!) {
  followers(request: { 
        profileId: $profileId,
        limit: 50
      }) {
       items {
      wallet {
        address
        defaultProfile {
          id
          name
          bio
          handle
          picture {
            ... on NftImage {
              contractAddress
              tokenId
              uri
              verified
            }
            ... on MediaSet {
              original {
                url
                mimeType
              }
            }
          }
        }
      }
    }
  }
}
`