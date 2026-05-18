import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const body = await req.json()
    const { userName, email, password } = body

    if (!userName || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        userName,
        email,
        passwordHash,
        bitActive: 1
      }
    })

    // Return success (excluding password hash)
    return NextResponse.json({ 
      message: 'User registered successfully',
      user: {
        id: user.userId.toString(), // Convert BigInt to string
        userName: user.userName,
        email: user.email
      }
    }, { status: 201 })

  } catch (error) {
    console.error('[REGISTER_API_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
