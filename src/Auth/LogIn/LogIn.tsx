import React, { FC, useContext, useState, useCallback, useEffect } from 'react'
import { RouteComponentProps, navigate, Link } from '@reach/router'
import { useMutation } from '@apollo/react-hooks'
import { LOG_IN } from '../graphql/mutations/logIn'
import { UserContext } from '../../_context/User'
import { Label, Input } from '../styled'

const LogIn: FC<RouteComponentProps> = () => {
  const { setUser } = useContext(UserContext)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [invalidCredentialsError, setInvalidCredentialsError] = useState('')
  const [logIn] = useMutation(LOG_IN)

  useEffect(() => {
    setInvalidCredentialsError('')
  }, [email, password, setInvalidCredentialsError])

  const handleSubmit = useCallback(async () => {
    logIn({ variables: { input: { email, password } } })
      .then((response) => {
        if (response?.data?.login) {
          setUser(response.data.login)
          navigate('/')
        } else if (response?.data?.login === null) {
          setInvalidCredentialsError(
            'A user with that email address and password could not be found. Please check your inputs and try again.'
          )
        }
      })
      .catch((error) => console.error(error))
  }, [email, password, logIn, setUser])

  return (
    <form
      data-testid="logIn_form"
      onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        handleSubmit()
      }}
    >
      {invalidCredentialsError && <p>{invalidCredentialsError}</p>}

      <Label htmlFor="logIn_email">Email</Label>
      <Input
        id="logIn_email"
        name="logIn_email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setEmail(e.target.value)
        }
        type="text"
      />

      <Label htmlFor="logIn_password">Password</Label>
      <Input
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setPassword(e.target.value)
        }
        id="logIn_password"
        name="logIn_password"
        value={password}
        type="password"
      />

      <button type="submit">Log In</button>

      <p>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </form>
  )
}

export default LogIn
