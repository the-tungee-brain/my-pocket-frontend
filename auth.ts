import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import { API_BASE_URL } from '@/lib/config'

type GoogleCallbackResult =
  | { kind: 'allowed'; accessToken: string }
  | { kind: 'waitlist' }
  | { kind: 'error' }

async function exchangeGoogleIdToken(
  idToken: string,
): Promise<GoogleCallbackResult> {
  const res = await fetch(`${API_BASE_URL}/auth/google/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken }),
  })

  if (res.ok) {
    const data = (await res.json()) as { access_token?: string }
    if (!data.access_token) {
      return { kind: 'error' }
    }
    return { kind: 'allowed', accessToken: data.access_token }
  }

  if (res.status === 403) {
    try {
      const data = (await res.json()) as {
        detail?: { code?: string }
      }
      if (data.detail?.code === 'waitlist') {
        return { kind: 'waitlist' }
      }
    } catch {
      // ignore malformed error payloads
    }
  }

  return { kind: 'error' }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // TODO(security): These are server-side auth secrets but currently use NEXT_PUBLIC_* names for deployment compatibility. Verify whether they are exposed in the client bundle before renaming.
  providers: [Google({
    clientId: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID,
    clientSecret: process.env.NEXT_PUBLIC_AUTH_GOOGLE_SECRET
  })],
  session: { strategy: 'jwt' },
  debug: process.env.AUTH_DEBUG === 'true',
  trustHost: true,
  logger: {
    error(code, ...message) {
      console.error('[AUTH ERROR]', code, ...message)
    },
  },
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET,
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === 'google' && account.id_token) {
        const result = await exchangeGoogleIdToken(account.id_token)
        if (result.kind === 'waitlist') {
          return '/waitlist'
        }
        if (result.kind === 'error') {
          console.error('[AUTH ERROR] google signIn callback failed')
          return false
        }
      }
      return true
    },

    async jwt({ token, account }) {
      if (account?.provider === 'google' && account.id_token) {
        try {
          const result = await exchangeGoogleIdToken(account.id_token)
          if (result.kind === 'allowed') {
            ;(token as JWT & { accessToken?: string }).accessToken =
              result.accessToken
          } else if (result.kind === 'waitlist') {
            delete (token as JWT & { accessToken?: string }).accessToken
          } else {
            console.error('[AUTH ERROR] google jwt callback failed')
          }
        } catch (err) {
          console.error('[AUTH ERROR] google jwt callback threw', err)
        }
      }
      return token
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      const accessToken = (token as JWT & { accessToken?: string }).accessToken
      if (accessToken) {
        return {
          ...session,
          accessToken,
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
