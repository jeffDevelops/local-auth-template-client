import React from 'react'
import { Router } from '@reach/router'
import ProvideApollo from './_context/ProvideApollo'
import UserProvider from './_context/User'
import AuthenticatedRoute from './_components/routes/AuthenticatedRoute/AuthenticatedRoute'
import Home from './Home/Home'

import LogIn from './Auth/LogIn/LogIn'
import Register from './Auth/Register/Register'

const App = () => (
  <ProvideApollo>
    <UserProvider>
      <Router>
        <LogIn path="/log-in" />
        <Register path="/register" />

        <AuthenticatedRoute path="/" component={Home} />
      </Router>
    </UserProvider>
  </ProvideApollo>
)

export default App
