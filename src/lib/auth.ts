import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { githubConnections, type GitHubConnection } from './redis'
import { userProfiles } from './services/user-storage'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
      authorization: {
        url: "https://github.com/login/oauth/authorize",
        params: {
          scope: 'read:user user:email repo',
          allow_signup: true,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('GitHub SignIn Callback Debug:')
        console.log('- Provider:', account?.provider)
        console.log('- Has access token:', !!account?.access_token)
        console.log('- Token scope from account:', account?.scope)
        console.log('- Full account object:', JSON.stringify(account, null, 2))
      }
      
      if (account?.provider === 'github' && account.access_token) {
        // Store GitHub tokens in Redis
        const connection: GitHubConnection = {
          id: user.id,
          userId: user.id,
          accessToken: account.access_token,
          refreshToken: account.refresh_token || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        
        await githubConnections.set(user.id, connection)
        
        // Create or update user profile
        await userProfiles.createOrUpdate(user.id, {
          email: user.email || '',
          name: user.name || profile?.name,
          image: user.image || (profile as { avatar_url?: string })?.avatar_url,
        })
      }
      return true
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      if (account) {
        token.accessToken = account.access_token
      }
      return token
    },
  },
  pages: {
    signIn: '/settings',
    error: '/settings',
  },
  secret: process.env.NEXTAUTH_SECRET || 'dummy-secret-for-build',
}

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email?: string | null
      name?: string | null
      image?: string | null
    }
  }
}
