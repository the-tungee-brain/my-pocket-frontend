import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === 'google' && account.id_token) {
        const res = await fetch('https://thetungeebrain.duckdns.org/api/v1/auth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: account.id_token }),
        })
        if (!res.ok) return false
        return true
      }
      return true
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === 'google' && account.id_token) {
        const res = await fetch('https://thetungeebrain.duckdns.org/api/v1/auth/google/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_token: account.id_token }),
        })
        if (res.ok) {
          const data = await res.json()
          token.accessToken = data.access_token
        }
      }
      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token?.accessToken) {
        return {
          ...session,
          accessToken: token.accessToken,
          user: {
            ...session.user,
            id: token.sub ?? undefined
          }
        }
      }
      return session
    }
  }
})
