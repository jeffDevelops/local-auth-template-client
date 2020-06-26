import React, { FC, useContext } from 'react'
import { Redirect, RouteComponentProps } from '@reach/router'

import { UserContext } from '../../../_context/User'

export interface Props extends RouteComponentProps {
  component: React.ComponentType<RouteComponentProps>
}

const AuthenticatedRoute: FC<Props> = ({
  component: Component,
  ...props
}: Props) => {
  const { user, loading } = useContext(UserContext)

  if (loading) return <div data-testid="auth_loader">Loading...</div>

  if (!!user) {
    return <Component {...props} />
  } else {
    return <Redirect to="/log-in" noThrow />
  }
}

export default AuthenticatedRoute
