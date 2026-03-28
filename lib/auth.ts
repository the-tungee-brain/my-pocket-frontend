import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

console.log('AUTH_URL (build):', process.env.AUTH_URL)
console.log('AUTH_TRUST_HOST (build):', process.env.AUTH_TRUST_HOST)
console.log('AUTH_SECRET set (build):', !!process.env.AUTH_SECRET)

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  debug: true,
  logger: {
    error(code, ...message) {
      console.error('[AUTH ERROR]', code, ...message)
    },
    warn(code, ...message) {
      console.warn('[AUTH WARN]', code, ...message)
    },
    debug(code, ...message) {
      // console.log('[AUTH DEBUG]', code, ...message)
    },
  },
  // log what the function runtime actually sees
  events: {
    async session() {
      console.log('AUTH_URL (runtime):', process.env.AUTH_URL)
      console.log('AUTH_TRUST_HOST (runtime):', process.env.AUTH_TRUST_HOST)
      console.log('AUTH_SECRET set (runtime):', !!process.env.AUTH_SECRET)
    },
  },
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === 'google' && account.id_token) {
        const res = await fetch(
          'https://thetungeebrain.duckdns.org/api/v1/auth/google/callback',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: account.id_token }),
          },
        )

        if (!res.ok) {
          console.error(
            '[AUTH ERROR] google signIn callback failed',
            res.status,
            await res.text(),
          )
          return false
        }

        return true
      }
      return true
    },

    async jwt({ token, account }) {
      if (account?.provider === 'google' && account.id_token) {
        try {
          const res = await fetch(
            'https://thetungeebrain.duckdns.org/api/v1/auth/google/callback',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id_token: account.id_token }),
            },
          )

          if (!res.ok) {
            console.error(
              '[AUTH ERROR] google jwt callback failed',
              res.status,
              await res.text(),
            )
            return token
          }

          const data = await res.json()
          ;(token as any).accessToken = data.access_token
        } catch (err) {
          console.error('[AUTH ERROR] google jwt callback threw', err)
        }
      }

      return token
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      console.log('AUTH_URL (runtime):', process.env.AUTH_URL)
      console.log('AUTH_TRUST_HOST (runtime):', process.env.AUTH_TRUST_HOST)
      console.log('AUTH_SECRET set (runtime):', !!process.env.AUTH_SECRET)
      if ((token as any)?.accessToken) {
        return {
          ...session,
          accessToken: (token as any).accessToken,
          user: {
            ...session.user,
            id: token.sub ?? undefined,
          },
        }
      }
      return session
    },
  },
})