import { NextAuthOptions } from 'next-auth'
import GithubProvider from 'next-auth/providers/github'
import { githubConnections, type GitHubConnection } from './redis'

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || 'dummy-client-id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'dummy-client-secret',
      authorization: {
        params: {
          scope: 'read:user user:email repo',
          // Explicitly request private repo access
          allow_signup: true,
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
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