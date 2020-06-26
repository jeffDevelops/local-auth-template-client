import { useCallback } from 'react'
import { useQuery } from '@apollo/react-hooks'
import { DocumentNode } from 'graphql'

export const useImperativeQuery = (query: DocumentNode, options = {}) => {
  const { refetch } = useQuery(query, { skip: true, ...options })

  const imperativelyCallQuery = useCallback(
    async (variables?: Record<string, any>) => {
      return await refetch(variables)
    },
    [refetch]
  )

  return imperativelyCallQuery
}
