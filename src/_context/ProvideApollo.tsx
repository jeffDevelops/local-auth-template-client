import React, { FC, createContext, useMemo, ReactNode } from 'react'
import { ApolloClient } from 'apollo-client'
import { ApolloProvider } from '@apollo/react-hooks'
import { InMemoryCache } from 'apollo-cache-inmemory'
import { HttpLink } from 'apollo-link-http'
import { onError } from 'apollo-link-error'
import { env } from '../_environments/env'

/**
 *  ApolloClient PROVIDER WRAPPER CONTEXT
 *
 *  In order to render some JSX in the event that a registered afterware error handler
 *  gets triggered, it needs to be accessible to the component hierarchy.
 *
 *  This context provider provides an ApolloClient singleton to the application and
 *  serves as a place to register global errors (errors handled the same way
 *  for every instance of a given error; analogous to Axios interceptors).
 */

const ApolloContext = createContext({})

const cache = new InMemoryCache()
const link = new HttpLink({ uri: env.apiHost, credentials: 'include' })

interface Props {
  children: ReactNode | ReactNode[]
}

const ProvideApollo: FC<Props> = ({ children }: Props) => {
  const afterwareLink = useMemo(
    () =>
      onError(({ networkError }) => {
        // Intercepted errors go here...
        // if (networkError.statusCode === 403) render an unauthorized notification
      }),
    []
  )

  const client = useMemo(
    () =>
      new ApolloClient({
        cache,
        link: afterwareLink.concat(link),
        name: 'web-client', // Client awareness
        defaultOptions: {
          watchQuery: {
            fetchPolicy: 'no-cache',
          },
          query: {
            fetchPolicy: 'no-cache',
          },
        },
      }),
    [afterwareLink]
  )

  return (
    <ApolloContext.Provider value={{}}>
      <ApolloProvider client={client}>{children}</ApolloProvider>
    </ApolloContext.Provider>
  )
}

export default ProvideApollo
