export interface Environment {
  environment: 'development' | 'test' | 'production'
  apiHost: string
}

export const env: Environment = (() => {
  switch (true) {
    // Development
    case window.location.origin === 'http://localhost:3000':
      return {
        environment: 'development' as 'development',
        apiHost: 'http://localhost:4000/graphql',
      }

    // Staging
    case !!window.location.origin.match(
      /^https:\/\/budgie-web-(.*)\.vercel\.app$/ // Vercel creates a specific deployment per branch
    ):
      console.warn(
        'You are currently running Budgie in the staging environment: things could be a little shaky.'
      )
      return {
        environment: 'test' as 'test',
        apiHost: 'https://api-budgie-staging.vercel/graphql',
      }

    // Production
    case window.location.origin === 'https://budgie-web.vercel.app':
      return {
        environment: 'production' as 'production',
        apiHost: 'https://api-budgie.vercel.app/graphql',
      }

    default:
      throw new Error(
        `Client running in an unknown environment ${window.location.origin}`
      )
  }
})()
