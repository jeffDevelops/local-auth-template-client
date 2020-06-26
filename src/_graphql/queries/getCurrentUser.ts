import gql from 'graphql-tag'

export const GET_CURRENT_USER = gql`
  query currentUser {
    currentUser {
      id
      email
      firstName
      lastName
    }
  }
`
