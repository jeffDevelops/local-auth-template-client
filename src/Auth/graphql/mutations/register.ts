import gql from 'graphql-tag'

export const REGISTER = gql`
  mutation register($input: UserRegistrationInput!) {
    register(input: $input) {
      id
      firstName
      lastName
      email
    }
  }
`
