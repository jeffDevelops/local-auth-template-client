import React, { FC, useContext } from 'react'
import { RouteComponentProps } from '@reach/router'
import { UserContext } from '../_context/User'

const Home: FC<RouteComponentProps> = () => {
  const { logOut } = useContext(UserContext)
  return (
    <>
      Home <button onClick={logOut}>Log Out</button>
    </>
  )
}

export default Home
