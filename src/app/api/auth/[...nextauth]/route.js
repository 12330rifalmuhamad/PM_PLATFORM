import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Patch untuk error serialisasi BigInt
BigInt.prototype.toJSON = function () {
  return this.toString()
}

const prisma = new PrismaClient()

// PASTIKAN ADA KATA KUNCI 'export' DI SINI
export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user) {
          console.error(`[AUTH] GAGAL: Pengguna ${credentials.email} tidak ditemukan.`)

          return null
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isPasswordValid) {
          console.error(`[AUTH] GAGAL: Password salah untuk pengguna ${credentials.email}.`)

          return null
        }

        console.log(`[AUTH] BERHASIL: Login berhasil untuk ${credentials.email}.`)

        return {
          id: user.userId.toString(),
          name: user.userName,
          email: user.email,
          image: user.txtImage || null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.name = user.name
        token.email = user.email
        // Instead of storing the whole image, we store a flag or the URL
        token.picture = user.image ? `/api/user/image?t=${Date.now()}` : null
      }

      // Handle session.update() from the client
      if (trigger === 'update' && session?.user) {
        token.name = session.user.name || token.name
        token.email = session.user.email || token.email
        // Force the URL with a timestamp to bust cache
        token.picture = `/api/user/image?v=${Date.now()}`
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.name = token.name
        session.user.email = token.email
        session.user.image = token.picture
      }

      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
