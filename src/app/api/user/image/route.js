import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prisma from '@/libs/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const userId = BigInt(session.user.id)
    const user = await prisma.user.findUnique({
      where: { userId },
      select: { txtImage: true }
    })

    if (!user?.txtImage) {
      // Return a default transparent pixel or a default avatar if you have one
      return new Response('', { status: 404 })
    }

    if (user.txtImage.startsWith('http://') || user.txtImage.startsWith('https://')) {
      return NextResponse.redirect(user.txtImage)
    }

    // Extract content type and base64 data
    const matches = user.txtImage.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/)
    
    if (!matches || matches.length !== 3) {
      return new Response('Invalid image data', { status: 500 })
    }

    const contentType = matches[1]
    const buffer = Buffer.from(matches[2], 'base64')

    return new Response(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      }
    })
  } catch (error) {
    console.error('Failed to serve profile image:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}
