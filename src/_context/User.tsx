import React, {
  FC,
  createContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react'
import { useMutation } from '@apollo/react-hooks'
import { DBUser } from '../_types/interfaces/User'
import { useImperativeQuery } from '../_hooks/useImperativeQuery'
import { LOG_OUT } from '../_graphql/mutations/logOut'
import { GET_CURRENT_USER } from '../_graphql/queries/getCurrentUser'

export interface UserContextValue {
  user: DBUser | null
  loading: boolean
  setUser: Dispatch<SetStateAction<DBUser | null>>
  logOut(): Promise<void>
}

export const UserContext = createContext({} as UserContextValue)

interface Props {
  children: ReactNode | ReactNode[]
}

const UserProvider: FC<Props> = ({ children }: Props) => {
  const [user, setUser] = useState<DBUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [tried, setTried] = useState(false)
  const [logOutMutation] = useMutation(LOG_OUT)

  const fetchCurrentUser = useImperativeQuery(GET_CURRENT_USER)

  useEffect(() => {
    if (!tried) {
      setTried(true)
      fetchCurrentUser()
        .then((response) => {
          if (response?.data) {
            setUser(response.data.currentUser)
            setLoading(false)
          }
        })
        .catch((error) => {
          console.error(error)
          setLoading(false)
        })
    }
  }, [fetchCurrentUser, tried])

  const logOut = useCallback(async () => {
    setLoading(true)
    await logOutMutation()
    setUser(null)
    setLoading(false)
  }, [logOutMutation, setUser])

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        logOut,
        setUser,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider
